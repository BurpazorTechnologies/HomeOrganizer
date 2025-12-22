<?php

use App\Http\Controllers\Api\Admin\PortfolioController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::prefix('portfolio')->group(function () {
            Route::post('resume/upload', [PortfolioController::class, 'uploadResume'])
                ->name('api.v1.admin.portfolio.resume.upload');
        });
    });
});
