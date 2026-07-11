<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($user->role !== 'admin' && !$user->roleModel?->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This role is inactive.',
            ], 403);
        }

        return $next($request);
    }
}
