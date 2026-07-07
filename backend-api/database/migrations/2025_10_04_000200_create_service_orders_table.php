<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('service_orders')) {
            return;
        }

        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->dateTime('booking_time');
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->string('slip_number')->nullable()->unique();
            $table->string('invoice_number')->nullable()->unique();
            $table->timestamp('invoice_generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
