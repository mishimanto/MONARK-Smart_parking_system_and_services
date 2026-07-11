<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class EmailService
{
    /**
     * Send verification code email
     */
    public function sendVerificationCode($user, $transaction, $verificationCode)
    {
        try {
            Mail::to($user->email)->send(new VerificationCodeMail($user, $transaction, $verificationCode));
            return true;
        } catch (\Exception $e) {
            \Log::error('Email sending failed: ' . $e->getMessage());
            return false;
        }
    }
}
