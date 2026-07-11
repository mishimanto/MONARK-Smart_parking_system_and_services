<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'service_id',
        'assigned_mechanic_id',
        'booking_time',
        'status',
        'notes',
        'paid_amount',
        'refunded_amount',
        'slip_number',
        'invoice_number',
        'invoice_generated_at',
        'scheduled_in_progress_at',
        'scheduled_completed_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'refunded_at',
        'cancellation_reason',
        'invoice_data'
    ];

    protected $casts = [
        'booking_time' => 'datetime',
        'paid_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'invoice_generated_at' => 'datetime',
        'scheduled_in_progress_at' => 'datetime',
        'scheduled_completed_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'refunded_at' => 'datetime',
        'invoice_data' => 'array'
    ];

    // Relationship with Service
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedMechanic()
    {
        return $this->belongsTo(User::class, 'assigned_mechanic_id');
    }

    public function serviceCenter()
    {
        return $this->hasOneThrough(
            ServiceCenter::class,
            Service::class,
            'id', // Foreign key on services table
            'id', // Foreign key on service_centers table
            'service_id', // Local key on service_orders table
            'service_center_id' // Local key on services table
        );
    }
}
