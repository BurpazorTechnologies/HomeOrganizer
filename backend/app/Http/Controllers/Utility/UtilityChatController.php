<?php

namespace App\Http\Controllers\Utility;

use Inertia\Inertia;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Services\JwtService;
use Inertia\Response as InertiaResponse;
use App\Events\Chat\ChatMessageSent;
use App\Events\Chat\ChatTestNotification;
class UtilityChatController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }
    public function chatAsGuest(): InertiaResponse
    {
        return Inertia::render('Utility/Chat/Guest', [
            'role' => 'guest',
        ]);
    }

    public function chatAsClient(): InertiaResponse
    {
        Auth::shouldUse('client');

        /** @var \App\Models\Client\User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(404, 'requires an authenticated client user. please login first');
        }

        // Generate JWT Token for chat feature with client-chat context
        $jwtToken = $this->jwtService
            ->forService('app')
            ->generateToken($user, [], [], [
                'context' => 'client-chat',
                'guard' => 'client',
            ]);
        
        return Inertia::render('Utility/Chat/Client', [
            'role' => 'client',
            'jwt' => [
                'token' => $jwtToken['token'],
                'expires_at' => $jwtToken['expires_at'],
            ],
        ]);
    }

    public function chatAsAdmin(): InertiaResponse
    {
        Auth::shouldUse('admin');

        /** @var \App\Models\Admin\User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(404, 'requires an authenticated admin user. please login first');
        }

        // Generate JWT Token for chat feature with admin-chat context
        $jwtToken = $this->jwtService
            ->forService('app')
            ->generateToken($user, [], [], [
                'context' => 'admin-chat',
                'guard' => 'admin',
            ]);

        return Inertia::render('Utility/Chat/Admin', [
            'role' => 'admin',
            'jwt' => [
                'token' => $jwtToken['token'],
                'expires_at' => $jwtToken['expires_at'],
            ],
        ]);
    }

    public function sendMessage(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|in:guest,admin,client',
            'message' => 'required|string|max:2000',
        ]);

        event(new ChatMessageSent(
            from: $data['from'],
            message: $data['message'],
            sent_at: now()->toIso8601String(),
        ));

        return response()->noContent();
    }

    public function dispatchTestNotification()
    {
        $testData = [
            'id' => uniqid('test_'),
            'title' => 'Test Chat Notification.',
            'message' => 'This is a test notification from the utility controller',
            'type' => 'test',
            'dispatched_at' => now()->toIso8601String(),
            'timestamp' => time(),
        ];

        event(new ChatTestNotification($testData));

        return response()->json([
            'message' => 'Chat Test Notification dispatched successfully',
            'data' => $testData,
        ]);
    }
}
