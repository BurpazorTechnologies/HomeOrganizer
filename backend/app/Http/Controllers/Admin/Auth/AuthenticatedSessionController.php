<?php

namespace App\Http\Controllers\Admin\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Auth\LoginRequest;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Admin/Auth/Login', [
            'status' => session('status'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        try {
            $request->authenticate();
            $request->session()->regenerate();

            // Generate JWT token and store in session
            $user = Auth::guard('admin')->user();
            if ($user) {
                $jwtService = app(\App\Services\JwtService::class)->forService('app');
                $tokenEnvelope = $jwtService->generateToken($user, [], [], [
                    'guard' => 'admin',
                    'context' => 'app',
                ]);
                $request->session()->put('jwt_token', $tokenEnvelope['token']);
            }

            return redirect()->intended(route('admin.dashboard', absolute: false));
        } catch (ValidationException $e) {
            Log::info('Authentication failed', [
                'message' => $e->getMessage(),
                'email' => $request->email
            ]);

            $request->session()->flush();

            return redirect()
                ->route('admin.login')
                ->withErrors($e->errors());
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect(route('admin.login'));
    }
}
