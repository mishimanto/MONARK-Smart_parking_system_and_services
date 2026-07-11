<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'parking_id',
        'slot_id',
        'hours',
        'end_time',
        'total_price',
        'status',
        'checkout_requested',
        'checkout_approved',
        'actual_end_time',
        'extra_charges',
        'grand_total', // ✅ new column added
        'ticket_generated',
        'ticket_number'
    ];

    protected $casts = [
        'end_time' => 'datetime',
        'actual_end_time' => 'datetime',
        'total_price' => 'decimal:2',
        'extra_charges' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'checkout_requested' => 'boolean',
        'checkout_approved' => 'boolean',
        'ticket_generated' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parking()
    {
        return $this->belongsTo(Parking::class);
    }

    public function slot()
    {
        return $this->belongsTo(Slot::class);
    }
}
