<?php

namespace App\Http\Middleware\Client\Auth;

use Closure;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Contracts\Auth\MustVerifyEmail;

class EnsureEmailIsVerified
{
    public static function redirectTo($route)
    {
        return static::class . ':' . $route;
    }

    public function handle($request, Closure $next, $redirectToRoute = null)
    {
        if (!$request->user() ||
            ($request->user() instanceof MustVerifyEmail &&
                !$request->user()->hasVerifiedEmail())) {
            return $request->expectsJson()
                ? abort(403, 'Your email address is not verified.')
                : Redirect::guest(URL::route($redirectToRoute ?: 'client.verification.notice'));
        }

        return $next($request);
    }
}
