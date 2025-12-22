<?php

namespace App\Http\Controllers\Client\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Client\Auth\LoginRequest;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Client/Auth/Login', [
            'canResetPassword' => Route::has('client.password.request'),
            'status' => session('status'),
            'adminOauthAttempt' => session('admin_oauth_attempt', false),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse|Response
    {
        try {
            $request->authenticate();
            $request->session()->regenerate();

            // Generate JWT token and store in session
            $user = Auth::guard('client')->user();
            if ($user) {
                $jwtService = app(\App\Services\JwtService::class)->forService('app');
                $tokenEnvelope = $jwtService->generateToken($user, [], [], [
                    'guard' => 'client',
                    'context' => 'app',
                ]);
                $request->session()->put('jwt_token', $tokenEnvelope['token']);
            }

            return redirect()->intended(route('client.dashboard', absolute: false));
        } catch (ValidationException $e) {
            Log::info('Authentication failed', [
                'message' => $e->getMessage(),
                'email' => $request->email,
                'errors' => $e->errors()
            ]);

            $request->session()->flush();
            $request->session()->regenerateToken();

            if ($request->wantsJson()) {
                return back()->withErrors($e->errors());
            }

            return Inertia::render('Client/Auth/Login', [
                'status' => session('status'),
                'errors' => $e->errors(),
                'adminOauthAttempt' => session('admin_oauth_attempt', false),
            ]);
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect(route('client.login'));
    }
}
