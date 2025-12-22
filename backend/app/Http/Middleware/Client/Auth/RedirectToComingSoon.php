<?php

namespace App\Http\Middleware\Client\Auth;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectToComingSoon
{
    public function handle(Request $request, \Closure $next): Response
    {
        if (!app()->environment('local')) {
            return redirect(route('client.coming-soon'));
        }

        return $next($request);
    }
}
