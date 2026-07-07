<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator; 
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    // Register
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
             'role' => 'in:admin,manager,user',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'User registered successfully. You can now login.',
            'user' => $user
        ], 201);
    }

    // Login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'User logged in successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }


    // Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'=>'success',
            'message'=>'Logged out successfully'
        ]);
    }

    // Optional: Authenticated user info
    public function me(Request $request)
    {
        return response()->json(['status'=>'success','user'=>$request->user()]);
    }

     public function sendResetLinkEmail(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user exists
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No account found with this email address.'
                ], 404);
            }

            // Generate reset token using Str class
            $token = Str::random(60);
            $user->forceFill([
                'remember_token' => $token
            ])->save();

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($request->email);

            return response()->json([
                'success' => true,
                'message' => 'Password reset link generated successfully.',
                'reset_url' => $resetUrl, // For testing only
                'token' => $token // For testing only
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send reset link: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required',
                'email' => 'required|email|exists:users,email',
                'password' => 'required|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find user by email and token
            $user = User::where('email', $request->email)
                       ->where('remember_token', $request->token)
                       ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token.'
                ], 400);
            }

            // Update password
            $user->forceFill([
                'password' => Hash::make($request->password),
                'remember_token' => Str::random(60), // Generate new token
            ])->save();

            return response()->json([
                'success' => true,
                'message' => 'Password has been reset successfully. You can now login with your new password.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset password: ' . $e->getMessage()
            ], 500);
        }
    }
}
