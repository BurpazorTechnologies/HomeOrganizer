<?php

namespace Database\Seeders;

use App\Services\Rbac\RbacSyncService;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(RbacSyncService::class)->sync();
    }
}

