<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, ...$permissions)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role === 'admin') {
            return $next($request);
        }

        $userPermissions = $user->permissions();

        foreach ($permissions as $permission) {
            if (in_array($permission, $userPermissions, true) || in_array('*', $userPermissions, true)) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'You do not have permission to access this resource.',
        ], 403);
    }
}
