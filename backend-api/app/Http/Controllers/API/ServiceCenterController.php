<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ServiceCenter;
use App\Support\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ServiceCenterController extends Controller
{
    /**
     * Display a listing of the service centers.
     */
    public function index(Request $request)
    {
        try {
            $userLat = $request->input('latitude');
            $userLng = $request->input('longitude');
            $hasUserLocation = is_numeric($userLat) && is_numeric($userLng);

            $query = ServiceCenter::where('is_active', true);

            if ($hasUserLocation) {
                $query->selectRaw("
                    service_centers.*,
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
            } else {
                $query->select([
                    'id',
                    'name',
                    'address',
                    'phone',
                    'email',
                    'latitude',
                    'longitude',
                    'opening_hours',
                    'image'
                ]);
            }

            if ($request->filled('q')) {
                $search = trim($request->input('q'));

                $query->where(function ($centerQuery) use ($search) {
                    $centerQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('opening_hours', 'like', "%{$search}%");
                });
            }

            if ($hasUserLocation) {
                $query->orderByRaw('calculated_distance IS NULL ASC')
                    ->orderBy('calculated_distance');
            } else {
                $query->latest();
            }

            $params = CacheKeys::requestParams($request, ['page', 'per_page', 'q', 'latitude', 'longitude']);
            $cacheKey = CacheKeys::make('public-service-centers', $params);
            $ttl = $hasUserLocation ? 60 : 300;

            $payload = Cache::remember($cacheKey, $ttl, function () use ($query, $request) {
                if ($request->has('page') || $request->has('per_page') || $request->filled('q')) {
                    $perPage = min(max((int) $request->input('per_page', 8), 1), 24);
                    $serviceCenters = $query->paginate($perPage);

                    return [
                        'success' => true,
                        'service_centers' => $serviceCenters->items(),
                        'data' => $serviceCenters->items(),
                        'pagination' => [
                            'current_page' => $serviceCenters->currentPage(),
                            'last_page' => $serviceCenters->lastPage(),
                            'per_page' => $serviceCenters->perPage(),
                            'total' => $serviceCenters->total(),
                        ],
                        'message' => 'Service centers retrieved successfully'
                    ];
                }

                $serviceCenters = $query->get();

                return [
                    'success' => true,
                    'service_centers' => $serviceCenters,
                    'message' => 'Service centers retrieved successfully'
                ];
            });

            return response()->json($payload);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve service centers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified service center.
     */
    public function show($id)
    {
        try {
            $serviceCenter = ServiceCenter::with(['services' => function($query) {
                $query->where('is_active', true)
                      ->select(['id', 'name', 'price', 'duration', 'service_center_id']);
            }])
            ->where('id', $id)
            ->where('is_active', true)
            ->firstOrFail();

            return response()->json([
                'success' => true,
                'service_center' => $serviceCenter,
                'message' => 'Service center retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service center not found'
            ], 404);
        }
    }

    /**
     * Get service centers with distance calculation (for nearest locations)
     */
    public function nearest(Request $request)
    {
        try {
            $userLat = $request->input('latitude', 23.8103); // Default Dhaka
            $userLng = $request->input('longitude', 90.4125); // Default Dhaka

            $serviceCenters = ServiceCenter::where('is_active', true)
                ->selectRaw("
                    *,
                    ( 6371 * acos( cos( radians(?) ) * 
                    cos( radians( latitude ) ) * 
                    cos( radians( longitude ) - 
                    radians(?) ) + 
                    sin( radians(?) ) * 
                    sin( radians( latitude ) ) ) ) 
                    AS distance", 
                    [$userLat, $userLng, $userLat]
                )
                ->orderBy('distance', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'service_centers' => $serviceCenters,
                'user_location' => [
                    'latitude' => $userLat,
                    'longitude' => $userLng
                ],
                'message' => 'Nearest service centers retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve nearest service centers',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
