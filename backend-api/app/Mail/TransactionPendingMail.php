<?php
// app/Mail/TransactionPendingMail.php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\WalletTransaction;
use App\Models\User;

class TransactionPendingMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $transaction;
    public $user;

    public function __construct(WalletTransaction $transaction, User $user)
    {
        $this->transaction = $transaction;
        $this->user = $user;
    }

    public function build()
    {
        return $this->subject('Transaction Pending - Monark Parking')
                    ->view('emails.transaction_pending')
                    ->with([
                        'transaction' => $this->transaction,
                        'user' => $this->user
                    ]);
    }
}
