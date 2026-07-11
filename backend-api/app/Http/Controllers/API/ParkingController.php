<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Parking;
use App\Support\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ParkingController extends Controller
{
    public function index(Request $request) {
        $userLat = $request->input('latitude');
        $userLng = $request->input('longitude');
        $hasUserLocation = is_numeric($userLat) && is_numeric($userLng);

        $query = Parking::query();

        if ($hasUserLocation) {
            $query->selectRaw("
                parkings.*,
                CASE
                    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN
                        (6371 * acos(
                            cos(radians(?)) *
                            cos(radians(latitude)) *
                            cos(radians(longitude) - radians(?)) +
                            sin(radians(?)) *
                            sin(radians(latitude))
                        ))
                    ELSE NULL
                END AS calculated_distance
            ", [$userLat, $userLng, $userLat]);
        }

        if ($request->filled('q')) {
            $search = trim($request->input('q'));

            $query->where(function ($parkingQuery) use ($search) {
                $parkingQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('distance', 'like', "%{$search}%")
                    ->orWhere('price_per_hour', 'like', "%{$search}%");
            });
        }

        if ($hasUserLocation) {
            $query->orderByRaw('calculated_distance IS NULL ASC')
                ->orderBy('calculated_distance');
        } else {
            $query->orderByRaw("CAST(distance AS DECIMAL(10, 2)) ASC");
        }

        $query->latest('id');

        $params = CacheKeys::requestParams($request, ['page', 'per_page', 'q', 'latitude', 'longitude']);
        $cacheKey = CacheKeys::make('public-parkings', $params);
        $ttl = $hasUserLocation ? 60 : 300;

        $payload = Cache::remember($cacheKey, $ttl, function () use ($query, $request) {
            if ($request->has('page') || $request->has('per_page') || $request->filled('q')) {
                $perPage = min(max((int) $request->input('per_page', 9), 1), 24);

                return $query->paginate($perPage);
            }

            return $query->get();
        });

        return response()->json($payload);
    }

    public function show($identifier) {
        return Parking::with('slots')
            ->where(function ($query) use ($identifier) {
                $query->where('slug', $identifier);

                if (is_numeric($identifier)) {
                    $query->orWhere('id', $identifier);
                }
            })
            ->firstOrFail();
    }

    // admin add parking
    public function store(Request $request) {
        $parking = Parking::create($request->all());
        CacheKeys::bump('public-parkings');
        return response()->json($parking, 201);
    }

    // update parking
    public function update(Request $request, $id) {
        $parking = Parking::findOrFail($id);
        $parking->update($request->all());
        CacheKeys::bump('public-parkings');
        return response()->json($parking, 200);
    }

    // delete parking
    public function destroy($id) {
        Parking::destroy($id);
        CacheKeys::bump('public-parkings');
        return response()->json(null, 204);
    }
}
