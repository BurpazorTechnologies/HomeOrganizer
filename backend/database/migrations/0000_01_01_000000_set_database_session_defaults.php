<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
	/**
	 * Run the migrations.
	 */
	public function up(): void
	{
		DB::statement("SET time_zone = '+00:00'");

		DB::statement("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");

		DB::statement("SET SESSION character_set_client = 'utf8mb4'");
		DB::statement("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void
	{
		DB::statement("SET time_zone = 'SYSTEM'");
		DB::statement("SET SESSION sql_mode = ''");
		DB::statement("SET SESSION character_set_client = 'utf8mb4'");
		DB::statement("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
	}
};


