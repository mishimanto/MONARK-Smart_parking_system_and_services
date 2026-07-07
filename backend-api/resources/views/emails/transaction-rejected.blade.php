<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transaction Rejected</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .transaction-details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .rejection-alert { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MONARK</h1>
            <h2>Wallet Topup Rejected</h2>
        </div>
        
        <div class="content">
            <div class="rejection-alert">
                <h3>❌ Transaction Rejected</h3>
                <p>Hello <strong>{{ $transaction->user->name }}</strong>,</p>
                <p>We regret to inform you that your wallet topup request has been rejected.</p>
            </div>

            <div class="transaction-details">
                <h3>Transaction Details:</h3>
                <p><strong>Transaction ID:</strong> {{ $transaction->generated_transaction_id }}</p>
                <p><strong>Amount:</strong> BDT {{ number_format($transaction->amount, 2) }}</p>
                <p><strong>Payment Method:</strong> {{ strtoupper($transaction->payment_method) }}</p>
                <p><strong>Rejection Date:</strong> {{ $transaction->approved_at->format('F j, Y \a\t g:i A') }}</p>
                <p><strong>Reason:</strong> {{ $reason }}</p>
            </div>

            <p><strong>What to do next?</strong></p>
            <ul>
                <li>Verify your payment details</li>
                <li>Ensure the transaction was completed successfully</li>
                <li>Contact your payment provider if needed</li>
                <li>You can submit a new topup request</li>
            </ul>

            <p><strong>Need Help?</strong><br>
            Contact our support team for more information about this rejection.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Monark Parking. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>