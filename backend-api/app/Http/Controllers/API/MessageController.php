<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Message;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    public function index()
    {
        try {
            Log::info('Fetching messages from database');
            
            $messages = Message::orderBy('created_at', 'desc')->get();
            
            Log::info('Messages fetched successfully', ['count' => $messages->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $messages,
                'count' => $messages->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error("Message fetch failed: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch messages',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email',
                'subject' => 'nullable|string|max:255',
                'message' => 'required|string'
            ]);

            $message = Message::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully!',
                'data'    => $message
            ]);
        } catch (\Exception $e) {
            Log::error("Message store failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markAsRead($id)
    {
        try {
            Log::info("Marking message as read", ['message_id' => $id]);
            
            $message = Message::find($id);
            
            if (!$message) {
                return response()->json([
                    'success' => false,
                    'error' => 'Message not found'
                ], 404);
            }

            $message->update([
                'status' => 'read',
                'updated_at' => now()
            ]);

            Log::info("Message marked as read successfully", ['message_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Message marked as read successfully',
                'data' => $message
            ]);
            
        } catch (\Exception $e) {
            Log::error("Failed to mark message as read: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to mark message as read',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function markAsReplied($id)
    {
        try {
            Log::info("Marking message as replied", ['message_id' => $id]);
            
            $message = Message::find($id);
            
            if (!$message) {
                return response()->json([
                    'success' => false,
                    'error' => 'Message not found'
                ], 404);
            }

            $message->update([
                'status' => 'replied',
                'updated_at' => now()
            ]);

            Log::info("Message marked as replied successfully", ['message_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Message marked as replied successfully',
                'data' => $message
            ]);
            
        } catch (\Exception $e) {
            Log::error("Failed to mark message as replied: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to mark message as replied',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Log::info("Deleting message", ['message_id' => $id]);
            
            $message = Message::find($id);
            
            if (!$message) {
                return response()->json([
                    'success' => false,
                    'error' => 'Message not found'
                ], 404);
            }

            $message->delete();

            Log::info("Message deleted successfully", ['message_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error("Failed to delete message: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete message',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Optional: Get message by ID
    public function show($id)
    {
        try {
            $message = Message::find($id);
            
            if (!$message) {
                return response()->json([
                    'success' => false,
                    'error' => 'Message not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $message
            ]);
            
        } catch (\Exception $e) {
            Log::error("Failed to fetch message: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch message',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
