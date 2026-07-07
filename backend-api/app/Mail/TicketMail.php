<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class TicketMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $booking;
    public $ticketNumber;

    public function __construct($booking, $ticketNumber)
    {
        $this->booking = $booking;
        $this->ticketNumber = $ticketNumber;
    }

    public function build()
    {
        $pdf = Pdf::loadView('emails.ticket-pdf', [
            'ticketNumber' => $this->ticketNumber,
            'userName' => $this->booking->user->name,
            'parkingName' => $this->booking->parking->name,
            'slotCode' => $this->booking->slot->slot_code,
            'hours' => $this->booking->hours,
            'totalPrice' => $this->booking->total_price,
            'extraCharges' => $this->booking->extra_charges ?? 0,
            'finalAmount' => $this->booking->total_price + ($this->booking->extra_charges ?? 0),
            'checkinTime' => $this->booking->created_at->format('M d, Y h:i A'),
            'checkoutTime' => now()->format('M d, Y h:i A'),
            'generatedAt' => now()->format('M d, Y h:i A'),
        ]);

        return $this->subject('Your Parking Ticket - ' . $this->ticketNumber)
                    ->view('emails.ticket-email')
                    ->attachData($pdf->output(), "ticket-{$this->ticketNumber}.pdf", [
                        'mime' => 'application/pdf',
                    ]);
    }
}
