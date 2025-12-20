<?php

namespace Database\Seeders\Users;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission as PermissionModel;
use Spatie\Permission\Models\Role as RoleModel;

class UserSeeder extends Seeder
{
    /**
     * Default password for seeded users.
     */
    public const DEFAULT_PASSWORD = 'password123';

    public function run(): void
    {

    }
}
