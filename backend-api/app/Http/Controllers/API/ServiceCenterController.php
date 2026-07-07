<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ServiceCenter;
use Illuminate\Http\Request;

class ServiceCenterController extends Controller
{
    /**
     * Display a listing of the service centers.
     */
    public function index()
    {
        try {
            $serviceCenters = ServiceCenter::where('is_active', true)
                ->select([
                    'id', 
                    'name', 
                    'address', 
                    'phone', 
                    'email', 
                    'latitude', 
                    'longitude', 
                    'opening_hours', 
                    'image'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'service_centers' => $serviceCenters,
                'message' => 'Service centers retrieved successfully'
            ]);

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
