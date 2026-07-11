<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payment_methods') || Schema::hasColumn('payment_methods', 'icon')) {
            return;
        }

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('icon')->nullable()->after('account_number');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('payment_methods') || !Schema::hasColumn('payment_methods', 'icon')) {
            return;
        }

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn('icon');
        });
    }
};
