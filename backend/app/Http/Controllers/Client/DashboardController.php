<?php

namespace App\Http\Controllers\Client;

use App\Models\Client\Badge;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Services\ActivityService;
use App\Http\Controllers\Controller;
use App\Services\MembershipService;

class DashboardController extends Controller
{
    public function show(): Response
    {
        $user = Auth::user()->load('userInformation');
        return Inertia::render('Client/Dashboard', [
            'auth' => [
                'user' => $user,
            ]
        ]);
    }
}
