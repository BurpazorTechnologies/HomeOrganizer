<?php

namespace Database\Seeders\Users;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission as PermissionModel;
use Spatie\Permission\Models\Role as RoleModel;

class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'pass1234';

    public function run(): void
    {
        $userList = [
            [
                'first_name' => 'Winzor',
                'last_name' => 'Paelmo',
                'email' => 'winzorjmpaelmo@gmail.com',
            ],
            [
                'first_name' => 'Angelica',
                'last_name' => 'Barcebal',
                'email' => 'angelicambarcebal@gmail.com',
            ],
        ];

        foreach ($userList as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'password' => self::DEFAULT_PASSWORD,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
