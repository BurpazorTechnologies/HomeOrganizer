<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\Auth\AuthenticatedSessionController as AdminAuthenticatedSessionController;

Route::prefix('admin')->middleware(['admin.auth', 'verified'])->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'show'])
        ->name('admin.dashboard');

    Route::post('logout', [AdminAuthenticatedSessionController::class, 'destroy'])
        ->name('admin.logout');
});
