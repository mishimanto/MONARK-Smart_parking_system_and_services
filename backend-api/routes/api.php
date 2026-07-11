<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Models\User;
use App\Models\About;
use App\Models\ContactUs;
use App\Http\Controllers\LayoutController;
use App\Http\Controllers\SiteSettingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminRoleController;
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
use App\Http\Controllers\API\AdminBulkDeleteController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\API\ServiceCenterController;
use App\Http\Controllers\API\AdminCenterController;


use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceOrderController;

use App\Http\Controllers\MechanicController;


Route::post('/register', [AuthController::class,'register'])->middleware('throttle:auth-login');
Route::post('/login', [AuthController::class,'login'])->middleware('throttle:auth-login');
Route::post('/login/admin-2fa', [AuthController::class, 'verifyAdminTwoFactor'])->middleware('throttle:auth-2fa');
Route::post('/forgot-password', [AuthController::class, 'sendResetLinkEmail'])->middleware('throttle:password-reset');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');

Route::get('/parkings', [ParkingController::class, 'index']);
Route::get('/parkings/{id}', [ParkingController::class, 'show']);


Route::get('/about', [AboutController::class, 'index']);
Route::get('/contact', [ContactController::class, 'index']);
Route::post('/messages', [MessageController::class, 'store'])->middleware('throttle:public-write');
Route::get('/contact-info', [LayoutController::class, 'getContact']);
Route::get('/site-settings', [SiteSettingController::class, 'index']);


// সার্ভিস লিস্ট
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);


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

