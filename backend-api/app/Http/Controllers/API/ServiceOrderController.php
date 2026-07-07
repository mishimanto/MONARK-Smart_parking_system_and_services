<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ServiceOrder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ServiceOrderController extends Controller
{
    // ইউজারের সব বুকিং
    public function userOrders()
    {
        try {
            Log::info('UserOrders method called');
            Log::info('Authenticated User ID: ' . Auth::id());
            
            // Auth check
            if (!Auth::check()) {
                Log::warning('User not authenticated');
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $userId = Auth::id();
            Log::info('Fetching orders for user: ' . $userId);

            if (!Schema::hasTable('service_orders')) {
                return response()->json([]);
            }

            $orders = ServiceOrder::with('service')
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Orders found: ' . $orders->count());
            Log::info('Orders data: ' . $orders->toJson());

            return response()->json($orders);

        } catch (\Exception $e) {
            Log::error('Error in userOrders: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    // নতুন বুকিং
    public function store(Request $request)
    {
        try {
            $request->validate([
                'service_id'   => 'required|exists:services,id',
                'booking_time' => 'required|date',
                'notes'        => 'nullable|string'
            ]);

            DB::statement("CALL book_service_with_wallet(?,?,?,?)", [
                Auth::id(),
                $request->service_id,
                $request->booking_time,
                $request->notes
            ]);

            return response()->json(['message' => 'Service booked & payment deducted from wallet!']);

        } catch (\Exception $e) {
            Log::error('Booking error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // বুকিং status আপডেট
    public function updateStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:pending,in_progress,completed,cancelled'
            ]);

            $order = ServiceOrder::findOrFail($id);
            $order->update(['status' => $request->status]);

            return response()->json(['message' => 'Order status updated!']);

        } catch (\Exception $e) {
            Log::error('Update status error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
