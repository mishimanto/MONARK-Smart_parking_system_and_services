<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\ServiceOrder;
use App\Models\Service;

class ServiceOrderController extends Controller
{
    public function userOrders()
    {
        try {
            if (!Schema::hasTable('service_orders')) {
                return response()->json([]);
            }

            $orders = ServiceOrder::with('service')
                ->where('user_id', Auth::id())
                ->orderBy('created_at','desc')
                ->get();

            return response()->json($orders);
        } catch (\Exception $e) {
            \Log::error('Service orders fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch service orders'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id'   => 'required|exists:services,id',
            'booking_time' => 'required|date',
            'notes'        => 'nullable|string'
        ]);

        try {
            DB::statement("CALL book_service_with_wallet(?,?,?,?)", [
                Auth::id(),
                $request->service_id,
                $request->booking_time,
                $request->notes
            ]);

            return response()->json(['message' => 'Service booked & payment deducted from wallet!']);
        } catch (\Exception $e) {
            \Log::error('Service booking error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled'
        ]);

        try {
            $order = ServiceOrder::findOrFail($id);
            $order->update(['status' => $request->status]);

            return response()->json(['message' => 'Order status updated!']);
        } catch (\Exception $e) {
            \Log::error('Service order status update error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update order status'], 500);
        }
    }
}
