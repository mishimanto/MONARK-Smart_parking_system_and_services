<?php

namespace App\Http\Controllers\API;

use App\Mail\AdminTwoFactorCodeMail;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Throwable;

class AuthController extends Controller
{
    private const ADMIN_2FA_TTL_MINUTES = 10;

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
            'user' => $this->userPayload($user)
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

        if ($user->role !== 'admin' && !$user->roleModel?->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'This role is inactive. Please contact the administrator.',
            ], 403);
        }

        if ($user->role === 'admin') {
            return $this->startAdminTwoFactorChallenge($user);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'User logged in successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user),
        ]);
    }

    public function verifyAdminTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'challenge_token' => 'required|string',
            'code' => 'required|string|min:6|max:6',
        ]);

        $cacheKey = $this->adminTwoFactorCacheKey($validated['challenge_token']);
        $challenge = Cache::get($cacheKey);

        if (!$challenge || empty($challenge['user_id']) || empty($challenge['code_hash'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Verification code expired. Please login again.',
            ], 422);
        }

        $user = User::find($challenge['user_id']);

        if (!$user || $user->role !== 'admin') {
            Cache::forget($cacheKey);

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid verification challenge.',
            ], 422);
        }

        if (!Hash::check($validated['code'], $challenge['code_hash'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid verification code.',
            ], 422);
        }

        Cache::forget($cacheKey);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Admin login verified successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user),
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
        return response()->json(['status'=>'success','user'=>$this->userPayload($request->user())]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar' => $user->avatar,
            'avatar_url' => $this->absoluteImageUrl($user->avatar),
            'wallet_balance' => $user->wallet_balance,
            'permissions' => $user->permissions(),
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
        ];
    }

    private function startAdminTwoFactorChallenge(User $user)
    {
        $code = (string) random_int(100000, 999999);
        $challengeToken = Str::random(64);
        $expiresAt = now()->addMinutes(self::ADMIN_2FA_TTL_MINUTES);

        Cache::put($this->adminTwoFactorCacheKey($challengeToken), [
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'ip' => request()->ip(),
            'expires_at' => $expiresAt->toIso8601String(),
        ], $expiresAt);

        try {
            Mail::to($user->email)->queue(new AdminTwoFactorCodeMail($user, $code, self::ADMIN_2FA_TTL_MINUTES));
        } catch (Throwable $error) {
            Log::error('Admin 2FA email failed: '.$error->getMessage(), ['user_id' => $user->id]);

            if (!app()->environment('local')) {
                Cache::forget($this->adminTwoFactorCacheKey($challengeToken));

                return response()->json([
                    'status' => 'error',
                    'message' => 'Could not send verification code. Please contact support.',
                ], 500);
            }
        }

        $payload = [
            'status' => 'requires_2fa',
            'requires_2fa' => true,
            'message' => 'Verification code sent to your email.',
            'challenge_token' => $challengeToken,
            'expires_in' => self::ADMIN_2FA_TTL_MINUTES * 60,
        ];

        if (app()->environment('local')) {
            $payload['verification_code'] = $code;
        }

        return response()->json($payload);
    }

    private function adminTwoFactorCacheKey(string $token): string
    {
        return 'admin_2fa:'.hash('sha256', $token);
    }

    private function absoluteImageUrl(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
            return $value;
        }

        return rtrim(config('app.url'), '/') . '/' . ltrim($value, '/');
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
