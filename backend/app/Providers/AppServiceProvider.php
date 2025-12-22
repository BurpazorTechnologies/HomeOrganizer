<?php

namespace App\Providers;

use App\Models\Admin\User;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        LogViewer::auth(function ($request) {
            return $request->user()->isAdmin();
        });

        Gate::before(function ($user, string $ability) {
            if (method_exists($user, 'hasRole') && $user->hasRole('superadmin')) {
                return true;
            }

            return null;
        });

        Gate::define('viewPulse', function (User $user) {
            return $user->isAdmin();
        });
    }
}
