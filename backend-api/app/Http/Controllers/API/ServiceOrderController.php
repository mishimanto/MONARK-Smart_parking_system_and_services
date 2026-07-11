<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ServiceOrder;
use App\Models\Service;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

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
        $request->validate([
            'service_id'   => 'required|exists:services,id',
            'booking_time' => 'required|date',
            'notes'        => 'nullable|string'
        ]);

        try {
            $result = DB::transaction(function () use ($request) {
                $user = $request->user()
                    ->newQuery()
                    ->whereKey($request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $service = Service::query()
                    ->whereKey($request->service_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($service->status !== 'active' || !$service->is_active) {
                    return [
                        'response' => response()->json([
                            'success' => false,
                            'message' => 'This service is currently unavailable.'
                        ], 422)
                    ];
                }

                $price = (float) $service->price;
                $walletBalance = (float) $user->wallet_balance;

                if ($walletBalance < $price) {
                    return [
                        'response' => response()->json([
                            'success' => false,
                            'message' => 'Insufficient wallet balance.',
                            'current_balance' => $walletBalance,
                            'required_amount' => $price,
                            'shortage' => max(0, $price - $walletBalance)
                        ], 422)
                    ];
                }

                $order = ServiceOrder::create([
                    'user_id' => $user->id,
                    'service_id' => $service->id,
                    'booking_time' => Carbon::parse($request->booking_time),
                    'status' => 'pending',
                    'notes' => $request->notes,
                ]);

                $transaction = null;
                if (Schema::hasTable('wallet_transactions')) {
                    $transactionData = [
                        'user_id' => $user->id,
                        'type' => 'payment',
                        'amount' => $price,
                        'payment_method' => 'wallet',
                        'status' => 'completed',
                        'description' => 'Service order payment for #' . $order->id . ' - ' . $service->name,
                    ];

                    if (Schema::hasColumn('wallet_transactions', 'generated_transaction_id')) {
                        $transactionData['generated_transaction_id'] = 'SRV-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
                    }

                    $transaction = WalletTransaction::create($transactionData);
                }

                $user->wallet_balance = $walletBalance - $price;
                $user->save();

                $order->load('service');

                return [
                    'response' => response()->json([
                        'success' => true,
                        'message' => 'Service booked successfully. Payment deducted from wallet.',
                        'order' => $order,
                        'new_balance' => $user->wallet_balance,
                        'transaction' => $transaction,
                    ], 201)
                ];
            });

            return $result['response'];

        } catch (\Throwable $e) {
            Log::error('Booking error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Service booking failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Unable to complete booking.'
            ], 500);
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
