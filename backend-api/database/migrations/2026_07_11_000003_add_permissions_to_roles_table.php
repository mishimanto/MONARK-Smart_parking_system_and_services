<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'permissions')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->json('permissions')->nullable()->after('is_active');
            });
        }

        DB::table('roles')->where('slug', 'admin')->update([
            'permissions' => json_encode(['*']),
            'updated_at' => now(),
        ]);

        DB::table('roles')->where('slug', 'manager')->whereNull('permissions')->update([
            'permissions' => json_encode([
                'admin.dashboard',
                'services.view',
                'service_orders.view',
                'service_orders.update',
                'service_centers.view',
            ]),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('roles', 'permissions')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropColumn('permissions');
            });
        }
    }
};
