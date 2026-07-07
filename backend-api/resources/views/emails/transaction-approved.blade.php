<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transaction Approved</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4a6bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .transaction-details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success-alert { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MONARK</h1>
            <h2>Wallet Topup Approved</h2>
        </div>
        
        <div class="content">
            <div class="success-alert">
                <h3>✅ Transaction Approved!</h3>
                <p>Hello <strong>{{ $user->name }}</strong>,</p>
                <p>Your wallet topup request has been approved successfully.</p>
            </div>

            <div class="transaction-details">
                <h3>Transaction Details:</h3>
                <p><strong>Transaction ID:</strong> {{ $transaction->generated_transaction_id }}</p>
                <p><strong>Amount:</strong> BDT {{ number_format($transaction->amount, 2) }}</p>
                <p><strong>Payment Method:</strong> {{ strtoupper($transaction->payment_method) }}</p>
                <p><strong>Approval Date:</strong> {{ $transaction->approved_at->format('F j, Y \a\t g:i A') }}</p>
                <p><strong>New Wallet Balance:</strong> BDT {{ number_format($user->wallet_balance, 2) }}</p>
            </div>

            <p>Thank you for using Monark Parking services. Your wallet has been credited successfully.</p>
            
            <p><strong>Need Help?</strong><br>
            Contact our support team if you have any questions.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Monark Parking. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>