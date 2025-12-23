<?php

namespace App\Http\Controllers\Utility;

use Illuminate\View\View;
use Illuminate\Support\Str;
use Illuminate\Mail\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Artisan;
use Spatie\ShikiPhp\Shiki;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Events\Utility\Reverb\TestEvent;
use App\Http\Controllers\Controller;

class UtilityController extends Controller
{
    public function index(): View
    {
        $sections = [
            [
                'title' => 'Core Utilities',
                'description' => 'Endpoints for inspecting the app state and clearing caches.',
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
                    [
                        'label' => 'Websockets',
                        'description' => 'Test WebSocket connections and realtime events.',
                        'method' => 'GET',
                        'url' => route('utility.websockets.index'),
                    ],
                ],
            ],
            [
                'title' => 'Email Utilities',
                'description' => 'Preview or trigger utility emails.',
                'links' => [
                    [
                        'label' => 'Send Test Email',
                        'description' => 'Dispatches mails.utility.email to the configured test inbox.',
                        'method' => 'GET',
                        'url' => route('utility.email.test'),
                    ],
                ],
            ],
            [
                'title' => 'UI Sandbox',
                'description' => 'Visual regression helpers and theme previews.',
                'links' => [
                    [
                        'label' => 'UI Preview',
                        'description' => 'Inertia playground for shared UI components.',
                        'method' => 'GET',
                        'url' => route('utility.ui.preview'),
                    ],
                    [
                        'label' => 'Typography Theme Component',
                        'description' => 'Renders the typography component theme demo.',
                        'method' => 'GET',
                        'url' => route('utility.ui.theme', ['component' => 'typography']),
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
        $title = 'Test Notification';

        broadcast(new TestEvent($testMessage, $title));

        return response()->json([
            'message' => 'Event queued for broadcast!',
            'data' => [
                'title' => $title,
                'message' => $testMessage,
            ],
        ]);
    }

    public function emailTest(): JsonResponse
    {
        $recipientEmail = config('mail.test.to.address', 'admin@homeorganizer.com');
        $recipientName = 'Recipient Name';

        try {
            Mail::send('mails.utility.email', [], function (Message $message) use ($recipientEmail, $recipientName) {
                $message->to($recipientEmail, $recipientName)
                    ->subject('My New Test');
                $message->from(config('mail.from.address'), 'Your Name');
            });

            return response()->json([
                'message' => 'Email sent successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error sending email.',
                'error' => $e->getMessage(),
            ], 403);
        }
    }

    public function showPreview(): InertiaResponse
    {
        return Inertia::render('Utility/Preview', []);
    }

    public function showWebsocketsIndex(): InertiaResponse
    {
        return Inertia::render('Utility/Websockets/Index');
    }

    public function showThemeComponent(string $component): InertiaResponse
    {
        $component = Str::ucfirst($component);
        return Inertia::render("Utility/Theme/{$component}", []);
    }

    public function getApiToken(): JsonResponse
    {
        Auth::shouldUse('admin');

        /** @var \App\Models\Admin\User|null $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'requires an authenticated admin user. please login first.',
                'success' => 'false'
            ], 400);
        }

        $token = $user->createToken('Admin API Token')->plainTextToken;

        return response()->json([
            'api-token' => $token,
            'user' => $user,
            'success' => 'true'
        ]);
    }

    public function emailPreviewAdmin(string $emailView)
    {
        $data = [
            'sample' => 'value'
        ];

        switch ($emailView) {
            case 'forward-mail':
                $data = [
                    'mail' => (object)[
                        'sender_name' => 'John Doe',
                        'sender_email' => 'john@example.com',
                        'subject' => 'Test Contact Form Submission',
                        'message' => 'This is a sample message from the contact form. It can contain multiple lines of text to demonstrate how the email template handles message formatting.',
                        'additional_details' => [
                            'phone' => '+1234567890',
                            'company' => 'Example Corp',
                            'preferred_contact' => 'email'
                        ]
                    ]
                ];
                $view = 'mails.admin.contact.forward-mail';
                break;
            case 'automated-reply':
                $data = [];
                $view = 'mails.admin.contact.automated-reply';
                break;
            default:
                $view = 'mails.utility.email';
                break;
        }

        if (request()->query('sendEmail') == 1 || request()->query('sendEmail') == 'true') {
            $recipientEmail = config('mail.test.to.address', 'admin@homeorganizer.com');
            $recipientName = 'Recipient Name';

            try {
                Mail::send($view, $data, function (Message $message) use ($recipientEmail, $recipientName) {
                    $message->to($recipientEmail, $recipientName)
                        ->subject('Your Custom Email Subject');
                    $message->from(config('mail.from.address'), 'Your Name');
                });

                return view($view, $data);
            } catch (\Exception $e) {
                return response()->json(['status' => 'Failed to send email', 'error' => $e->getMessage()], 500);
            }
        }

        return view($view, $data);
    }

    public function getRolesPermissions(): InertiaResponse
    {
        // Check if user is authenticated as either admin or client
        $adminUser = Auth::guard('admin')->user();
        $clientUser = Auth::guard('client')->user();

        if (!$adminUser && !$clientUser) {
            return Inertia::render('Error', [
                'status' => 401,
                'message' => 'requires an authenticated user (admin or client)',
            ]);
        }

        // Set the active guard based on which user is authenticated
        if ($adminUser) {
            Auth::shouldUse('admin');
        } else {
            Auth::shouldUse('client');
        }

        /** @var \App\Models\Admin\User|\App\Models\Client\User|null $user */
        $user = Auth::user();

        $roles = Role::query()
            ->select(['id', 'name', 'guard_name', 'created_at', 'updated_at'])
            ->orderBy('guard_name')
            ->orderBy('name')
            ->get();

        $permissions = Permission::query()
            ->select(['id', 'name', 'guard_name', 'created_at', 'updated_at'])
            ->orderBy('guard_name')
            ->orderBy('name')
            ->get();

        $guards = array_keys(config('auth.guards', []));
        $activeGuard = null;
        $activeUser = null;

        foreach ($guards as $guard) {
            $guardUser = Auth::guard($guard)->user();
            if ($guardUser) {
                $activeGuard = $guard;
                if ($guardUser instanceof Model) {
                    $guardUser->loadMissing('roles');
                }
                $activeUser = $guardUser;
                break;
            }
        }

        $currentUser = null;

        if ($activeUser instanceof Model && method_exists($activeUser, 'getRoleNames')) {
            $userPermissions = method_exists($activeUser, 'getAllPermissions')
                ? $activeUser->getAllPermissions()
                : collect();

            $currentUser = [
                'id' => $activeUser->getKey(),
                'email' => $activeUser->email,
                'guard' => $activeGuard,
                'roles' => $activeUser->roles->map(static function (Role $role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'guard_name' => $role->guard_name,
                    ];
                })->values(),
                'permissions' => $userPermissions->map(static function (Permission $permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'guard_name' => $permission->guard_name,
                    ];
                })->values(),
            ];
        }

        return Inertia::render('Utility/RBAC/axios/RolesAndPermissions', [
            'roles' => $roles,
            'permissions' => $permissions,
            'generatedAt' => now()->toDateTimeString(),
            'currentUser' => $currentUser,
        ]);
    }

    public function getJwtRolesPermissions(): InertiaResponse
    {
        // Check if user is authenticated as either admin or client
        $adminUser = Auth::guard('admin')->user();
        $clientUser = Auth::guard('client')->user();

        if (!$adminUser && !$clientUser) {
            return Inertia::render('Error', [
                'status' => 401,
                'message' => 'requires an authenticated user (admin or client)',
            ]);
        }

        // Set the active guard based on which user is authenticated
        if ($adminUser) {
            Auth::shouldUse('admin');
        } else {
            Auth::shouldUse('client');
        }

        /** @var \App\Models\Admin\User|\App\Models\Client\User|null $user */
        $user = Auth::user();

        // Get current user info with roles
        $currentUser = null;
        if ($user instanceof Model && method_exists($user, 'getRoleNames')) {
            $user->loadMissing('roles');
            $currentUser = [
                'id' => $user->getKey(),
                'email' => $user->email,
                'guard' => $adminUser ? 'admin' : 'client',
                'roles' => $user->roles->map(static function (Role $role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'guard_name' => $role->guard_name,
                    ];
                })->values(),
            ];
        }

        // Generate JWT token for authenticated user
        $jwtService = app(\App\Services\JwtService::class)->forService('app');
        $jwtToken = null;
        if ($user) {
            $tokenEnvelope = $jwtService->generateToken($user, [], [], [
                'guard' => $adminUser ? 'admin' : 'client',
                'context' => 'rbac-test',
            ]);
            $jwtToken = $tokenEnvelope['token'];
        }

        // Get JWT config
        $jwtConfig = config('jwt.services.app', []);
        $jwtSecret = $jwtConfig['secret_key'] ?? 'not configured';
        $jwtAlgorithm = $jwtConfig['algorithm'] ?? 'HS256';

        return Inertia::render('Utility/RBAC/jwt/RolesAndPermissions', [
            'currentUser' => $currentUser,
            'jwtToken' => $jwtToken,
            'jwtConfig' => [
                'secret_key' => $jwtSecret,
                'algorithm' => $jwtAlgorithm,
            ],
        ]);
    }
}
