<?php

namespace App\Http\Requests\Admin\Auth;

use Illuminate\Support\Str;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    protected $redirectRoute = 'admin.login';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * @return void
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        Auth::shouldUse('admin');

        if (!$this->attemptAuthentication()) {
            $this->handleAuthenticationFailure();
        }

        if (!Auth::user()->isAdmin()) {
            $this->handleAuthenticationFailure();
        }

        RateLimiter::clear($this->throttleKey());
    }

    private function attemptAuthentication(): bool
    {
        return Auth::attempt(
            $this->only('email', 'password'),
            $this->boolean('remember')
        );
    }

    private function handleAuthenticationFailure(): void
    {
        RateLimiter::hit($this->throttleKey());
        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),
        ]);
    }

    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }

}
