<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('teams')) {
            return;
        }

        Schema::table('teams', function (Blueprint $table) {
            if (!Schema::hasColumn('teams', 'is_founder')) {
                $table->boolean('is_founder')->default(false)->after('image');
            }

            if (!Schema::hasColumn('teams', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('is_founder');
            }

            if (!Schema::hasColumn('teams', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('sort_order');
            }

            if (!Schema::hasColumn('teams', 'linkedin_url')) {
                $table->string('linkedin_url')->nullable()->after('is_active');
            }

            if (!Schema::hasColumn('teams', 'twitter_url')) {
                $table->string('twitter_url')->nullable()->after('linkedin_url');
            }

            if (!Schema::hasColumn('teams', 'github_url')) {
                $table->string('github_url')->nullable()->after('twitter_url');
            }
        });

        if (Schema::hasColumn('teams', 'is_founder') && DB::table('teams')->where('is_founder', true)->doesntExist()) {
            $firstTeamMember = DB::table('teams')->orderBy('id')->first();

            if ($firstTeamMember) {
                DB::table('teams')->where('id', $firstTeamMember->id)->update([
                    'is_founder' => true,
                    'position' => 'Founder & CEO',
                ]);
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('teams')) {
            return;
        }

        Schema::table('teams', function (Blueprint $table) {
            foreach (['github_url', 'twitter_url', 'linkedin_url', 'is_active', 'sort_order', 'is_founder'] as $column) {
                if (Schema::hasColumn('teams', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
