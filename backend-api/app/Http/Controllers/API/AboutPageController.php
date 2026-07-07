<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AboutPage;
use Illuminate\Http\Request;

class AboutPageController extends Controller
{
    public function show()
    {
        $aboutPage = AboutPage::first();
        
        if (!$aboutPage) {
            return response()->json([
                'message' => 'About page content not found'
            ], 404);
        }

        return response()->json($aboutPage);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'mission' => 'nullable|string',
            'vision' => 'nullable|string',
            'story' => 'nullable|string',
            'values' => 'nullable|array',
            'team' => 'nullable|array',
            'stats' => 'nullable|array',
            'image' => 'nullable|string'
        ]);

        $aboutPage = AboutPage::first();
        
        if ($aboutPage) {
            $aboutPage->update($validated);
        } else {
            $aboutPage = AboutPage::create($validated);
        }

        return response()->json($aboutPage, 201);
    }
}
