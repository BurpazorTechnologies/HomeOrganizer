<?php

namespace App\Http\Controllers\Lab\Jwt;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Http\Controllers\Controller;
use App\Services\JwtService;

class LabJwtController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function index(): InertiaResponse
    {
        /** @var \Illuminate\Database\Eloquent\Model&\Illuminate\Contracts\Auth\Authenticatable $user */
        $user = Auth::user();
        $user->load('userInformation');
        
        return Inertia::render('Lab/Jwt/Index', [
            'auth' => [
                'user' => $user,
            ]
        ]);
    }

    public function generateToken(): JsonResponse
    {
        /** @var \Illuminate\Database\Eloquent\Model&\Illuminate\Contracts\Auth\Authenticatable $user */
        $user = Auth::user();
        $user->load('userInformation');
        $tokenEnvelope = $this->jwtService
            ->forService('lab')
            ->generateToken($user);

        return response()->json([
            'token' => $tokenEnvelope['token'],
            'expires_at' => $tokenEnvelope['expires_at'],
            'service' => $tokenEnvelope['service'],
            'header' => $tokenEnvelope['header'],
            'payload' => $tokenEnvelope['payload'],
        ]);
    }
}
