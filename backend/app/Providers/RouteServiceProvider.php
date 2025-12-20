<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->mapUnversionedApiRoutes();
        $this->mapVersionedApiRoutes();
    }

    protected function mapUnversionedApiRoutes(): void
    {
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));
    }

    protected function mapVersionedApiRoutes(): void
    {
        $versionDirectories = glob(base_path('routes/api/*'), GLOB_ONLYDIR) ?: [];

        foreach ($versionDirectories as $dir) {
            $version = basename($dir);

            if (!preg_match('/^v\d+$/', $version)) {
                continue;
            }

            $routeFiles = glob($dir . '/*.php') ?: [];

            if (empty($routeFiles)) {
                continue;
            }

            Route::middleware('api')
                ->prefix("api/{$version}")
                ->group(function () use ($routeFiles) {
                    foreach ($routeFiles as $routeFile) {
                        require $routeFile;
                    }
                });
        }
    }
}


