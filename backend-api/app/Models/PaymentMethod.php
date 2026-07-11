<?php
// app/Models/PaymentMethod.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

     protected $table = 'payment_methods';

    protected $fillable = [
        'name', 'type', 'account_number', 'icon', 'is_active', 'credentials'
    ];

    protected $casts = [
        'credentials' => 'array',
        'is_active' => 'boolean'
    ];
}
