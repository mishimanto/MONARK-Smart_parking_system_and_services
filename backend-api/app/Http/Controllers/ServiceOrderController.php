<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\ServiceOrder;
use App\Models\Service;
use App\Models\User;
use App\Models\WalletTransaction;

class ServiceOrderController extends Controller
{
    public function userOrders(Request $request)
    {
        try {
            if (!Schema::hasTable('service_orders')) {
                return response()->json([]);
            }

            $query = ServiceOrder::with(['service.serviceCenter', 'assignedMechanic'])
                ->where('user_id', Auth::id())
                ->orderBy('created_at','desc');

            if ($request->status === 'active') {
                $query->whereIn('status', ['pending', 'confirmed', 'in_progress']);
            }

            if ($request->status === 'history') {
                $query->whereIn('status', ['completed', 'cancelled']);
            }

            if ($request->boolean('paginate')) {
                $perPage = min(max((int) $request->input('per_page', 8), 1), 50);
                $orders = $query->paginate($perPage);

                return response()->json([
                    'success' => true,
                    'data' => $orders->items(),
                    'pagination' => [
                        'current_page' => $orders->currentPage(),
                        'last_page' => $orders->lastPage(),
                        'per_page' => $orders->perPage(),
                        'total' => $orders->total(),
                        'from' => $orders->firstItem(),
                        'to' => $orders->lastItem(),
                    ],
                ]);
            }

            $orders = $query->get();

            return response()->json($orders);
        } catch (\Exception $e) {
            \Log::error('Service orders fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch service orders'], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id'   => 'required|exists:services,id',
            'booking_time' => 'required|date|after_or_equal:now',
            'notes'        => 'nullable|string|max:1000'
        ]);

        try {
            $bookingTime = Carbon::parse($validated['booking_time']);
            if ($bookingTime->hour < 8 || $bookingTime->hour >= 22) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please choose a booking time between 8:00 AM and 10:00 PM.'
                ], 422);
            }

            $result = DB::transaction(function () use ($request, $validated, $bookingTime) {
                $user = $request->user()
                    ->newQuery()
                    ->whereKey($request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $service = Service::with('serviceCenter')
                    ->whereKey($validated['service_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($service->status !== 'active' || !$service->is_active || ($service->serviceCenter && !$service->serviceCenter->is_active)) {
                    return [
                        'response' => response()->json([
                            'success' => false,
                            'message' => 'This service is currently unavailable.'
                        ], 422)
                    ];
                }

                $hasExistingBooking = ServiceOrder::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'confirmed', 'in_progress'])
                    ->whereBetween('booking_time', [
                        $bookingTime->copy()->subMinutes(30),
                        $bookingTime->copy()->addMinutes(30),
                    ])
                    ->lockForUpdate()
                    ->exists();

                if ($hasExistingBooking) {
                    return [
                        'response' => response()->json([
                            'success' => false,
                            'message' => 'You already have an active service booking around this time.'
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
                    'booking_time' => $bookingTime,
                    'status' => 'pending',
                    'notes' => $validated['notes'] ?? null,
                    'paid_amount' => $price,
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
            Log::error('Service booking error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Service booking failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Unable to complete booking.'
            ], 500);
        }
    }

    public function cancel(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        try {
            $result = DB::transaction(function () use ($request, $id, $validated) {
                $order = ServiceOrder::with('service')
                    ->where('id', $id)
                    ->where('user_id', $request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!in_array($order->status, ['pending', 'confirmed'], true)) {
                    return [
                        'response' => response()->json([
                            'success' => false,
                            'message' => 'Only pending or confirmed service bookings can be cancelled.'
                        ], 422)
                    ];
                }

                $refund = $this->refundServiceOrder($order, $validated['reason'] ?? 'Cancelled by customer');

                return [
                    'response' => response()->json([
                        'success' => true,
                        'message' => 'Service booking cancelled successfully.',
                        'order' => $order->fresh(['service']),
                        'refund_amount' => $refund,
                    ])
                ];
            });

            return $result['response'];
        } catch (\Throwable $e) {
            Log::error('Service order cancel error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel service booking.'
            ], 500);
        }
    }

    private function refundServiceOrder(ServiceOrder $order, string $reason): float
    {
        if ($order->refunded_at) {
            return (float) $order->refunded_amount;
        }

        $refundAmount = (float) ($order->paid_amount ?: optional($order->service)->price ?: 0);
        $user = User::whereKey($order->user_id)->lockForUpdate()->firstOrFail();

        if ($refundAmount > 0 && Schema::hasTable('wallet_transactions')) {
            $transactionData = [
                'user_id' => $user->id,
                'type' => 'refund',
                'amount' => $refundAmount,
                'payment_method' => 'wallet',
                'status' => 'completed',
                'description' => 'Refund for cancelled service order #' . $order->id,
            ];

            if (Schema::hasColumn('wallet_transactions', 'generated_transaction_id')) {
                $transactionData['generated_transaction_id'] = 'SRV-REF-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            }

            WalletTransaction::create($transactionData);
        }

        if ($refundAmount > 0) {
            $user->wallet_balance = (float) $user->wallet_balance + $refundAmount;
            $user->save();
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
            'refunded_at' => $refundAmount > 0 ? now() : null,
            'refunded_amount' => $refundAmount,
        ]);

        return $refundAmount;
    }
}
