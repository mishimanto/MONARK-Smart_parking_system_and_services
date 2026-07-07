<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Models\User;
use App\Models\About;
use App\Models\ContactUs;
use App\Http\Controllers\LayoutController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\API\ParkingController;
use App\Http\Controllers\API\SlotController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\WalletController;
use App\Http\Controllers\API\AboutPageController;
use App\Http\Controllers\API\ContactPageController;
use App\Http\Controllers\API\ContactController;
use App\Http\Controllers\API\AboutController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\TeamController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\API\ServiceCenterController;
use App\Http\Controllers\API\AdminCenterController;


use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceOrderController;

use App\Http\Controllers\MechanicController;


Route::post('/register', [AuthController::class,'register']);
Route::post('/login', [AuthController::class,'login']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/parkings', [ParkingController::class, 'index']);
Route::get('/parkings/{id}', [ParkingController::class, 'show']);


Route::get('/about', [AboutController::class, 'index']);
Route::get('/contact', [ContactController::class, 'index']);
Route::post('/messages', [MessageController::class, 'store']);
Route::get('/contact-info', [LayoutController::class, 'getContact']);


// সার্ভিস লিস্ট
Route::get('/services', [ServiceController::class, 'index']);


// Service Centers Routes
Route::get('/service-centers', [ServiceCenterController::class, 'index']);
Route::get('/service-centers/{id}', [ServiceCenterController::class, 'show']);
Route::get('/service-centers/nearest/location', [ServiceCenterController::class, 'nearest']);





// About Page routes
/*Route::get('/about-page', [AboutPageController::class, 'show']);
Route::post('/about-page', [AboutPageController::class, 'store'])->middleware('auth:sanctum');*/

// Contact Page routes  
/*Route::get('/contact-page', [ContactPageController::class, 'show']);
Route::post('/contact-page', [ContactPageController::class, 'store'])->middleware('auth:sanctum');*/

/*Route::get('/contact-page', [ContactController::class, 'getContactData']);
Route::post('/contact-form', [ContactController::class, 'submitContactForm']);*/

Route::post('/contact-form', [ContactController::class, 'submitContactForm']);

Route::middleware('auth:sanctum')->group(function(){
    Route::post('/logout', [AuthController::class,'logout']);
    Route::get('/me', [AuthController::class,'me']);

    Route::post('/email/verification-notification', function (Request $request) {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified']);
        }
        $request->user()->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification link sent']);
    })->middleware(['throttle:6,1'])->name('verification.send');

    Route::get('/wallet/balance', [WalletController::class, 'getBalance']);
    Route::post('/wallet/topup', [WalletController::class, 'topup']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    
    // Booking with wallet payment
    Route::post('/bookings/wallet', [BookingController::class, 'storeWithWalletPayment']);
    Route::get('/bookings/active', [BookingController::class, 'activeBookings']);
    Route::get('/bookings/history', [BookingController::class, 'bookingHistory']);
    Route::put('/bookings/{id}/extend', [BookingController::class, 'extendBooking']);
    Route::post('/bookings/check-availability', [BookingController::class, 'checkAvailability']);
    
    // Existing booking routes
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);


    // Checkout routes
    Route::post('/bookings/{id}/request-checkout', [BookingController::class, 'requestCheckout']);
    Route::post('/bookings/{id}/pay-extra-charges', [BookingController::class, 'payExtraCharges']);
    Route::get('/active-bookings', [BookingController::class, 'activeBookings']);

    Route::get('/bookings/{id}/download-ticket', [BookingController::class, 'downloadTicket']);

    Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);
    Route::post('/initiate-topup', [PaymentController::class, 'initiateTopup']);
    Route::post('/verify-transaction', [PaymentController::class, 'verifyTransaction']);

   // সার্ভিস অর্ডার বুকিং
    Route::get('/service-orders', [ServiceOrderController::class, 'userOrders']);
    Route::post('/service-orders', [ServiceOrderController::class, 'store']);
    
    // বুকিং status আপডেট (Admin/Staff)
    Route::put('/service-orders/{id}/status', [ServiceOrderController::class, 'updateStatus']);

    Route::get('/profile', [ProfileController::class, 'getProfile']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/change-password', [ProfileController::class, 'changePassword']);


    Route::middleware('role:admin')->group(function () {
        Route::post('/parkings', [ParkingController::class, 'store']);
        Route::put('/parkings/{id}', [ParkingController::class, 'update']);
        Route::delete('/parkings/{id}', [ParkingController::class, 'destroy']);

        Route::post('/slots', [SlotController::class, 'store']);
        Route::put('/slots/{id}', [SlotController::class, 'update']);
        Route::delete('/slots/{id}', [SlotController::class, 'destroy']);
    });

    //admin

    Route::middleware('role:admin')->group(function () {
    Route::get('/admin/bookings', [BookingController::class, 'adminIndex']);
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::put('/admin/users/{user}/block', [AdminController::class, 'blockUser']);
    Route::put('/admin/users/{user}/unblock', [AdminController::class, 'unblockUser']);
    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser']);

    //Parking Routes
    Route::get('/admin/parkings', [AdminController::class, 'getParkings']);
    Route::post('/admin/parkings', [AdminController::class, 'addParking']);
    Route::put('/admin/parkings/{parking}', [AdminController::class, 'updateParking']);
    Route::delete('/admin/parkings/{parking}', [AdminController::class, 'deleteParking']);
    Route::post('/admin/upload-image', [AdminController::class, 'uploadImage']);

    // Slot Management Routes
    Route::get('/admin/slots', [AdminController::class, 'getSlots']);
    Route::post('/admin/slots', [AdminController::class, 'addSlot']);
    Route::put('/admin/slots/{slot}', [AdminController::class, 'updateSlot']);
    Route::put('/admin/slots/{slot}/toggle-availability', [AdminController::class, 'toggleSlotAvailability']);
    Route::delete('/admin/slots/{slot}', [AdminController::class, 'deleteSlot']);

    // Wallet Transactions Routes
    Route::get('/admin/wallet-transactions', [AdminController::class, 'getWalletTransactions']);
    Route::get('/admin/wallet-transactions/export', [AdminController::class, 'exportWalletTransactions']);

    // Reports Routes
    Route::get('/admin/reports', [AdminController::class, 'getReports']);
    Route::get('/admin/reports/export', [AdminController::class, 'exportReports']);

    // Dashboard Statistics
    Route::get('/admin/dashboard-stats', [AdminController::class, 'getDashboardStats']);

    
    // Checkout management routes
    Route::get('/pending-checkouts', [AdminController::class, 'getPendingCheckouts']);
    Route::post('/checkouts/{id}/approve', [AdminController::class, 'approveCheckout']);
    Route::post('/checkouts/{id}/reject', [AdminController::class, 'rejectCheckout']);

    // এটা যোগ করুন api.php তে
    Route::get('/admin/checkouts/stats', [AdminController::class, 'getCheckoutStats']);

    Route::get('/pending-transactions', [AdminController::class, 'getPendingTransactions']);
    Route::post('/approve-transaction/{id}', [AdminController::class, 'approveTransaction']);
    Route::post('/reject-transaction/{id}', [AdminController::class, 'rejectTransaction']);

    // Admin Wallet Transactions Routes
    Route::get('/admin/wallet-transactions', [AdminController::class, 'getWalletTransactions']);
    Route::post('/admin/wallet-transactions/{id}/approve', [AdminController::class, 'approveTransaction']);
    Route::post('/admin/wallet-transactions/{id}/reject', [AdminController::class, 'rejectTransaction']);

    // Service Orders Management Routes
    Route::get('/admin/service-orders', [AdminController::class, 'getServiceOrders']);
    Route::put('/admin/service-orders/{id}/status', [AdminController::class, 'updateServiceOrderStatus']);
    Route::get('/admin/service-orders/stats', [AdminController::class, 'getServiceOrderStats']);


    Route::post('/admin/service-orders/{id}/confirm', [AdminController::class, 'confirmBooking']);
    Route::post('/admin/service-orders/auto-update', [AdminController::class, 'autoUpdateStatuses']);
    Route::put('/admin/service-orders/{id}/status', [AdminController::class, 'updateStatus']);

    Route::get('/admin/service-orders/{id}/download-slip', [AdminController::class, 'downloadServiceSlip']); 
    Route::get('/admin/service-orders/{id}/download-invoice', [AdminController::class, 'downloadServiceInvoice']);

    // Service Management Routes
    Route::get('/admin/services', [AdminController::class, 'getServices']);
    Route::post('/admin/services', [AdminController::class, 'addService']);
    Route::put('/admin/services/{service}', [AdminController::class, 'updateService']);
    Route::delete('/admin/services/{service}', [AdminController::class, 'deleteService']);
    Route::put('/admin/services/{service}/toggle-status', [AdminController::class, 'toggleServiceStatus']);
    // Service Image Upload Route
    Route::post('/admin/upload-service-image', [AdminController::class, 'uploadServiceImage']);

    // Contact routes
    Route::apiResource('contacts', ContactController::class);

    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::put('/messages/{id}/replied', [MessageController::class, 'markAsReplied']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

    Route::get('/admin/service-centers', [AdminCenterController::class, 'index']);
    Route::post('/admin/service-centers', [AdminCenterController::class, 'store']);
    Route::get('/admin/service-centers/{id}', [AdminCenterController::class, 'show']);
    Route::put('/admin/service-centers/{id}', [AdminCenterController::class, 'update']);
    Route::delete('/admin/service-centers/{id}', [AdminCenterController::class, 'destroy']);
    Route::patch('/admin/service-centers/{id}/status', [AdminCenterController::class, 'toggleStatus']);
    });


    // Mechanic specific routes
    Route::prefix('mechanic')->middleware('role:mechanic')->group(function() {
        Route::get('/orders', [MechanicController::class, 'getAssignedOrders']);
        Route::post('/orders/{id}/start', [MechanicController::class, 'startService']);
        Route::post('/orders/{id}/complete', [MechanicController::class, 'completeService']);
        Route::get('/dashboard-stats', [MechanicController::class, 'getDashboardStats']);
    });
    
});




Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = User::findOrFail($id);

    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect('http://localhost:5173/login?verified=0');
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // Redirect to React login page after successful verification
    return redirect('http://localhost:5173/login?verified=1');
})->middleware(['signed'])->name('verification.verify');
