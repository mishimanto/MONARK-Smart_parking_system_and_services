<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ContactPage;
use Illuminate\Http\Request;

class ContactPageController extends Controller
{
    public function show()
    {
        $contactPage = ContactPage::first();
        
        if (!$contactPage) {
            return response()->json([
                'message' => 'Contact page content not found'
            ], 404);
        }

        return response()->json($contactPage);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'business_hours' => 'nullable|array',
            'social_links' => 'nullable|array',
            'map_embed' => 'nullable|string',
            'form_title' => 'nullable|string',
            'form_subtitle' => 'nullable|string'
        ]);

        $contactPage = ContactPage::first();
        
        if ($contactPage) {
            $contactPage->update($validated);
        } else {
            $contactPage = ContactPage::create($validated);
        }

        return response()->json($contactPage, 201);
    }
}
