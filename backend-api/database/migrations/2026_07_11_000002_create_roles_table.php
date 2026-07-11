<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->boolean('is_system')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        $roles = [
            ['name' => 'Admin', 'slug' => 'admin', 'description' => 'Full admin panel access.', 'is_system' => true],
            ['name' => 'User', 'slug' => 'user', 'description' => 'Customer booking and wallet access.', 'is_system' => true],
            ['name' => 'Manager', 'slug' => 'manager', 'description' => 'Manager workspace access.', 'is_system' => true],
            ['name' => 'Mechanic', 'slug' => 'mechanic', 'description' => 'Assigned service order workspace access.', 'is_system' => true],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $role['slug']],
                [
                    'name' => $role['name'],
                    'description' => $role['description'],
                    'is_system' => $role['is_system'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        if (Schema::hasTable('users')) {
            DB::table('users')
                ->select('role')
                ->whereNotNull('role')
                ->distinct()
                ->orderBy('role')
                ->get()
                ->each(function ($userRole) {
                    $slug = Str::slug((string) $userRole->role, '_');
                    if (!$slug) {
                        return;
                    }

                    DB::table('roles')->updateOrInsert(
                        ['slug' => $slug],
                        [
                            'name' => Str::headline(str_replace('_', ' ', $slug)),
                            'description' => 'Imported from existing users.',
                            'is_system' => in_array($slug, ['admin', 'user', 'manager', 'mechanic'], true),
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
