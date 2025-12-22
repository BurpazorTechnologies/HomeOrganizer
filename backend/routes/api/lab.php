<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Lab\Jwt\LabJwtController;

Route::prefix('lab')->group(function () {
    Route::prefix('jwt')->group(function () {
        Route::post('/generate', [LabJwtController::class, 'generateToken'])->middleware('client.auth')->name('lab.jwt.generate');
    });

});