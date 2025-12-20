<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\UserProfileController;

Route::prefix('user')->middleware('auth:sanctum')->group(function () {
    Route::prefix('profile')->group(function () {
        Route::patch('/update', [UserProfileController::class, 'updateProfile']);
    });
});
