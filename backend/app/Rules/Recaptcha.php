<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use App\Services\RecaptchaService;

class Recaptcha implements Rule
{
    public function __construct(protected RecaptchaService $recaptchaService)
    {
    }

    public function passes($attribute, $value): bool
    {
        return $this->recaptchaService->verify($value);
    }

    public function message(): string
    {
        return 'reCAPTCHA verification failed. Please try again.';
    }
} 