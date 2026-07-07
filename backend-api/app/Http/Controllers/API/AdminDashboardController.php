<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function getStats()
    {
        try {
            $stats = [
                'total_categories' => Category::count(),
                'total_products' => Product::count(),
                'total_orders' => Order::count(),
                'total_users' => User::count(),
                'revenue_today' => Order::whereDate('created_at', today())->sum('total_amount'),
                'revenue_month' => Order::whereMonth('created_at', now()->month)->sum('total_amount'),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats'
            ], 500);
        }
    }

    /*public function getRecentOrders()
    {
        try {
            $orders = Order::with(['user', 'orderItems.product'])
                        ->latest()
                        ->take(10)
                        ->get()
                        ->map(function($order) {
                            return [
                                'id' => $order->id,
                                'customer_name' => $order->user->name,
                                'total_amount' => $order->total_amount,
                                'status' => $order->status,
                                'created_at' => $order->created_at->format('d M Y'),
                                'items_count' => $order->orderItems->count()
                            ];
                        });

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent orders'
            ], 500);
        }
    }*/
}
