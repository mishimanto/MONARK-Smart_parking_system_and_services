<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\About;
use App\Models\Team;

class AboutController extends Controller
{
    public function index()
    {
        // abouts টেবিল থেকে data নিন
        $about = About::first();
        
        // teams টেবিল থেকে সব team members নিন
        $team = Team::all();
        
        // Process about image
        if ($about && $about->image) {
            $about->image = $this->getImageUrl($about->image);
        }
        
        // Process team images
        $team->transform(function($member) {
            if ($member->image) {
                $member->image = $this->getImageUrl($member->image);
            }
            return $member;
        });
        
        return response()->json([
            'about' => $about,
            'team' => $team
        ]);
    }
    
    private function getImageUrl($imagePath)
    {
        // Remove escaping slashes
        $imagePath = str_replace('\\/', '/', $imagePath);
        
        // If already full URL, return as is
        if (str_starts_with($imagePath, 'http')) {
            return $imagePath;
        }
        
        $baseUrl = config('app.url');
        $imagePath = ltrim($imagePath, '/');
        
        // Serve from public folder
        return $baseUrl . '/' . $imagePath;
    }
}
