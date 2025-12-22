<?php

namespace App\Http\Controllers\Client\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Http\Controllers\Controller;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended(route('client.dashboard', absolute: false))
                    : Inertia::render('Client/Auth/VerifyEmail', ['status' => session('status')]);
    }
}
