<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BlogController;
use App\Http\Controllers\Client\Socialite\GoogleController;
use App\Http\Controllers\Client\Auth\RegisterController as ClientRegisterController;
use App\Http\Controllers\Guest\Auth\NewPasswordController as GuestNewPasswordController;
use App\Http\Controllers\Client\Auth\NewPasswordController as ClientNewPasswordController;
use App\Http\Controllers\Guest\Auth\PasswordResetLinkController as GuestPasswordResetLinkController;
use App\Http\Controllers\Client\Auth\PasswordResetLinkController as ClientPasswordResetLinkController;
use App\Http\Controllers\Admin\Auth\AuthenticatedSessionController as AdminAuthenticatedSessionController;
use App\Http\Controllers\Client\Auth\AuthenticatedSessionController as ClientAuthenticatedSessionController;

Route::group([], function () {
    Route::get('login', [ClientAuthenticatedSessionController::class, 'create'])
    ->name('client.login');

    Route::post('login', [ClientAuthenticatedSessionController::class, 'store'])
        ->name('client.login.store');

    Route::get('register', [ClientRegisterController::class, 'create'])
        ->name('client.register');

    Route::post('register', [ClientRegisterController::class, 'store'])
        ->name('client.register.store');

    Route::prefix('auth')->group(function () {
        Route::prefix('google')->group(function () {
            Route::get('redirect', [GoogleController::class, 'redirect'])->name('client.auth.google.redirect');
            Route::get('callback', [GoogleController::class, 'callback'])->name('client.auth.google.callback');
        });
    });
});

// Client Forgot Password
Route::get('forgot-password', [ClientPasswordResetLinkController::class, 'create'])
    ->name('client.password.request');

// Shared Forgot Password (using Laravel's default)
Route::post('forgot-password', [GuestPasswordResetLinkController::class, 'store'])
    ->name('password.email');

// Client Reset Password UI
Route::get('reset-password/{token}', [ClientNewPasswordController::class, 'create'])
    ->name('client.password.reset');

// Shared Reset Password Process (using Laravel's default)
Route::post('reset-password', [GuestNewPasswordController::class, 'store'])
    ->name('password.store');

Route::get('changed-password', [GuestNewPasswordController::class, 'changedPassword'])
    ->name('client.password.changed');

Route::get('blog', [BlogController::class, 'index'])
->name('guest.blog');

