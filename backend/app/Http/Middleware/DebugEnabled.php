<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class DebugEnabled
{
    /**
     * Handle an incoming request.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     */
    public function handle(Request $request, Closure $next)
    {
        if (config('app.debug')) {
            return $next($request);
        }

        return redirect(route('error', 403));
    }
}
