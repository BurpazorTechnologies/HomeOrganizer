<?php

namespace App\Http\Controllers\Client\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\Controller;

class VerifyEmailController extends Controller
{
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('client.dashboard', absolute: false).'?verified=1');
        }

        $request->user()->markEmailAsVerified();

        return redirect()->intended(route('client.dashboard', absolute: false).'?verified=1');
    }
}
