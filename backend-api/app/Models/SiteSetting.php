<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_name',
        'tagline',
        'description',
        'logo',
        'favicon',
        'primary_phone',
        'secondary_phone',
        'support_email',
        'business_email',
        'address',
        'business_hours',
        'facebook_url',
        'twitter_url',
        'linkedin_url',
        'instagram_url',
        'youtube_url',
        'footer_description',
        'copyright_text',
        'footer_features',
        'is_active',
    ];

    protected $casts = [
        'footer_features' => 'array',
        'is_active' => 'boolean',
    ];
}
