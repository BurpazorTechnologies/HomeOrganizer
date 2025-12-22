<?php

use App\Models\Admin\User as AdminUser;
use App\Models\Client\User as ClientUser;
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
        $userRolesTable = 'user_roles';
        $tableNames = config('permission.table_names');

        if (!Schema::hasTable($userRolesTable)
            || empty($tableNames['model_has_roles'])
            || !Schema::hasTable($tableNames['model_has_roles'])) {
            return;
        }

        $pivotRecords = DB::table($userRolesTable)
            ->select('user_id', 'role_id')
            ->orderBy('id')
            ->get();

        if ($pivotRecords->isNotEmpty()) {
            $modelTypes = [
                AdminUser::class,
                ClientUser::class,
            ];

            $records = [];

            foreach ($pivotRecords as $record) {
                foreach ($modelTypes as $modelType) {
                    $records[] = [
                        'role_id' => $record->role_id,
                        'model_type' => $modelType,
                        'model_id' => $record->user_id,
                    ];
                }
            }

            foreach (array_chunk($records, 500) as $chunk) {
                DB::table($tableNames['model_has_roles'])
                    ->upsert($chunk, ['role_id', 'model_type', 'model_id'], []);
            }
        }

        Schema::dropIfExists($userRolesTable);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $userRolesTable = 'user_roles';
        $tableNames = config('permission.table_names');

        if (!Schema::hasTable($userRolesTable)) {
            Schema::create($userRolesTable, static function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')
                    ->references('id')
                    ->on('users');
                $table->foreignId('role_id')
                    ->references('id')
                    ->on('roles');
                $table->timestamps();
            });
        }

        if (empty($tableNames['model_has_roles'])
            || !Schema::hasTable($tableNames['model_has_roles'])) {
            return;
        }

        $modelTypes = [
            AdminUser::class,
            ClientUser::class,
        ];

        $rows = DB::table($tableNames['model_has_roles'])
            ->whereIn('model_type', $modelTypes)
            ->select('model_id as user_id', 'role_id')
            ->distinct()
            ->get()
            ->map(static function (object $record) {
                return [
                    'user_id' => $record->user_id,
                    'role_id' => $record->role_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->all();

        if (!empty($rows)) {
            DB::table($userRolesTable)->insert($rows);
        }
    }
};


