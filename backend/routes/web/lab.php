<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Lab\LabController;
use App\Http\Controllers\Lab\Jwt\LabJwtController;

Route::prefix('lab')->group(function () {
    Route::get('/', [LabController::class, 'index'])->name('lab.index');

    Route::prefix('jwt')->group(function () {
        Route::get('/', [LabJwtController::class, 'index'])->middleware('client.auth')->name('lab.jwt.index');
    });
});