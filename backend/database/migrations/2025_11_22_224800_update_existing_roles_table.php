<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        Schema::table('roles', static function (Blueprint $table) {
            if (!Schema::hasColumn('roles', 'guard_name')) {
                $table->string('guard_name')
                    ->default(config('auth.defaults.guard', 'web'))
                    ->after('name');
            }
        });

        $defaultGuard = config('auth.defaults.guard', 'web');

        DB::table('roles')
            ->whereNull('guard_name')
            ->orWhere('guard_name', '')
            ->update(['guard_name' => $defaultGuard]);

        $guardOverrides = [
            'admin' => 'admin',
            'client' => 'client',
        ];

        foreach ($guardOverrides as $roleName => $guardName) {
            DB::table('roles')
                ->where('name', $roleName)
                ->update(['guard_name' => $guardName]);
        }

        try {
            Schema::table('roles', static function (Blueprint $table) {
                $table->unique(['name', 'guard_name'], 'roles_name_guard_name_unique');
            });
        } catch (\Throwable $exception) {
            $message = strtolower($exception->getMessage());

            if (!str_contains($message, 'duplicate') && !str_contains($message, 'exists')) {
                throw $exception;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        try {
            Schema::table('roles', static function (Blueprint $table) {
                $table->dropUnique('roles_name_guard_name_unique');
            });
        } catch (\Throwable $exception) {
            $message = strtolower($exception->getMessage());

            if (!str_contains($message, 'exists')) {
                throw $exception;
            }
        }

        if (Schema::hasColumn('roles', 'guard_name')) {
            Schema::table('roles', static function (Blueprint $table) {
                $table->dropColumn('guard_name');
            });
        }
    }
};


