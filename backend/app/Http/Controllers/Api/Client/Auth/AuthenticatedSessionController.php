<?php

namespace App\Http\Controllers\Api\Client\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Client\Auth\LoginRequest;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request, JwtService $jwtService): JsonResponse
    {
        $request->authenticate();

        /** @var \Illuminate\Contracts\Auth\Authenticatable|null $user */
        $user = Auth::guard('client')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tokenEnvelope = $jwtService
            ->forService('app')
            ->generateToken($user, [], [], [
                'guard' => 'client',
                'context' => 'app',
            ]);

        return response()->json([
            'token' => $tokenEnvelope['token'],
            'expires_at' => $tokenEnvelope['expires_at'],
            'service' => $tokenEnvelope['service'],
            'type' => $tokenEnvelope['type'],
            'context' => $tokenEnvelope['context'],
            'guard' => $tokenEnvelope['guard'],
        ]);
    }

}
