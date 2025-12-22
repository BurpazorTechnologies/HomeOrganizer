<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function show(): Response
    {
        $user = Auth::user()->load('userInformation');
        return Inertia::render('Admin/Dashboard', [
            'auth' => [
                'user' => $user,
            ]
        ]);
    }
}