Route::post('/contact-form', [ContactController::class, 'submitContactForm'])->middleware('throttle:public-write');

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

    Route::middleware(['role:user', 'throttle:user-actions'])->group(function () {
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
        Route::put('/service-orders/{id}/cancel', [ServiceOrderController::class, 'cancel']);

    });

    Route::middleware('role:user,admin,manager,mechanic')->group(function () {
        Route::get('/profile', [ProfileController::class, 'getProfile']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::put('/change-password', [ProfileController::class, 'changePassword']);
    });


    Route::middleware(['role:admin', 'throttle:admin-actions'])->group(function () {
        Route::post('/parkings', [ParkingController::class, 'store']);
        Route::put('/parkings/{id}', [ParkingController::class, 'update']);
        Route::delete('/parkings/{id}', [ParkingController::class, 'destroy']);

        Route::post('/slots', [SlotController::class, 'store']);
        Route::put('/slots/{id}', [SlotController::class, 'update']);
        Route::delete('/slots/{id}', [SlotController::class, 'destroy']);
    });

    Route::middleware(['role:admin,manager', 'throttle:admin-actions'])->group(function () {
        Route::get('/admin/dashboard-stats', [AdminController::class, 'getDashboardStats'])->middleware('permission:admin.dashboard');

        Route::get('/admin/service-orders', [AdminController::class, 'getServiceOrders'])->middleware('permission:service_orders.view');
        Route::get('/admin/service-orders/stats', [AdminController::class, 'getServiceOrderStats'])->middleware('permission:service_orders.view');
        Route::post('/admin/service-orders/{id}/confirm', [AdminController::class, 'confirmBooking'])->middleware('permission:service_orders.update');
        Route::post('/admin/service-orders/auto-update', [AdminController::class, 'autoUpdateStatuses'])->middleware('permission:service_orders.update');
        Route::put('/admin/service-orders/{id}/status', [AdminController::class, 'updateStatus'])->middleware('permission:service_orders.update');
        Route::get('/admin/service-orders/{id}/download-slip', [AdminController::class, 'downloadServiceSlip'])->middleware('permission:service_orders.view');
        Route::get('/admin/service-orders/{id}/download-invoice', [AdminController::class, 'downloadServiceInvoice'])->middleware('permission:service_orders.view');

        Route::get('/admin/services', [AdminController::class, 'getServices'])->middleware('permission:services.view');
        Route::post('/admin/services', [AdminController::class, 'addService'])->middleware('permission:services.create');
        Route::put('/admin/services/{service}', [AdminController::class, 'updateService'])->middleware('permission:services.update');
        Route::delete('/admin/services/{service}', [AdminController::class, 'deleteService'])->middleware('permission:services.delete');
        Route::put('/admin/services/{service}/toggle-status', [AdminController::class, 'toggleServiceStatus'])->middleware('permission:services.update');
        Route::post('/admin/upload-service-image', [AdminController::class, 'uploadServiceImage'])->middleware('permission:services.create,services.update');

        Route::get('/admin/service-centers', [AdminCenterController::class, 'index'])->middleware('permission:service_centers.view');
        Route::post('/admin/service-centers', [AdminCenterController::class, 'store'])->middleware('permission:service_centers.create');
        Route::get('/admin/service-centers/{id}', [AdminCenterController::class, 'show'])->middleware('permission:service_centers.view');
        Route::put('/admin/service-centers/{id}', [AdminCenterController::class, 'update'])->middleware('permission:service_centers.update');
        Route::delete('/admin/service-centers/{id}', [AdminCenterController::class, 'destroy'])->middleware('permission:service_centers.delete');
        Route::patch('/admin/service-centers/{id}/status', [AdminCenterController::class, 'toggleStatus'])->middleware('permission:service_centers.update');
    });

    //admin

    Route::middleware(['role:admin,manager', 'throttle:admin-actions'])->group(function () {
    Route::get('/admin/bookings', [BookingController::class, 'adminIndex'])->middleware('permission:bookings.view');
    Route::get('/admin/users', [AdminController::class, 'getUsers'])->middleware('permission:users.view');
    Route::get('/admin/staff', [AdminController::class, 'getStaff'])->middleware('permission:staff.view');
    Route::post('/admin/staff', [AdminController::class, 'storeStaff'])->middleware('permission:staff.create');
    Route::get('/admin/staff/{user}', [AdminController::class, 'showStaff'])->middleware('permission:staff.view');
    Route::put('/admin/staff/{user}', [AdminController::class, 'updateStaff'])->middleware('permission:staff.update');
    Route::put('/admin/staff/{user}/block', [AdminController::class, 'blockStaff'])->middleware('permission:staff.update');
    Route::put('/admin/staff/{user}/unblock', [AdminController::class, 'unblockStaff'])->middleware('permission:staff.update');
    Route::delete('/admin/staff/{user}', [AdminController::class, 'deleteStaff'])->middleware('permission:staff.delete');
    Route::put('/admin/users/{user}/role', [AdminController::class, 'updateUserRole'])->middleware('permission:users.update');
    Route::put('/admin/users/{user}/block', [AdminController::class, 'blockUser'])->middleware('permission:users.update');
    Route::put('/admin/users/{user}/unblock', [AdminController::class, 'unblockUser'])->middleware('permission:users.update');
    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser'])->middleware('permission:users.delete');
    Route::get('/admin/roles', [AdminRoleController::class, 'index'])->middleware('permission:roles.view');
    Route::post('/admin/roles', [AdminRoleController::class, 'store'])->middleware('permission:roles.create');
    Route::get('/admin/roles/{role}', [AdminRoleController::class, 'show'])->middleware('permission:roles.view,roles.update');
    Route::put('/admin/roles/{role}', [AdminRoleController::class, 'update'])->middleware('permission:roles.update');
    Route::delete('/admin/roles/{role}', [AdminRoleController::class, 'destroy'])->middleware('permission:roles.delete');

    //Parking Routes
    Route::get('/admin/parkings', [AdminController::class, 'getParkings'])->middleware('permission:parkings.view');
    Route::post('/admin/parkings', [AdminController::class, 'addParking'])->middleware('permission:parkings.create');
    Route::put('/admin/parkings/{parking}', [AdminController::class, 'updateParking'])->middleware('permission:parkings.update');
    Route::delete('/admin/parkings/{parking}', [AdminController::class, 'deleteParking'])->middleware('permission:parkings.delete');
    Route::post('/admin/upload-image', [AdminController::class, 'uploadImage'])->middleware('permission:parkings.create,parkings.update');

    // Slot Management Routes
    Route::get('/admin/slots', [AdminController::class, 'getSlots'])->middleware('permission:slots.view');
    Route::post('/admin/slots', [AdminController::class, 'addSlot'])->middleware('permission:slots.create');
    Route::put('/admin/slots/{slot}', [AdminController::class, 'updateSlot'])->middleware('permission:slots.update');
    Route::put('/admin/slots/{slot}/toggle-availability', [AdminController::class, 'toggleSlotAvailability'])->middleware('permission:slots.update');
    Route::delete('/admin/slots/{slot}', [AdminController::class, 'deleteSlot'])->middleware('permission:slots.delete');

    // Wallet Transactions Routes
    Route::get('/admin/wallet-transactions', [AdminController::class, 'getWalletTransactions'])->middleware('permission:wallet_transactions.view');
    Route::get('/admin/wallet-transactions/export', [AdminController::class, 'exportWalletTransactions'])->middleware('permission:wallet_transactions.view');

    // Reports Routes
    Route::get('/admin/reports', [AdminController::class, 'getReports'])->middleware('permission:reports.view');
    Route::get('/admin/reports/export', [AdminController::class, 'exportReports'])->middleware('permission:reports.export');

    Route::post('/admin/bulk-delete', [AdminBulkDeleteController::class, 'destroy'])->middleware('permission:users.delete,parkings.delete,slots.delete,services.delete,messages.delete,team_members.delete,service_centers.delete');

    
    // Checkout management routes
    Route::get('/pending-checkouts', [AdminController::class, 'getPendingCheckouts'])->middleware('permission:checkouts.view');
    Route::post('/checkouts/{id}/approve', [AdminController::class, 'approveCheckout'])->middleware('permission:checkouts.update');
    Route::post('/checkouts/{id}/reject', [AdminController::class, 'rejectCheckout'])->middleware('permission:checkouts.update');

    // এটা যোগ করুন api.php তে
    Route::get('/admin/checkouts/stats', [AdminController::class, 'getCheckoutStats'])->middleware('permission:checkouts.view');

    // Admin Wallet Transactions Routes
    Route::get('/admin/payment-methods', [PaymentController::class, 'adminPaymentMethods'])->middleware('permission:payment_methods.view');
    Route::post('/admin/payment-methods', [PaymentController::class, 'storePaymentMethod'])->middleware('permission:payment_methods.create');
    Route::post('/admin/payment-methods/upload-logo', [PaymentController::class, 'uploadPaymentMethodLogo'])->middleware('permission:payment_methods.create,payment_methods.update');
    Route::put('/admin/payment-methods/{paymentMethod}', [PaymentController::class, 'updatePaymentMethod'])->middleware('permission:payment_methods.update');
    Route::patch('/admin/payment-methods/{paymentMethod}/toggle', [PaymentController::class, 'togglePaymentMethod'])->middleware('permission:payment_methods.update');
    Route::delete('/admin/payment-methods/{paymentMethod}', [PaymentController::class, 'deletePaymentMethod'])->middleware('permission:payment_methods.delete');
    Route::post('/admin/wallet-transactions/{id}/approve', [AdminController::class, 'approveTransaction'])->middleware('permission:wallet_transactions.update');
    Route::post('/admin/wallet-transactions/{id}/reject', [AdminController::class, 'rejectTransaction'])->middleware('permission:wallet_transactions.update');

    // Contact routes
    Route::get('/contacts', [ContactController::class, 'index'])->middleware('permission:contacts.view');
    Route::post('/contacts', [ContactController::class, 'store'])->middleware('permission:contacts.create');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->middleware('permission:contacts.view');
    Route::put('/contacts/{contact}', [ContactController::class, 'update'])->middleware('permission:contacts.update');
    Route::patch('/contacts/{contact}', [ContactController::class, 'update'])->middleware('permission:contacts.update');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->middleware('permission:contacts.delete');
    Route::get('/admin/site-settings', [SiteSettingController::class, 'show'])->middleware('permission:site_settings.view,site_settings.update');
    Route::put('/admin/site-settings', [SiteSettingController::class, 'update'])->middleware('permission:site_settings.update');
    Route::post('/admin/site-settings/upload', [SiteSettingController::class, 'uploadMedia'])->middleware('permission:site_settings.update');

    Route::get('/messages', [MessageController::class, 'index'])->middleware('permission:messages.view');
    Route::get('/messages/{id}', [MessageController::class, 'show'])->middleware('permission:messages.view');
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead'])->middleware('permission:messages.update');
    Route::put('/messages/{id}/replied', [MessageController::class, 'markAsReplied'])->middleware('permission:messages.update');
    Route::delete('/messages/{id}', [MessageController::class, 'destroy'])->middleware('permission:messages.delete');

    Route::get('/admin/team-members', [TeamController::class, 'index'])->middleware('permission:team_members.view');
    Route::post('/admin/team-members', [TeamController::class, 'store'])->middleware('permission:team_members.create');
    Route::get('/admin/team-members/{team}', [TeamController::class, 'show'])->middleware('permission:team_members.view,team_members.update');
    Route::put('/admin/team-members/{team}', [TeamController::class, 'update'])->middleware('permission:team_members.update');
    Route::delete('/admin/team-members/{team}', [TeamController::class, 'destroy'])->middleware('permission:team_members.delete');
    Route::patch('/admin/team-members/{team}/status', [TeamController::class, 'toggleStatus'])->middleware('permission:team_members.update');
    Route::post('/admin/team-members/upload-image', [TeamController::class, 'uploadImage'])->middleware('permission:team_members.create,team_members.update');

    });


    // Mechanic specific routes
    Route::prefix('mechanic')->middleware(['role:mechanic', 'throttle:user-actions'])->group(function() {
        Route::get('/orders', [MechanicController::class, 'getAssignedOrders']);
        Route::post('/orders/{id}/start', [MechanicController::class, 'startService']);
        Route::post('/orders/{id}/complete', [MechanicController::class, 'completeService']);
        Route::get('/orders/{id}/download-slip', [MechanicController::class, 'downloadSlip']);
        Route::get('/dashboard-stats', [MechanicController::class, 'getDashboardStats']);
    });
    
});




Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = User::findOrFail($id);
    $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect($frontendUrl . '/login?verified=0');
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // Redirect to React login page after successful verification
    return redirect($frontendUrl . '/login?verified=1');
})->middleware(['signed'])->name('verification.verify');
