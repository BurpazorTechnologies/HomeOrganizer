<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user
     */
    public function register(array $data): array
    {
        $user = User::create([
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Login user with credentials
     */
    public function login(array $credentials): array
    {
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function getCurrentUser(): User
    {
        return Auth::user();
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    public function logoutAll(User $user): void
    {
        $user->tokens()->delete();
    }

    public function validateCredentials(array $credentials): bool
    {
        return Auth::validate($credentials);
    }

    public function createToken(User $user, string $name = 'auth-token'): string
    {
        return $user->createToken($name)->plainTextToken;
    }

    /**
     * Revoke all tokens for user
     */
    public function revokeAllTokens(User $user): int
    {
        return $user->tokens()->delete();
    }

    /**
     * Revoke specific token
     */
    public function revokeToken(User $user, string $tokenId): bool
    {
        return $user->tokens()->where('id', $tokenId)->delete() > 0;
    }
}
