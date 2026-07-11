<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminRoleController extends Controller
{
    private array $statusProtectedRoles = ['admin', 'user'];

    public function index(Request $request)
    {
        $query = Role::query()
            ->where('slug', '!=', 'user')
            ->withCount('users');

        if ($request->filled('q')) {
            $search = trim($request->input('q'));
            $query->where(function ($roleQuery) use ($search) {
                $roleQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        if ($request->boolean('all')) {
            return response()->json([
                'success' => true,
                'data' => $query->orderBy('is_system', 'desc')->orderBy('name')->get(),
            ]);
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('is_system', 'desc')->orderBy('name')->paginate($perPage),
        ]);
    }

    public function show(Role $role)
    {
        return response()->json([
            'success' => true,
            'data' => $role->loadCount('users'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'slug' => 'nullable|string|max:80|unique:roles,slug',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|max:120',
        ]);

        $slug = Str::slug($validated['slug'] ?? $validated['name'], '_');

        if (!$slug) {
            return response()->json([
                'success' => false,
                'message' => 'Role slug is invalid.',
            ], 422);
        }

        if (Role::where('slug', $slug)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Role slug already exists.',
            ], 422);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
            'permissions' => array_values(array_unique($validated['permissions'] ?? [])),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully.',
            'data' => $role,
        ], 201);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'slug' => [
                'nullable',
                'string',
                'max:80',
                Rule::unique('roles', 'slug')->ignore($role->id),
            ],
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|max:120',
        ]);

        $updates = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ];

        if (!$role->is_system && array_key_exists('slug', $validated)) {
            $updates['slug'] = Str::slug($validated['slug'] ?: $validated['name'], '_');
        }

        if (array_key_exists('is_active', $validated)) {
            if (in_array($role->slug, $this->statusProtectedRoles, true) && !$validated['is_active']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin and user roles must stay active.',
                ], 422);
            }

            $updates['is_active'] = $validated['is_active'];
        }

        if ($role->slug !== 'admin') {
            $updates['permissions'] = array_values(array_unique($validated['permissions'] ?? []));
        }

        $role->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.',
            'data' => $role->fresh(),
        ]);
    }

    public function destroy(Role $role)
    {
        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'System roles cannot be deleted.',
            ], 403);
        }

        if (User::where('role', $role->slug)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This role is assigned to users and cannot be deleted.',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully.',
        ]);
    }
}
