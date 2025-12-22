<?php

namespace App\Http\Controllers\Client\Auth;

use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Client/Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }
}
