<?php

namespace App\Http\Controllers\Client\Auth;

use App\Services\ClientRegistrationService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Client\Auth\RegisterRequest;

class RegisterController extends Controller
{
    public function __construct(private readonly ClientRegistrationService $clientRegistrationService)
    {

    }

    public function create(): Response
    {
        return Inertia::render('Client/Auth/Register');
    }

    public function store(RegisterRequest $request): RedirectResponse
    {
        $user = $this->clientRegistrationService->registerUser(
            $request->email,
            $request->password,
            $request->first_name,
            $request->last_name
        );

        Auth::shouldUse('client');
        Auth::login($user);
        $request->session()->regenerate();

        return redirect(
            route('client.verification.notice', absolute: false)
        )->with('status', 'verification-link-sent');
    }
}
