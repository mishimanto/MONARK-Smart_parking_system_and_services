<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TransactionRejectedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $transaction;
    public $reason;

    public function __construct($transaction, $reason)
    {
        $this->transaction = $transaction;
        $this->reason = $reason;
    }

    public function build()
    {
        return $this->subject('❌ Wallet Topup Rejected - MONARK')
                    ->view('emails.transaction-rejected')
                    ->with([
                        'transaction' => $this->transaction,
                        'reason' => $this->reason
                    ]);
    }
}
