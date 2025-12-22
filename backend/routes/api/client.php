<?php

use App\Http\Controllers\Api\Client\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthenticatedSessionController::class, 'store'])
            ->name('api.v1.auth.login');
    });
});
