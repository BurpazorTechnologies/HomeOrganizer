<?php

namespace App\Services;

use App\Models\Client\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;

class ClientRegistrationService
{
    public function registerUser(
        string $email,
        string $password,
        string $firstName,
        string $lastName,
        bool $sendVerificationEmail = true
    ): User {
        $user = DB::transaction(function () use (
            $email,
            $password,
            $firstName,
            $lastName
        ) {
            $user = User::create([
                'email' => $email,
                'password' => $password,
            ]);

            $user->userInformation()->create([
                'first_name' => $firstName,
                'last_name' => $lastName,
            ]);

            return $user;
        });

        if ($sendVerificationEmail) {
            event(new Registered($user));
        }

        return $user;
    }
}

