<?php
// database/migrations/2025_10_05_000000_create_payment_methods_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentMethodsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('payment_methods')) {
            return;
        }

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // bKash, Nagad, Rocket
            $table->string('type'); // mobile_banking, card
            $table->string('account_number')->nullable(); // merchant number
            $table->boolean('is_active')->default(true);
            $table->json('credentials')->nullable(); // API credentials
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('payment_methods');
    }
}
