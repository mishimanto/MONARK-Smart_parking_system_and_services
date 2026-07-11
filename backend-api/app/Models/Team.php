<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'position',
        'bio',
        'image',
        'is_founder',
        'sort_order',
        'is_active',
        'linkedin_url',
        'twitter_url',
        'github_url',
    ];

    protected $casts = [
        'is_founder' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
