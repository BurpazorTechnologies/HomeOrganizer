<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;

class UtilityController extends Controller
{
    public function me(): View
    {
        $user = Auth::user();

        if ($user instanceof User) {
            return view('utility.me', [
                'user' => $user,
            ]);
        }

        return view('utility.me', [
            'user' => null,
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


