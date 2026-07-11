<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Login Verification</title>
    <style>
        body { margin: 0; padding: 0; background: #eef6f8; color: #102032; font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 560px; margin: 0 auto; padding: 28px 16px; }
        .card { overflow: hidden; border: 1px solid #b7dbe2; background: #ffffff; }
        .header { background: #081227; color: #ffffff; padding: 22px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 26px; }
        .code { margin: 22px 0; border: 2px dashed #0097a7; background: #ecfeff; color: #075985; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; }
        .notice { border-left: 4px solid #0097a7; background: #f0f9ff; padding: 12px 14px; color: #164e63; }
        .footer { padding: 18px 26px; background: #f8fafc; color: #64748b; font-size: 12px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h1>MONARK</h1>
                <p>Admin Login Verification</p>
            </div>
            <div class="content">
                <p>Hello <strong>{{ $user->name }}</strong>,</p>
                <p>Use this verification code to complete your admin login:</p>
                <div class="code">{{ $code }}</div>
                <div class="notice">
                    This code expires in {{ $expiresInMinutes }} minutes. Do not share it with anyone.
                </div>
                <p>If you did not try to sign in, change your password and contact support immediately.</p>
            </div>
            <div class="footer">
                &copy; {{ date('Y') }} MONARK. This is an automated security email.
            </div>
        </div>
    </div>
</body>
</html>
