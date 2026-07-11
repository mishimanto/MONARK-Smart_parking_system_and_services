<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('service_orders')) {
            return;
        }

        Schema::table('service_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('service_orders', 'assigned_mechanic_id')) {
                $table->foreignId('assigned_mechanic_id')
                    ->nullable()
                    ->after('service_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('service_orders', 'paid_amount')) {
                $table->decimal('paid_amount', 10, 2)->default(0)->after('notes');
            }

            if (!Schema::hasColumn('service_orders', 'refunded_amount')) {
                $table->decimal('refunded_amount', 10, 2)->default(0)->after('paid_amount');
            }

            if (!Schema::hasColumn('service_orders', 'scheduled_in_progress_at')) {
                $table->timestamp('scheduled_in_progress_at')->nullable()->after('invoice_generated_at');
            }

            if (!Schema::hasColumn('service_orders', 'scheduled_completed_at')) {
                $table->timestamp('scheduled_completed_at')->nullable()->after('scheduled_in_progress_at');
            }

            if (!Schema::hasColumn('service_orders', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('scheduled_completed_at');
            }

            if (!Schema::hasColumn('service_orders', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('started_at');
            }

            if (!Schema::hasColumn('service_orders', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            }

            if (!Schema::hasColumn('service_orders', 'refunded_at')) {
                $table->timestamp('refunded_at')->nullable()->after('cancelled_at');
            }

            if (!Schema::hasColumn('service_orders', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('refunded_at');
            }

            if (!Schema::hasColumn('service_orders', 'invoice_data')) {
                $table->json('invoice_data')->nullable()->after('cancellation_reason');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('service_orders')) {
            return;
        }

        Schema::table('service_orders', function (Blueprint $table) {
            if (Schema::hasColumn('service_orders', 'assigned_mechanic_id')) {
                $table->dropConstrainedForeignId('assigned_mechanic_id');
            }

            foreach ([
                'paid_amount',
                'refunded_amount',
                'scheduled_in_progress_at',
                'scheduled_completed_at',
                'started_at',
                'completed_at',
                'cancelled_at',
                'refunded_at',
                'cancellation_reason',
                'invoice_data',
            ] as $column) {
                if (Schema::hasColumn('service_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
