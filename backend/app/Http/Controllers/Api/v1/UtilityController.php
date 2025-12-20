<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class UtilityController extends Controller
{
    public function health()
    {
        return response()->json([
            'ok' => true,
            'status' => 'healthy',
        ]);
    }

    public function status()
    {
        $appName = config('app.name');
        $appEnv = config('app.env');
        $appDebug = (bool) config('app.debug');
        $appUrl = config('app.url');
        $locale = config('app.locale');
        $fallbackLocale = config('app.fallback_locale');
        $timezone = config('app.timezone');

        $dbDefault = config('database.default');
        $dbConnections = collect(config('database.connections', []))
            ->map(function ($conn, $name) {
                return [
                    'name' => $name,
                    'driver' => $conn['driver'] ?? null,
                    'host' => $conn['host'] ?? null,
                    'port' => $conn['port'] ?? null,
                    'database' => $conn['database'] ?? null,
                    'username' => isset($conn['username']) && $conn['username'] !== '' ? '[redacted]' : null,
                    'password' => isset($conn['password']) && $conn['password'] !== '' ? '[redacted]' : null,
                    'options' => isset($conn['options']) ? '[redacted]' : null,
                ];
            })
            ->values();

        $cacheDefault = config('cache.default');
        $cacheStores = collect(config('cache.stores', []))
            ->map(function ($store, $name) {
                return [
                    'name' => $name,
                    'driver' => $store['driver'] ?? null,
                ];
            })
            ->values();

        $queueDefault = config('queue.default');
        $queueConnections = collect(config('queue.connections', []))
            ->map(function ($conn, $name) {
                return [
                    'name' => $name,
                    'driver' => $conn['driver'] ?? null,
                ];
            })
            ->values();

        $sessionDriver = config('session.driver');
        $sessionLifetime = config('session.lifetime');

        $mailDefault = config('mail.default');
        $mailers = collect(config('mail.mailers', []))
            ->map(function ($mailer, $name) {
                return [
                    'name' => $name,
                    'transport' => $mailer['transport'] ?? null,
                ];
            })
            ->values();

        $fsDefault = config('filesystems.default');
        $disks = collect(config('filesystems.disks', []))
            ->map(function ($disk, $name) {
                return [
                    'name' => $name,
                    'driver' => $disk['driver'] ?? null,
                    'visibility' => $disk['visibility'] ?? null,
                ];
            })
            ->values();

        return response()->json([
            'versions' => [
                'laravel' => App::version(),
                'php' => PHP_VERSION,
            ],
            'app' => [
                'name' => $appName,
                'env' => $appEnv,
                'debug' => $appDebug,
                'url' => $appUrl,
                'locale' => $locale,
                'fallback_locale' => $fallbackLocale,
                'timezone' => $timezone,
            ],
            'database' => [
                'default' => $dbDefault,
                'connections' => $dbConnections,
            ],
            'cache' => [
                'default' => $cacheDefault,
                'stores' => $cacheStores,
            ],
            'queue' => [
                'default' => $queueDefault,
                'connections' => $queueConnections,
            ],
            'session' => [
                'driver' => $sessionDriver,
                'lifetime_minutes' => $sessionLifetime,
            ],
            'mail' => [
                'default' => $mailDefault,
                'mailers' => $mailers,
            ],
            'filesystems' => [
                'default' => $fsDefault,
                'disks' => $disks,
            ],
        ]);
    }
}
