<?php

namespace Database\Factories\Admin;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Admin\User;
use App\Models\UserInformation;

class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make(config('user.defaults.admin.password')),
            'remember_token' => Str::random(10),
        ];
    }

    public function withUserInformation(?array $userInformation = []): static
    {
        return $this->has(UserInformation::factory()->state(function (array $attributes) use ($userInformation) {
            return $userInformation ?: $attributes;
        }));
    }

    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            // ...
        })->afterCreating(function (User $user) {
            // ...
        });
    }
}
