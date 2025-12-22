<?php

namespace Database\Seeders\Client;

use Illuminate\Database\Seeder;
use App\Models\Client\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('local')) {
            $userList = [
                [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                    'email' => 'user1@gmail.com',
                ],
                [
                    'first_name' => 'Jane',
                    'last_name' => 'Doe',
                    'email' => 'user2@gmail.com',
                ]
            ];

            foreach ($userList as $user) {
                    User::factory()
                    ->withUserInformation([
                        'first_name' => $user['first_name'],
                        'last_name' => $user['last_name']
                    ])
                    ->create([
                        'email' => $user['email']
                    ]);
            }
        }
    }
}
