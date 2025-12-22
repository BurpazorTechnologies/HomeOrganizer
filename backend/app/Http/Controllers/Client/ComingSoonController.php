<?php

namespace App\Http\Controllers\Client;

use App\Models\Client\Badge;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class ComingSoonController extends Controller
{
    public function show(): Response
    {
        $user = Auth::user()->load(['userInformation', 'membershipLevel', 'membership', 'referrals']);
        $badge = Badge::find($user->membershipLevel->level);
        return Inertia::render('Client/ComingSoon', [
            'auth' => [
                'user' => $user,
            ],
            'badge' => $badge
        ]);
    }
}
