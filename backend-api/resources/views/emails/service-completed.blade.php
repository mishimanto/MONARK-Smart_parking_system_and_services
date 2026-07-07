<!DOCTYPE html>
<html>
<head>
    <title>Service Completed</title>
</head>
<body>
    <h2>Your Car Wash Service is Completed!</h2>
    
    <p>Hello {{ $order->user->name }},</p>
    
    <p>Your car wash service has been completed successfully. Here are the service details:</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <h3>Service Details</h3>
        <p><strong>Service:</strong> {{ $order->service->name }}</p>
        <p><strong>Completed At:</strong> {{ now()->format('F j, Y g:i A') }}</p>
        <p><strong>Duration:</strong> {{ $order->service->duration }}</p>
        <p><strong>Price:</strong> BDT {{ number_format($order->service->price, 2) }}</p>
        <p><strong>Invoice Number:</strong> {{ $invoice['invoice_number'] }}</p>
        <p><strong>Mechanic:</strong> {{ $invoice['mechanic_name'] }}</p>
    </div>
    
    <p><strong>Important:</strong> Your detailed invoice (PDF) is attached with this email.</p>
    
    <p>Thank you for choosing our service!</p>
    
    <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
        <p><strong>Service Center Info:</strong></p>
        <p>Car Wash Service Center<br>
        Main Road, Dhaka<br>
        Phone: +880 XXXX-XXXXXX<br>
        Email: info@carwash.com</p>
    </div>
</body>
</html>