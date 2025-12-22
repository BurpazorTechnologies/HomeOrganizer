<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        $conn = DB::connection('pgsql');
        $conn->statement('CREATE EXTENSION IF NOT EXISTS pgcrypto'); // gen_random_uuid()
        $conn->statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    }

    public function down(): void
    {

    }
};
