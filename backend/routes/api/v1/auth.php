<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\AuthController;
use App\Generated\Roles;
use App\Generated\Permissions;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');

    // max 5 attempts per minute
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });
});

Route::middleware(['auth:sanctum'])->group(function () {
    
});
