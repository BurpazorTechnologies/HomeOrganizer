<?php

namespace App\Http\Controllers\Client\Socialite;

use Throwable; 
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;  
use Laravel\Socialite\Facades\Socialite;        
use Laravel\Socialite\Two\InvalidStateException;
use App\Models\Client\User;
use App\Http\Controllers\Controller;

class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        try {
            Log::info('Starting Google OAuth redirect');

            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');
            $redirectUri = config('services.google.redirect');

            Log::info('Google OAuth config', [
                'client_id' => $clientId ? 'SET' : 'NOT SET',
                'client_secret' => $clientSecret ? 'SET' : 'NOT SET',
                'redirect_uri' => $redirectUri
            ]);

            if (!$clientId || !$clientSecret) {
                Log::error('Google OAuth credentials not configured');
                return redirect()->route('client.login')->withErrors([
                    'google' => 'Google OAuth is not configured. Please contact support.'
                ]);
            }

            return Socialite::driver('google')->redirect();
        } catch (Throwable $e) {
            Log::error('Google OAuth redirect failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('client.login')->withErrors([
                'google' => 'Unable to connect to Google. Please try again.'
            ]);
        }
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = $this->firstOrCreateFromGoogle($googleUser);

            if (!$user) {
                return redirect()->route('client.login')->withErrors([
                    'google' => 'Unable to authenticate with Google. Please try again.'
                ]);
            }

            Auth::shouldUse('client');
            Auth::login($user);

            return redirect()->intended(route('client.dashboard'));
        } catch (InvalidStateException $e) {
            Log::warning('Google OAuth invalid state', [
                'error' => $e->getMessage()
            ]);

            session()->flush();
            session()->regenerateToken();

            return redirect()->route('client.login')->withErrors([
                'google' => 'Authentication session expired. Please try again.'
            ]);
        } catch (Throwable $e) {
            Log::error('Google OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('client.login')->withErrors([
                'google' => 'Authentication failed. Please try again.'
            ]);
        }
    }

    protected function firstOrCreateFromGoogle($googleUser): User|null
    {
        try {
            Log::info('Processing Google user', [
                'google_id' => $googleUser->getId(),
                'email' => $googleUser->getEmail(),
                'name' => $googleUser->getName(),
            ]);

            $email = $googleUser->getEmail();

            if (!$email) {
                Log::warning('Google user has no email address');
                return null;
            }


            $user = User::where('email', $email)->first();

            if (!$user) {
                $user = User::create([
                    'email' => $email,
                    'password' => bcrypt(Str::random(32)),
                    'email_verified_at' => now(),
                ]);

                Log::info('Created new user from Google OAuth', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }

            $this->updateUserInformation($user, $googleUser->getName());

            return $user;
        } catch (Throwable $e) {
            Log::error('Error in firstOrCreateFromGoogle', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    protected function updateUserInformation(User $user, string|null $fullName): void
    {
        if (!$fullName) {
            return;
        }

        $nameParts = $this->parseName($fullName);
        
        $userInformation = $user->userInformation;
        
        if (!$userInformation) {
            $userInformation = $user->userInformation()->create([
                'first_name' => $nameParts['first_name'],
                'last_name' => $nameParts['last_name'],
            ]);
            
            Log::info('Created user information from Google OAuth', [
                'user_id' => $user->id,
                'first_name' => $nameParts['first_name'],
                'last_name' => $nameParts['last_name']
            ]);
        } else {
            $updated = false;
            
            if (empty($userInformation->first_name)) {
                $userInformation->first_name = $nameParts['first_name'];
                $updated = true;
            }
            
            if (empty($userInformation->last_name)) {
                $userInformation->last_name = $nameParts['last_name'];
                $updated = true;
            }
            
            if ($updated) {
                $userInformation->save();
                
                Log::info('Updated user information from Google OAuth', [
                    'user_id' => $user->id,
                    'first_name' => $userInformation->first_name,
                    'last_name' => $userInformation->last_name
                ]);
            }
        }
    }

    protected function parseName(string $fullName): array
    {
        $nameParts = explode(' ', trim($fullName), 2);
        
        return [
            'first_name' => $nameParts[0] ?? '',
            'last_name' => $nameParts[1] ?? '',
        ];
    }
}
