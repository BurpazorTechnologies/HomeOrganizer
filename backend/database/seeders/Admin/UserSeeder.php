<?php

namespace Database\Seeders\Admin;

use Illuminate\Database\Seeder;
use App\Models\Admin\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $userList = [
            [
                'first_name' => 'Winzor',
                'last_name' => 'Paelmo',
                'email' => 'admin@homeorganizer.com',
            ],
        ];

        $superAdminEmail = strtolower(config('user.super_admin.email', 'admin@homeorganizer.com'));
        $superAdminRole = config('user.super_admin.role', 'superadmin');
        $defaultAdminRole = config('user.defaults.admin.role', 'admin');
        $defaultAdminPassword = config('user.defaults.admin.password', 'admin@1234');

        foreach ($userList as $user) {
            $adminUser = User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'password' => $defaultAdminPassword,
                    'email_verified_at' => now(),
                ]
            );

            $adminUser->userInformation()->updateOrCreate(
                ['user_id' => $adminUser->id],
                [
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                ]
            );

            $isSuperAdminSeed = strtolower($user['email']) === $superAdminEmail;

            if ($isSuperAdminSeed) {
                $roles = array_values(array_filter([$superAdminRole, $defaultAdminRole]));

                if (!empty($roles)) {
                    $adminUser->syncRoles($roles);
                }

                continue;
            }

            if ($defaultAdminRole) {
                $adminUser->syncRoles([$defaultAdminRole]);
            }
        }
    }
}
