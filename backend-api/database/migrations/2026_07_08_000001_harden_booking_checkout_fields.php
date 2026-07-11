<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('bookings')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bookings MODIFY status VARCHAR(50) NOT NULL DEFAULT 'pending'");
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'checkout_requested')) {
                $table->boolean('checkout_requested')->default(false)->after('status');
            }

            if (!Schema::hasColumn('bookings', 'checkout_approved')) {
                $table->boolean('checkout_approved')->default(false)->after('checkout_requested');
            }

            if (!Schema::hasColumn('bookings', 'actual_end_time')) {
                $table->timestamp('actual_end_time')->nullable()->after('checkout_approved');
            }

            if (!Schema::hasColumn('bookings', 'extra_charges')) {
                $table->decimal('extra_charges', 10, 2)->default(0)->after('actual_end_time');
            }

            if (!Schema::hasColumn('bookings', 'grand_total')) {
                $table->decimal('grand_total', 10, 2)->default(0)->after('extra_charges');
            }

            if (!Schema::hasColumn('bookings', 'ticket_generated')) {
                $table->boolean('ticket_generated')->default(false)->after('grand_total');
            }

            if (!Schema::hasColumn('bookings', 'ticket_number')) {
                $table->string('ticket_number')->nullable()->unique()->after('ticket_generated');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            foreach ([
                'ticket_number',
                'ticket_generated',
                'grand_total',
                'extra_charges',
                'actual_end_time',
                'checkout_approved',
                'checkout_requested',
            ] as $column) {
                if (Schema::hasColumn('bookings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bookings MODIFY status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending'");
        }
    }
};
