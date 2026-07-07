<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $transaction;
    public $verificationCode;

    public function __construct($user, $transaction, $verificationCode)
    {
        $this->user = $user;
        $this->transaction = $transaction;
        $this->verificationCode = $verificationCode;
    }

    public function build()
    {
        return $this->subject('Wallet Topup Verification Code - Monark Parking')
                    ->view('emails.verification-code')
                    ->with([
                        'user' => $this->user,
                        'transaction' => $this->transaction,
                        'verificationCode' => $this->verificationCode
                    ]);
    }
}
