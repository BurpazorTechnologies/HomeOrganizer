<?php

namespace Database\Factories;

use App\Models\UserInformation;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserInformationFactory extends Factory
{
    protected $model = UserInformation::class;

    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
        ];
    }
}

