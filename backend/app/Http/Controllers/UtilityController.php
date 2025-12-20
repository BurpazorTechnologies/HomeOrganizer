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
            $user->loadMissing(['roles.permissions']);

            $roleNames = $user->roles->pluck('name')->sort()->values();
            $permissionNames = $user->roles
                ->flatMap(fn($r) => $r->permissions->pluck('name'))
                ->merge($user->getPermissionNames())
                ->unique()
                ->sort()
                ->values();

            $token = null;
            if (method_exists($user, 'createToken')) {
                $created = $user->createToken('debug');
                $token = $created->plainTextToken ?? null;
            }

            return view('utility.me', [
                'user' => $user,
                'roleNames' => $roleNames,
                'permissionNames' => $permissionNames,
                'token' => $token,
            ]);
        }

        return view('utility.me', [
            'user' => null,
            'roleNames' => collect(),
            'permissionNames' => collect(),
            'token' => null,
        ]);
    }
    
    public function showUsers(): View
    {
        $users = User::query()
            ->with(['roles.permissions'])
            ->orderBy('id')
            ->get();

        return view('utility.users', [
            'users' => $users,
        ]);
    }
}


