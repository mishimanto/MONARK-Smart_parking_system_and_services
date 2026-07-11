<?php

use App\Models\Parking;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('parkings', 'slug')) {
            Schema::table('parkings', function (Blueprint $table) {
                $table->string('slug')->nullable()->unique()->after('name');
            });
        }

        Parking::query()
            ->whereNull('slug')
            ->orWhere('slug', '')
            ->orderBy('id')
            ->get()
            ->each(function (Parking $parking) {
                $base = Str::slug($parking->name) ?: 'parking';
                $slug = $base;
                $counter = 2;

                while (
                    Parking::where('slug', $slug)
                        ->where('id', '!=', $parking->id)
                        ->exists()
                ) {
                    $slug = "{$base}-{$counter}";
                    $counter++;
                }

                $parking->forceFill(['slug' => $slug])->saveQuietly();
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('parkings', 'slug')) {
            Schema::table('parkings', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->dropColumn('slug');
            });
        }
    }
};
