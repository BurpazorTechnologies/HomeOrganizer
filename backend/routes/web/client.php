<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Client\ProjectController;
use App\Http\Controllers\Client\DashboardController;
use App\Http\Controllers\Client\Auth\VerifyEmailController;
use App\Http\Controllers\Client\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Client\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Client\Auth\AuthenticatedSessionController as ClientAuthenticatedSessionController;

Route::middleware(['client.auth'])->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('client.verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['throttle:6,1'])
        ->name('client.verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('client.verification.send');

    Route::post('logout', [ClientAuthenticatedSessionController::class, 'destroy'])
        ->name('client.logout');

    Route::middleware(['client.verified'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'show'])
            ->name('client.dashboard');
    });

    Route::prefix('project')->group(function () {
        Route::post('', [ProjectController::class, 'store'])
            ->name('client.project.store');
        Route::get('{project_uuid}', [ProjectController::class, 'show'])
            ->name('client.project.show');
    });
});

