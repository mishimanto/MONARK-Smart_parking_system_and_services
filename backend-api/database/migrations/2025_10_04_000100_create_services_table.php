<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('services')) {
            return;
        }

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_center_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('type')->nullable();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('duration')->nullable();
            $table->string('status')->default('active');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
