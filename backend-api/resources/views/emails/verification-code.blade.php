<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verification Code</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4a6bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .verification-code { 
            background: #fff; 
            border: 2px dashed #4a6bff; 
            padding: 15px; 
            text-align: center; 
            font-size: 24px; 
            font-weight: bold; 
            margin: 20px 0;
            letter-spacing: 3px;
        }
        .transaction-details { background: white; padding: 15px; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Monark Parking</h1>
            <h2>Wallet Topup Verification</h2>
        </div>
        
        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            
            <p>You have requested to add money to your wallet. Please use the verification code below to complete your transaction:</p>
            
            <div class="verification-code">
                {{ $verificationCode }}
            </div>
            
            <div class="transaction-details">
                <h3>Transaction Details:</h3>
                <p><strong>Transaction ID:</strong> {{ $transaction->generated_transaction_id }}</p>
                <p><strong>Amount:</strong> BDT {{ number_format($transaction->amount, 2) }}</p>
                <p><strong>Payment Method:</strong> {{ strtoupper($transaction->payment_method) }}</p>
                <p><strong>Mobile Number:</strong> {{ $transaction->mobile_number }}</p>
            </div>
            
            <p><strong>Important:</strong> This verification code will expire in 30 minutes. Do not share this code with anyone.</p>
            
            <p>If you did not request this transaction, please ignore this email or contact our support team immediately.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Monark Parking. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>