<?php

namespace App\Http\Controllers\Utility;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Events\TestEvent;
use App\Http\Controllers\Controller;

class UtilityController extends Controller
{
    public function index(): View
    {
        $sections = [
            [
                'title' => 'Core Utilities',
                'description' => '',
                'links' => [
                    [
                        'label' => 'Current Settings',
                        'description' => 'JSON snapshot of the app configuration, session, and system metadata.',
                        'method' => 'GET',
                        'url' => route('utility.current-settings'),
                    ],
                    [
                        'label' => 'Force Flush',
                        'description' => 'Runs optimize:clear and truncates the session table.',
                        'method' => 'GET',
                        'url' => route('utility.force-flush'),
                    ],
                    [
                        'label' => 'Reverb Broadcast',
                        'description' => 'Dispatches a demo event to verify broadcasting.',
                        'method' => 'GET',
                        'url' => route('utility.reverb'),
                    ],
                ],
            ],
        ];

        return view('utility.index', [
            'sections' => $sections,
        ]);
    }
    
    public function currentSettings(): JsonResponse
    {
        return response()->json([
            'app' => [
                'name' => config('app.name'),
                'env' => config('app.env'),
                'debug' => config('app.debug'),
                'url' => config('app.url'),
            ],
            'locale' => [
                'current' => app()->getLocale(),
            ],
            'time' => [
                'timezone' => config('app.timezone'),
                'server_time' => now()->toDateTimeString(),
                'unix_timestamp' => now()->timestamp,
            ],
            'session' => [
                'lifetime' => config('session.lifetime'),
                'driver' => config('session.driver'),
            ],
            'system' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
            ],
        ]);
    }

    public function forceFlush(): JsonResponse
    {
        return response()->json([
            'optimize:clear' => Artisan::call('optimize:clear') === 0 ? 'success' : 'error',
            'db:session:truncate' => DB::table(config('session.table', 'sessions'))->truncate() ?? 'success'
        ]);
    }

    public function reverb(): JsonResponse
    {
        $testMessage = 'Reverb is working!';

        broadcast(new TestEvent($testMessage));

        return response()->json([
            'message' => 'Event broadcasted!',
            'data' => [
                'test-message' => $testMessage
            ]
        ]);
    }
    
    public function showUsers(): View
    {
        $users = User::query()
            ->orderBy('id')
            ->get();

        return view('utility.users', [
            'users' => $users,
        ]);
    }
}


