<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Parking extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'image',
        'description',
        'address',
        'total_slots',
        'available_slots',
        'price_per_hour',
        'distance',
        'latitude',
        'longitude'
    ];

    protected static function booted(): void
    {
        static::saving(function (Parking $parking) {
            if (!$parking->isDirty('name') && $parking->slug) {
                return;
            }

            $base = Str::slug($parking->name) ?: 'parking';
            $slug = $base;
            $counter = 2;

            while (
                static::where('slug', $slug)
                    ->when($parking->exists, fn ($query) => $query->where('id', '!=', $parking->id))
                    ->exists()
            ) {
                $slug = "{$base}-{$counter}";
                $counter++;
            }

            $parking->slug = $slug;
        });
    }

    protected $casts = [
        'price_per_hour' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    // Slots relationship
    public function slots() {
        return $this->hasMany(Slot::class);
    }

    // Bookings relationship
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
