<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\ServiceCompletedMail;

use Illuminate\Support\Facades\Log;

class MechanicController extends Controller
{
    /**
     * Get assigned service orders for mechanic
     */
    public function getAssignedOrders(Request $request)
    {
        try {
            $query = ServiceOrder::with(['user', 'service'])
                ->where('assigned_mechanic_id', Auth::id())
                ->whereIn('status', ['confirmed', 'in_progress']);

            // Search functionality
            if ($request->has('q') && $request->q) {
                $search = $request->q;
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('service', function($serviceQuery) use ($search) {
                          $serviceQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Status filter
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            $perPage = $request->per_page ?? 15;
            $orders = $query->orderBy('booking_time', 'asc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $orders
            ]);

        } catch (\Exception $e) {
            Log::error('Mechanic orders error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assigned orders'
            ], 500);
        }
    }

    /**
     * Start service (confirmed → in_progress)
     */
    public function startService(Request $request, $id)
    {
        try {
            $order = ServiceOrder::with(['user', 'service'])
                ->where('assigned_mechanic_id', Auth::id())
                ->findOrFail($id);
            
            if ($order->status !== 'confirmed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only confirmed orders can be started'
                ], 400);
            }

            $order->update([
                'status' => 'in_progress',
                'started_at' => now()
            ]);

            Log::info("Service started by mechanic", [
                'order_id' => $order->id,
                'started_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Service started successfully',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Start service error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to start service'
            ], 500);
        }
    }

    /**
     * Complete service (in_progress → completed)
     */
   public function completeService($id)
{
    DB::beginTransaction();
    try {
        Log::info("=== COMPLETE SERVICE STARTED ===");
        Log::info("Mechanic ID: " . Auth::id());
        Log::info("Order ID: " . $id);

        // Check if user is authenticated
        if (!Auth::check()) {
            Log::error("User not authenticated");
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $order = ServiceOrder::with(['user', 'service'])
            ->where('id', $id)
            ->where('assigned_mechanic_id', Auth::id())
            ->where('status', 'in_progress')
            ->first();

        if (!$order) {
            Log::error("Order not found or not in progress. Order ID: " . $id);
            return response()->json([
                'success' => false,
                'message' => 'Order not found or not in progress status'
            ], 404);
        }

        Log::info("Order found: ", [
            'id' => $order->id,
            'current_status' => $order->status,
            'user_id' => $order->user_id,
            'service_id' => $order->service_id
        ]);

        // Generate invoice data
        $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad($order->id, 5, '0', STR_PAD_LEFT);
        
        $invoiceData = [
            'invoice_number' => $invoiceNumber,
            'order_id' => $order->id,
            'customer_name' => $order->user->name ?? 'N/A',
            'customer_email' => $order->user->email ?? 'N/A',
            'service_name' => $order->service->name ?? 'N/A',
            'service_description' => $order->service->description ?? 'N/A',
            'service_price' => $order->service->price ?? 0,
            'booking_time' => $order->booking_time,
            'completed_at' => now()->toDateTimeString(),
            'duration' => $order->service->duration ?? 'N/A',
            'mechanic_name' => Auth::user()->name
        ];

        Log::info("Generated invoice data", $invoiceData);

        // Update order status to completed and save invoice number
        $order->update([
            'status' => 'completed',
            'invoice_number' => $invoiceNumber,
            'invoice_generated_at' => now(),
            'completed_at' => now()
        ]);

        Log::info("Order updated to completed");

        // Send completion email with PDF invoice
        try {
            Log::info("Sending completion email to: " . ($order->user->email ?? 'N/A'));
            
            // Generate and send PDF invoice
            Mail::to($order->user->email)->queue(new ServiceCompletedMail($order, $invoiceData));
            Log::info("Completion email with PDF invoice sent successfully");
            
        } catch (\Exception $emailError) {
            Log::error("Email sending failed: " . $emailError->getMessage());
            // Continue even if email fails - don't rollback the transaction
        }

        DB::commit();
        Log::info("=== COMPLETE SERVICE COMPLETED SUCCESSFULLY ===");

        return response()->json([
            'success' => true,
            'message' => 'Service completed successfully! Invoice generated and email sent with PDF.',
            'data' => [
                'order' => $order,
                'invoice' => $invoiceData
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Complete service error: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json([
            'success' => false,
            'message' => 'Failed to complete service: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Generate invoice data
 */
    private function generateInvoice($order)
{
    $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad($order->id, 5, '0', STR_PAD_LEFT);
    
    return [
        'invoice_number' => $invoiceNumber,
        'order_id' => $order->id,
        'customer_name' => $order->user->name,
        'customer_email' => $order->user->email,
        'service_name' => $order->service->name,
        'service_description' => $order->service->description,
        'service_price' => $order->service->price,
        'booking_time' => $order->booking_time,
        'completed_at' => now()->toDateTimeString(),
        'duration' => $order->service->duration,
        'mechanic_name' => Auth::user()->name
    ];
}

    public function downloadSlip($id)
    {
        try {
            $order = ServiceOrder::with(['user', 'service'])
                ->where('assigned_mechanic_id', Auth::id())
                ->findOrFail($id);

            if (!$order->slip_number) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slip is not generated for this order yet.'
                ], 404);
            }

            $slipData = [
                'slip_number' => $order->slip_number,
                'order_id' => $order->id,
                'customer_name' => $order->user->name ?? 'N/A',
                'customer_email' => $order->user->email ?? 'N/A',
                'service_name' => $order->service->name ?? 'N/A',
                'service_description' => $order->service->description ?? '',
                'booking_time' => $order->booking_time,
                'duration' => $order->service->duration ?? '',
                'price' => $order->service->price ?? 0,
                'status' => $order->status,
                'generated_at' => now()->format('Y-m-d H:i:s'),
                'instructions' => 'Please arrive 10 minutes before your booking time.',
                'contact_info' => 'Contact: +8801900000000'
            ];

            if (!view()->exists('pdf.service-slip')) {
                return response()->json([
                    'success' => false,
                    'message' => 'PDF template not found.'
                ], 500);
            }

            $pdf = Pdf::loadView('pdf.service-slip', compact('slipData'));

            return $pdf->download("booking-slip-{$order->slip_number}.pdf");
        } catch (\Exception $e) {
            Log::error('Mechanic slip download error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to download service slip.'
            ], 500);
        }
    }


    /**
     * Get mechanic dashboard stats - FIXED VERSION
     */
    public function getDashboardStats()
    {
        try {
            \Log::info('Getting mechanic dashboard stats...');

            // Simple counts without complex relationships
            $confirmedOrders = ServiceOrder::where('assigned_mechanic_id', Auth::id())
                ->where('status', 'confirmed')
                ->count();
            $inProgressOrders = ServiceOrder::where('assigned_mechanic_id', Auth::id())
                ->where('status', 'in_progress')
                ->count();
            
            // Completed today - safe query
            $completedToday = ServiceOrder::where('assigned_mechanic_id', Auth::id())
                ->where('status', 'completed')
                ->whereDate('updated_at', today())
                ->count();

            \Log::info('Mechanic stats calculated', [
                'confirmed' => $confirmedOrders,
                'in_progress' => $inProgressOrders,
                'completed_today' => $completedToday
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'confirmed_orders' => $confirmedOrders,
                    'in_progress_orders' => $inProgressOrders,
                    'completed_today' => $completedToday,
                    'total_assigned' => $confirmedOrders + $inProgressOrders
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in getDashboardStats: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
