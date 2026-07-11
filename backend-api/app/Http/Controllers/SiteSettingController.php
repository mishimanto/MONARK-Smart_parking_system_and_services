<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\SiteSetting;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class SiteSettingController extends Controller
{
    private const CACHE_KEY = 'site-settings:active';

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => self::activeSettings(),
        ]);
    }

    public function show()
    {
        return response()->json([
            'success' => true,
            'data' => $this->settingsRecord(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:120',
            'tagline' => 'nullable|string|max:180',
            'description' => 'nullable|string|max:1200',
            'logo' => 'nullable|string|max:500',
            'favicon' => 'nullable|string|max:500',
            'primary_phone' => 'nullable|string|max:60',
            'secondary_phone' => 'nullable|string|max:60',
            'support_email' => 'nullable|email|max:120',
            'business_email' => 'nullable|email|max:120',
            'address' => 'nullable|string|max:800',
            'business_hours' => 'nullable|string|max:120',
            'facebook_url' => 'nullable|string|max:500',
            'twitter_url' => 'nullable|string|max:500',
            'linkedin_url' => 'nullable|string|max:500',
            'instagram_url' => 'nullable|string|max:500',
            'youtube_url' => 'nullable|string|max:500',
            'footer_description' => 'nullable|string|max:1200',
            'copyright_text' => 'nullable|string|max:220',
            'footer_features' => 'nullable|array|max:6',
            'footer_features.*' => 'nullable|string|max:80',
            'admin_password' => 'required|string',
        ]);

        $this->verifyAdminPassword($request);
        unset($validated['admin_password']);

        $settings = $this->settingsRecord();
        $settings->update($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Site settings updated successfully',
            'data' => $settings->fresh(),
        ]);
    }

    public function uploadMedia(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|file|mimes:jpeg,png,jpg,gif,webp,ico|max:2048',
            'type' => 'required|in:logo,favicon',
            'admin_password' => 'required|string',
        ]);

        $this->verifyAdminPassword($request);

        $options = $validated['type'] === 'favicon'
            ? ['prefix' => 'favicon', 'width' => 256, 'height' => 256, 'fit' => 'cover', 'quality' => 88, 'allow_ico' => true]
            : ['prefix' => 'logo', 'width' => 520, 'height' => 220, 'quality' => 88];

        $uploaded = app(ImageUploadService::class)->storePublicImage($request->file('image'), 'site-settings', $options);

        return response()->json([
            'success' => true,
            'message' => ucfirst($validated['type']) . ' uploaded successfully',
            'url' => $uploaded['url'],
            'path' => $uploaded['path'],
            'extension' => $uploaded['extension'],
            'size' => $uploaded['size'],
            'type' => $validated['type'],
        ]);
    }

    public function contactInfo()
    {
        $settings = self::activeSettings();

        return response()->json([
            'address' => $settings['address'],
            'phone' => $settings['primary_phone'],
            'email' => $settings['support_email'],
            'map_embed' => null,
        ]);
    }

    public static function activeSettings(): array
    {
        return Cache::remember(self::CACHE_KEY, 600, function () {
            return self::normalize(SiteSetting::where('is_active', true)->first() ?? self::makeDefaultRecord());
        });
    }

    private function settingsRecord(): SiteSetting
    {
        return SiteSetting::first() ?? self::makeDefaultRecord();
    }

    private function verifyAdminPassword(Request $request): void
    {
        $user = $request->user();

        abort_if(!$user || $user->role !== 'admin', 403, 'Only admins can change site settings.');
        abort_if(!Hash::check((string) $request->input('admin_password'), $user->password), 403, 'Admin password verification failed.');
    }

    private static function makeDefaultRecord(): SiteSetting
    {
        $contact = Contact::first();

        return SiteSetting::create([
            'site_name' => 'MONARK',
            'tagline' => 'Smart parking and premium car care',
            'description' => 'Your trusted partner for smart parking solutions and premium car care services.',
            'primary_phone' => $contact?->phone ?: '+8801900000000',
            'support_email' => $contact?->email ?: 'support@monark.test',
            'address' => $contact?->address ?: 'Chasara, Narayanganj, Dhaka',
            'business_hours' => '24/7 Support',
            'footer_description' => 'Your trusted partner for smart parking solutions and premium car care services.',
            'copyright_text' => 'All rights reserved.',
            'footer_features' => ['24/7 Security', 'CCTV Coverage', 'Free WiFi', 'EV Charging'],
            'is_active' => true,
        ]);
    }

    private static function normalize(SiteSetting $settings): array
    {
        return [
            'site_name' => $settings->site_name ?: 'MONARK',
            'tagline' => $settings->tagline ?: 'Smart parking and premium car care',
            'description' => $settings->description ?: 'Your trusted partner for smart parking solutions and premium car care services.',
            'logo' => $settings->logo,
            'favicon' => $settings->favicon,
            'primary_phone' => $settings->primary_phone ?: '+8801900000000',
            'secondary_phone' => $settings->secondary_phone,
            'support_email' => $settings->support_email ?: 'support@monark.test',
            'business_email' => $settings->business_email,
            'address' => $settings->address ?: 'Chasara, Narayanganj, Dhaka',
            'business_hours' => $settings->business_hours ?: '24/7 Support',
            'facebook_url' => $settings->facebook_url,
            'twitter_url' => $settings->twitter_url,
            'linkedin_url' => $settings->linkedin_url,
            'instagram_url' => $settings->instagram_url,
            'youtube_url' => $settings->youtube_url,
            'footer_description' => $settings->footer_description ?: $settings->description,
            'copyright_text' => $settings->copyright_text ?: 'All rights reserved.',
            'footer_features' => $settings->footer_features ?: ['24/7 Security', 'CCTV Coverage', 'Free WiFi', 'EV Charging'],
        ];
    }
}
