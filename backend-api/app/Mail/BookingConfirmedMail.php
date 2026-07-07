<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class BookingConfirmedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $order;
    public $slipData;

    public function __construct($order, $slipData)
    {
        $this->order = $order;
        $this->slipData = $slipData;
    }

    public function build()
    {
        // Generate PDF slip
        $pdf = PDF::loadView('emails.booking_slip', [
            'slipData' => $this->slipData,
            'order' => $this->order
        ]);

        return $this->subject('Car Wash Service Booking Confirmed - Slip #' . $this->slipData['slip_number'])
                    ->view('emails.booking-confirmed')
                    ->attachData($pdf->output(), 
                                'booking-slip-' . $this->slipData['slip_number'] . '.pdf', 
                                ['mime' => 'application/pdf'])
                    ->with([
                        'order' => $this->order,
                        'slip' => $this->slipData
                    ]);
    }
}
