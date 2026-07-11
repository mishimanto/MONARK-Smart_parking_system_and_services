<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
        'role',
        'wallet_balance',
        'is_blocked', 
        'email_verified_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'wallet_balance' => 'decimal:2',
        'is_blocked' => 'boolean'
    ];

    // Add this relationship
    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function assignedServiceOrders()
    {
        return $this->hasMany(ServiceOrder::class, 'assigned_mechanic_id');
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role', 'slug');
    }

    public function permissions(): array
    {
        if ($this->role === 'admin') {
            return ['*'];
        }

        $role = $this->roleModel;
        if (!$role?->is_active) {
            return [];
        }

        return is_array($role?->permissions) ? $role->permissions : [];
    }
}
