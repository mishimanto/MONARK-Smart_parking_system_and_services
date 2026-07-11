<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\About;
use App\Models\Team;
use Illuminate\Support\Facades\Cache;

class AboutController extends Controller
{
    public function index()
    {
        $payload = Cache::remember('about-page:public', 600, function () {
            $about = About::first();
            $team = Team::where('is_active', true)
                ->orderByDesc('is_founder')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            if ($about && $about->image) {
                $about->image = $this->getImageUrl($about->image);
            }

            $team->transform(function ($member) {
                if ($member->image) {
                    $member->image = $this->getImageUrl($member->image);
                }

                return $member;
            });

            return [
                'about' => $about,
                'team' => $team,
            ];
        });

        return response()->json($payload);
    }
    
    private function getImageUrl($imagePath)
    {
        // Remove escaping slashes
        $imagePath = str_replace('\\/', '/', $imagePath);
        
        // If already full URL, return as is
        if (str_starts_with($imagePath, 'http') || str_starts_with($imagePath, 'data:')) {
            return $imagePath;
        }
        
        $baseUrl = config('app.url');
        $imagePath = ltrim($imagePath, '/');
        
        // Serve from public folder
        return $baseUrl . '/' . $imagePath;
    }
}
