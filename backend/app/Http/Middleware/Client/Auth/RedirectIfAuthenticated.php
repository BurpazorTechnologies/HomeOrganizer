<?php

namespace App\Http\Middleware\Client\Auth;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                return $this->redirectToDashboard($guard);
            }
        }

        return $next($request);
    }

    protected function redirectToDashboard(string $guard): Response
    {
        switch ($guard) {
            case 'admin':
                return redirect()->route('admin.dashboard');
            case 'client':
                return redirect()->route('client.dashboard');
            default:
                return redirect('/');
        }
    }
}
