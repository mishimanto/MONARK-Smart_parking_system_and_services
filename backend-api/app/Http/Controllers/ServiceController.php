<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Support\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('serviceCenter')
            ->where('status', 'active')
            ->where('is_active', true);

        if ($request->filled('q')) {
            $search = trim($request->input('q'));

            $query->where(function ($serviceQuery) use ($search) {
                $serviceQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('serviceCenter', function ($centerQuery) use ($search) {
                        $centerQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('address', 'like', "%{$search}%");
                    });
            });
        }

        $query->latest();

        $params = CacheKeys::requestParams($request, ['page', 'per_page', 'q']);
        $cacheKey = CacheKeys::make('public-services', $params);

        $payload = Cache::remember($cacheKey, 300, function () use ($query, $request) {
            if ($request->has('page') || $request->has('per_page') || $request->filled('q')) {
                $perPage = min(max((int) $request->input('per_page', 9), 1), 24);

                return $query->paginate($perPage);
            }

            return $query->get();
        });

        return response()->json($payload);
    }

    public function show(Service $service)
    {
        abort_unless($service->status === 'active' && (bool) $service->is_active, 404);

        $cacheKey = CacheKeys::make('public-services', ['detail_id' => $service->id]);

        $payload = Cache::remember($cacheKey, 300, function () use ($service) {
            return $service->load('serviceCenter');
        });

        return response()->json($payload);
    }
}
