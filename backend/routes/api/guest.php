<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Api\Admin\PortfolioController as AdminPortfolioController;
use App\Http\Controllers\Api\Tracking\TrackingEventController;

Route::prefix('v1')->group(function () {
    Route::prefix('tracking')->group(function () {
        Route::post('event', TrackingEventController::class)
            ->name('api.v1.tracking.event.store');
    });

    Route::prefix('admin')->group(function () {
        Route::prefix('portfolio')->group(function () {
            Route::get('resume', [AdminPortfolioController::class, 'getResume'])
                ->name('api.v1.admin.portfolio.resume');
        });
        Route::prefix('contact')->group(function () {
            Route::post('email', [AdminContactController::class, 'sendMail'])
                ->name('api.v1.admin.contact.email');
        });
    });
});
