<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contact;


class ContactController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $contacts = Contact::all();
            return response()->json($contacts);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch contacts',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'address' => 'required|string|max:255',
                'phone' => 'required|string|max:50',
                'email' => 'required|email|max:100',
                'map_embed' => 'nullable|string'
            ]);

            $contact = Contact::create($validated);

            return response()->json([
                'message' => 'Contact information created successfully',
                'data' => $contact
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create contact',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $contact = Contact::findOrFail($id);
            return response()->json($contact);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Contact not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch contact',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $contact = Contact::findOrFail($id);

            $validated = $request->validate([
                'address' => 'sometimes|required|string|max:255',
                'phone' => 'sometimes|required|string|max:50',
                'email' => 'sometimes|required|email|max:100',
                'map_embed' => 'nullable|string'
            ]);

            $contact->update($validated);

            return response()->json([
                'message' => 'Contact information updated successfully',
                'data' => $contact
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Contact not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update contact',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $contact = Contact::findOrFail($id);
            $contact->delete();

            return response()->json([
                'message' => 'Contact information deleted successfully'
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Contact not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete contact',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
