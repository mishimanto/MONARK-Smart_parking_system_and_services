<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('wallet_transactions')) {
            return;
        }

        DB::statement('ALTER TABLE wallet_transactions MODIFY payment_method VARCHAR(120) NULL');
    }

    public function down(): void
    {
        if (!Schema::hasTable('wallet_transactions')) {
            return;
        }

        DB::statement("ALTER TABLE wallet_transactions MODIFY payment_method ENUM('bkash','nagad','card','wallet') NULL");
    }
};
