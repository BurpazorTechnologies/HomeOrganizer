<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UtilityController;

Route::middleware('debug.enabled')->prefix('utility')->group(function () {
    Route::get('/users', [UtilityController::class, 'showUsers']);
    Route::get('/me', [UtilityController::class, 'me']);
});

