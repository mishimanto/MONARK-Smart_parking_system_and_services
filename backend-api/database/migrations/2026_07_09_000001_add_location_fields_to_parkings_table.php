<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('parkings', function (Blueprint $table) {
            if (!Schema::hasColumn('parkings', 'address')) {
                $table->string('address')->nullable()->after('description');
            }

            if (!Schema::hasColumn('parkings', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('distance');
            }

            if (!Schema::hasColumn('parkings', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('parkings', function (Blueprint $table) {
            $columns = array_filter(['address', 'latitude', 'longitude'], fn ($column) => Schema::hasColumn('parkings', $column));

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
