<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    /**
     * Update profile (username/display_name)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'username' => ['sometimes', 'required', 'string', 'alpha_dash', 'max:32', \Illuminate\Validation\Rule::unique('users', 'username')->ignore($user->id)],
            'display_name' => ['sometimes', 'string', 'max:255'],
        ]);

        if (array_key_exists('username', $validated)) {
            $validated['username'] = strtolower(trim($validated['username']));
        }

        $user->fill($validated);
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user),
        ]);
    }
}
