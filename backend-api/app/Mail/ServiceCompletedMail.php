<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class ServiceCompletedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $order;
    public $invoiceData;

    public function __construct($order, $invoiceData = null)
    {
        $this->order = $order;
        $this->invoiceData = $invoiceData ?: [
            'invoice_number' => $order->invoice_number ?: ('INV-' . str_pad($order->id, 6, '0', STR_PAD_LEFT)),
            'generated_at' => optional($order->invoice_generated_at)->format('M d, Y h:i A') ?: now()->format('M d, Y h:i A'),
            'service_name' => $order->service->name ?? 'Car Service',
            'customer_name' => $order->user->name ?? 'Customer',
            'amount' => $order->service->price ?? 0,
        ];
    }

    public function build()
    {
        // Generate PDF invoice
        $pdf = PDF::loadView('emails.service_invoice', [
            'invoiceData' => $this->invoiceData,
            'order' => $this->order
        ]);

        return $this->subject('Car Wash Service Completed - Invoice #' . $this->invoiceData['invoice_number'])
                    ->view('emails.service-completed')
                    ->attachData($pdf->output(), 
                                'invoice-' . $this->invoiceData['invoice_number'] . '.pdf', 
                                ['mime' => 'application/pdf'])
                    ->with([
                        'order' => $this->order,
                        'invoice' => $this->invoiceData
                    ]);
    }
}
