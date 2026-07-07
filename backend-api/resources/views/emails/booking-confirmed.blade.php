<!DOCTYPE html>
<html>
<head>
    <title>Booking Confirmed</title>
</head>
<body>
    <h2>Your Car Wash Service Booking is Confirmed!</h2>
    
    <p>Hello {{ $order->user->name }},</p>
    
    <p>Your car wash service booking has been confirmed. Here are your booking details:</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <h3>Booking Details</h3>
        <p><strong>Service:</strong> {{ $order->service->name }}</p>
        <p><strong>Booking Time:</strong> {{ $order->booking_time }}</p>
        <p><strong>Duration:</strong> {{ $order->service->duration }}</p>
        <p><strong>Price:</strong> BDT {{ number_format($order->service->price, 2) }}</p>
        <p><strong>Slip Number:</strong> {{ $slip['slip_number'] }}</p>
    </div>
    
    <p><strong>Instructions:</strong> {{ $slip['instructions'] }}</p>
    
    <p><strong>Important:</strong> Your booking slip (PDF) is attached with this email. Please present it at our service center.</p>
    
    <p>Thank you for choosing our service!</p>
</body>
</html>