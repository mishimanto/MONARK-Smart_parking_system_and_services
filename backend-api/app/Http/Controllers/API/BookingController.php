<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Booking;
use App\Models\WalletTransaction;
use App\Models\Slot;
use App\Models\Parking;
use App\Support\CacheKeys;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf; // ✅ এই line add করুন
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            $query = Booking::with(['parking', 'slot'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc');

            if ($request->status === 'active') {
                $query->whereIn('status', ['confirmed', 'active', 'checkout_requested', 'checkout_paid']);
            }

            if ($request->status === 'history') {
                $query->whereIn('status', ['completed', 'cancelled']);
            }

            if ($request->boolean('paginate')) {
                $perPage = min(max((int) $request->input('per_page', 8), 1), 50);
                $bookings = $query->paginate($perPage);

                return response()->json([
                    'success' => true,
                    'bookings' => $bookings->items(),
                    'pagination' => [
                        'current_page' => $bookings->currentPage(),
                        'last_page' => $bookings->lastPage(),
                        'per_page' => $bookings->perPage(),
                        'total' => $bookings->total(),
                        'from' => $bookings->firstItem(),
                        'to' => $bookings->lastItem(),
                    ],
                ]);
            }

            $bookings = $query->get();

            return response()->json([
                'success' => true,
                'bookings' => $bookings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch bookings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource with wallet payment.
     */
    public function storeWithWalletPayment(Request $request)
    {
        $request->validate([
            'parking_id' => 'required|exists:parkings,id',
            'slot_id' => 'required|exists:slots,id',
            'hours' => 'required|integer|min:1|max:24'
        ]);

        return DB::transaction(function () use ($request) {
            $user = $request->user();
            
            // Get parking details
            $parking = Parking::find($request->parking_id);
            if (!$parking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parking not found'
                ], 404);
            }

            // Calculate total price
            $totalPrice = $parking->price_per_hour * $request->hours;

            // Check wallet balance - CRITICAL CHECK
            if ($user->wallet_balance < $totalPrice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient wallet balance. Please top up your wallet first.',
                    'required_amount' => $totalPrice,
                    'current_balance' => $user->wallet_balance,
                    'shortage' => $totalPrice - $user->wallet_balance
                ], 422);
            }

            // Check slot availability
            $slot = Slot::where('id', $request->slot_id)
                        ->where('parking_id', $request->parking_id)
                        ->first();

            if (!$slot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slot not found in this parking'
                ], 404);
            }

            if (!$slot->available) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected slot is not available'
                ], 422);
            }

            // Check active booking
            $existingBooking = Booking::where('user_id', $user->id)
                ->where('parking_id', $request->parking_id)
                ->where('status', 'confirmed')
                ->where(function($query) {
                    $query->where('end_time', '>', now())
                          ->orWhereNull('end_time');
                })
                ->first();

            if ($existingBooking) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active booking in this parking'
                ], 422);
            }

            // Create booking
            $booking = Booking::create([
                'user_id' => $user->id,
                'parking_id' => $request->parking_id,
                'slot_id' => $request->slot_id,
                'hours' => $request->hours,
                'total_price' => $totalPrice,
                'status' => 'confirmed',
                'end_time' => now()->addHours($request->hours)
            ]);

            // Update slot availability
            $slot->available = false;
            $slot->save();

            // **WALLET PAYMENT TRANSACTION** - payment_method = 'wallet'
            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'payment',
                'amount' => $totalPrice,
                'payment_method' => 'wallet', // This indicates it's from wallet balance
                'status' => 'completed',
                'description' => 'Booking payment for #' . $booking->id . ' - ' . $parking->name
            ]);

            // Deduct from user wallet
            $user->wallet_balance -= $totalPrice;
            $user->save();

            // Update parking available slots
            $parking->available_slots = max(0, $parking->available_slots - 1);
            $parking->save();

            CacheKeys::bump('public-parkings');

            $booking->load(['parking', 'slot']);

            return response()->json([
                'success' => true,
                'message' => 'Booking confirmed! Payment deducted from wallet.',
                'booking' => $booking,
                'new_balance' => $user->wallet_balance,
                'transaction' => $transaction
            ], 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            $booking = Booking::with(['parking', 'slot'])
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'booking' => $booking
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch booking details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a booking with refund
     */
    public function cancel(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $user = $request->user();
            
            $booking = Booking::with(['parking', 'slot'])
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking not found'
                ], 404);
            }

            // Check if booking can be cancelled
            if (in_array($booking->status, ['cancelled', 'completed', 'rejected'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This booking cannot be cancelled'
                ], 422);
            }

            // Calculate refund amount (full refund if cancelled within 1 hour)
            $bookingCreatedTime = \Carbon\Carbon::parse($booking->created_at);
            $currentTime = now();
            $hoursSinceBooking = $bookingCreatedTime->diffInHours($currentTime);

            $refundAmount = 0;
            if ($hoursSinceBooking < 1) {
                // Full refund if cancelled within 1 hour
                $refundAmount = $booking->total_price;
            } else {
                // Partial refund based on remaining time
                $hoursUsed = min($hoursSinceBooking, $booking->hours);
                $hoursRemaining = $booking->hours - $hoursUsed;
                $refundAmount = $booking->parking->price_per_hour * $hoursRemaining;
                
                // Minimum 1 hour charge
                if ($refundAmount < $booking->parking->price_per_hour) {
                    $refundAmount = 0;
                }
            }

            // Update booking status
            $booking->status = 'cancelled';
            $booking->save();

            // Update slot availability
            $slot = Slot::find($booking->slot_id);
            $slotWasUnavailable = $slot && !$slot->available;
            if ($slot) {
                $slot->available = true;
                $slot->save();
            }

            // Update parking available slots only when this cancellation actually frees a slot.
            $parking = Parking::find($booking->parking_id);
            if ($parking && $slotWasUnavailable) {
                $parking->available_slots = min($parking->total_slots, $parking->available_slots + 1);
                $parking->save();
            }

            CacheKeys::bump('public-parkings');

            // Process refund if applicable
            if ($refundAmount > 0) {
                // Create wallet transaction for refund
                $refundTransaction = WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'refund',
                    'amount' => $refundAmount,
                    'payment_method' => 'wallet',
                    'status' => 'completed',
                    'description' => 'Refund for cancelled booking #' . $booking->id
                ]);

                // Add refund to user wallet
                $user->wallet_balance += $refundAmount;
                $user->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully',
                'booking' => $booking,
                'refund_amount' => $refundAmount,
                'new_balance' => $user->wallet_balance
            ]);
        });
    }

    /**
     * Get user's active bookings
     */
    public function activeBookings(Request $request)
    {
        try {
            $user = $request->user();
            
            $activeBookings = Booking::with(['parking', 'slot'])
                ->where('user_id', $user->id)
                ->whereIn('status', ['confirmed', 'checkout_requested', 'checkout_paid'])
                ->where(function($query) {
                    $query->where('end_time', '>', now())
                          ->orWhere('status', 'checkout_requested')
                          ->orWhere('status', 'checkout_paid');
                })
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'bookings' => $activeBookings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active bookings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's booking history
     */
    public function bookingHistory(Request $request)
    {
        try {
            $user = $request->user();
            
            $bookingHistory = Booking::with(['parking', 'slot'])
                ->where('user_id', $user->id)
                ->where(function($query) {
                    $query->where('status', 'cancelled')
                          ->orWhere('end_time', '<', now());
                })
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'bookings' => $bookingHistory
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch booking history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extend booking time
     */
    public function extendBooking(Request $request, $id)
    {
        $request->validate([
            'additional_hours' => 'required|integer|min:1|max:12'
        ]);

        return DB::transaction(function () use ($request, $id) {
            $user = $request->user();
            
            $booking = Booking::with(['parking'])
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->where('status', 'confirmed')
                ->first();

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Active booking not found'
                ], 404);
            }

            // Calculate additional cost
            $additionalCost = $booking->parking->price_per_hour * $request->additional_hours;

            // Check wallet balance
            if ($user->wallet_balance < $additionalCost) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient wallet balance to extend booking',
                    'required_amount' => $additionalCost,
                    'current_balance' => $user->wallet_balance
                ], 422);
            }

            // Update booking
            $booking->hours += $request->additional_hours;
            $booking->total_price += $additionalCost;
            $booking->end_time = \Carbon\Carbon::parse($booking->end_time)->addHours($request->additional_hours);
            $booking->save();

            // Create wallet transaction for extension payment
            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'payment',
                'amount' => $additionalCost,
                'payment_method' => 'wallet',
                'status' => 'completed',
                'description' => 'Extension payment for booking #' . $booking->id . ' - ' . $request->additional_hours . ' additional hours'
            ]);

            // Deduct from user wallet
            $user->wallet_balance -= $additionalCost;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Booking extended successfully',
                'booking' => $booking,
                'additional_cost' => $additionalCost,
                'new_balance' => $user->wallet_balance
            ]);
        });
    }

    /**
     * Check booking availability
     */
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'parking_id' => 'required|exists:parkings,id',
            'slot_id' => 'required|exists:slots,id'
        ]);

        try {
            $slot = Slot::where('id', $request->slot_id)
                        ->where('parking_id', $request->parking_id)
                        ->first();

            if (!$slot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slot not found in this parking'
                ], 404);
            }

            $parking = Parking::find($request->parking_id);

            return response()->json([
                'success' => true,
                'available' => $slot->available,
                'slot' => $slot,
                'parking' => $parking
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check availability',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    //Admin

    // BookingController.php
    public function adminIndex(Request $request)
    {
        try {
            $query = Booking::with(['user', 'parking', 'slot']);
            
            // Search functionality
            if ($request->has('q') && $request->q) {
                $search = $request->q;
                $query->where(function($q) use ($search) {
                    $q->whereHas('user', function($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                                 ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('parking', function($parkingQuery) use ($search) {
                        $parkingQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('slot', function($slotQuery) use ($search) {
                        $slotQuery->where('slot_code', 'like', "%{$search}%");
                    })
                    ->orWhere('id', 'like', "%{$search}%");
                });
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            $perPage = $request->per_page ?? 15;
            $bookings = $query->latest()->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $bookings
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch bookings'
            ], 500);
        }
    }

    public function requestCheckout(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $user = $request->user();
            
            $booking = Booking::with(['parking', 'slot'])
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->where('status', 'confirmed')
                ->first();

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Active booking not found'
                ], 404);
            }

            // Calculate extra time and charges
            $currentTime = now();
            $scheduledEndTime = Carbon::parse($booking->end_time);
            
            $extraMinutes = 0;
            $extraCharges = 0;

            if ($currentTime > $scheduledEndTime) {
                $extraMinutes = $currentTime->diffInMinutes($scheduledEndTime);
                
                // Round up to nearest 10 minutes
                $extraMinutes = ceil($extraMinutes / 10) * 10;
                
                // Calculate extra charges (per 10 minutes)
                $chargePer10Minutes = $booking->parking->price_per_hour / 6; // 60/10 = 6
                $extraCharges = $chargePer10Minutes * ($extraMinutes / 10);
            }

            // Update booking with checkout request
            $booking->update([
                'checkout_requested' => true,
                'actual_end_time' => $currentTime,
                'extra_charges' => $extraCharges,
                'grand_total' => $booking->total_price + $extraCharges, 
                'status' => 'checkout_requested' // New status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Checkout requested successfully',
                'booking' => $booking,
                'extra_minutes' => $extraMinutes,
                'extra_charges' => $extraCharges,
                'grand_total' => $booking->total_price + $extraCharges, 
                'requires_payment' => $extraCharges > 0
            ]);
        });
    }

    /**
     * Pay extra charges for checkout
     */
    public function payExtraCharges(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $user = $request->user();
            
            $booking = Booking::with(['parking'])
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->where('status', 'checkout_requested')
                ->first();

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Checkout request not found'
                ], 404);
            }

            // Check wallet balance for extra charges
            if ($user->wallet_balance < $booking->extra_charges) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient wallet balance for extra charges',
                    'required_amount' => $booking->extra_charges,
                    'current_balance' => $user->wallet_balance
                ], 422);
            }

            // Deduct extra charges if any
            if ($booking->extra_charges > 0) {
                // Create wallet transaction for extra charges
                $transaction = WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'extra_charge',
                    'amount' => $booking->extra_charges,
                    'payment_method' => 'wallet',
                    'status' => 'completed',
                    'description' => 'Extra charges for booking #' . $booking->id . ' - Late checkout'
                ]);

                // Deduct from user wallet
                $user->wallet_balance -= $booking->extra_charges;
                $user->save();
            }

            // Mark as paid and ready for admin approval
            $booking->update([
                'status' => 'checkout_paid',
                'grand_total' => $booking->total_price + $booking->extra_charges // total + extra
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Extra charges paid successfully',
                'booking' => $booking,
                'extra_charges_paid' => $booking->extra_charges,
                'grand_total' => $booking->total_price + $booking->extra_charges, 
                'new_balance' => $user->wallet_balance
            ]);
        });
    }

   public function downloadTicket($id)
{
    try {
        \Log::info('Download ticket request for booking: ' . $id);

        $booking = Booking::with(['user', 'parking', 'slot'])
            ->where('id', $id)
            ->where('user_id', auth()->id())
            ->where('status', 'completed')
            ->whereNotNull('ticket_number')
            ->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found or not available'
            ], 404);
        }

        \Log::info('Generating PDF for ticket: ' . $booking->ticket_number);

        // Variables
        $checkinTime = date('M d, Y h:i A', strtotime($booking->created_at));
        $checkoutTime = $booking->actual_end_time
            ? date('M d, Y h:i A', strtotime($booking->actual_end_time))
            : date('M d, Y h:i A');
        $finalAmount = $booking->total_price + $booking->extra_charges;

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Parking Ticket - ' . $booking->ticket_number . '</title>
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap");
                body { font-family: Arial, sans-serif; margin: 0; padding: 30px; font-size: 20px; }
                .ticket { border: 3px solid #333; padding: 30px; max-width: 620px; margin: 0 auto; height: 960px; }
                .header { text-align: center; background: #f8f9fa; padding: 10px; margin-bottom: 20px; }
                .ticket-number { font-size: 35px; font-weight: bold; color: #007bff; margin: 10px 0; }
                .details { margin: 15px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 14px 0; font-size: 24px;}
                .footer { text-align: center; margin-top: 34px; font-size: 18px; color: #666; }
                .barcode { text-align: center; margin: 30px 0; font-family: "Libre Barcode 128", monospace; font-size: 54px; }
                .status-badge { background: #28a745; color: white; padding: 12px 18px; border-radius: 4px; margin-top: 15px, font-size: 35px; }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    <h1>Parking Ticket</h1>
                    <div class="ticket-number">' . $booking->ticket_number . '</div>
                    <div class="status-badge">COMPLETED</div>
                </div>

                <div class="barcode">
                    ***' . $booking->ticket_number . '***
                </div>

                <div class="details">
                    <div class="detail-row">
                        <strong>User Name:</strong>
                        <span>' . e($booking->user->name) . '</span>
                    </div>
                    <div class="detail-row">
                        <strong>Parking:</strong>
                        <span>' . e($booking->parking->name) . '</span>
                    </div>
                    <div class="detail-row">
                        <strong>Slot:</strong>
                        <span>' . e($booking->slot->slot_code) . '</span>
                    </div>
                    <div class="detail-row">
                        <strong>Duration:</strong>
                        <span>' . $booking->hours . ' hour(s)</span>
                    </div>
                    <div class="detail-row">
                        <strong>Total Amount:</strong>
                        <span>BDT ' . number_format($booking->total_price, 2) . '</span>
                    </div>
                    <div class="detail-row">
                        <strong>Extra Charges:</strong>
                        <span>BDT ' . number_format($booking->extra_charges, 2) . '</span>
                    </div>
                    <div class="detail-row">
                        <strong>Final Amount:</strong>
                        <span><strong>BDT ' . number_format($finalAmount, 2) . '</strong></span>
                    </div>
                    <div class="detail-row">
                        <strong>Check-in Time:</strong>
                        <span>' . $checkinTime . '</span>
                    </div>
                    <div class="detail-row">
                        <strong>Check-out Time:</strong>
                        <span>' . $checkoutTime . '</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for using our parking service!</p>
                    <p>Generated on: ' . date('M d, Y h:i A') . '</p>
                </div>
            </div>
        </body>
        </html>
        ';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait')->setOptions(['dpi' => 150, 'defaultFont' => 'sans-serif']);

        return response()->streamDownload(function () use ($pdf) {
            echo $pdf->output();
        }, "ticket-{$booking->ticket_number}.pdf", [
            'Content-Type' => 'application/pdf',
        ]);

    } catch (\Exception $e) {
        \Log::error('PDF Generation Error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'PDF generation failed: ' . $e->getMessage()
        ], 500);
    }
}



}
