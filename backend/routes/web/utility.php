<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Utility\UtilityController;

Route::prefix('utility')->middleware('debug.enabled')->group(function () {

    Route::get('/', [UtilityController::class, 'index'])->name('utility.index');

    Route::get('/current-settings', [UtilityController::class, 'currentSettings'])->name('utility.current-settings');
    Route::get('/force-flush', [UtilityController::class, 'forceFlush'])->name('utility.force-flush');
    Route::get('/reverb', [UtilityController::class, 'reverb'])->name('utility.reverb');
    
    Route::get('/users', [UtilityController::class, 'showUsers']);
    Route::get('/me', [UtilityController::class, 'me']);
});

