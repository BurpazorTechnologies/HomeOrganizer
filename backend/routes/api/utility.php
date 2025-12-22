<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Utility\UtilityRbacController;
use App\Http\Controllers\Api\Utility\UtilityJwtRbacController;

Route::prefix('utility')->middleware('debug.enabled')->group(function () {
    Route::prefix('rbac')->group(function () {
        // Session-based RBAC testing (for axios/session auth)
        Route::get('test-role', [UtilityRbacController::class, 'testRole'])->name('api.utility.rbac.test-role');
        Route::get('test-permission', [UtilityRbacController::class, 'testPermission'])->name('api.utility.rbac.test-permission');

        // JWT-based RBAC testing (requires JWT token in Authorization header)
        Route::prefix('jwt')->group(function () {
            Route::get('test-role', [UtilityJwtRbacController::class, 'testRole'])->name('api.utility.rbac.jwt.test-role');
            Route::get('test-permission', [UtilityJwtRbacController::class, 'testPermission'])->name('api.utility.rbac.jwt.test-permission');
            Route::post('verify-signature', [UtilityJwtRbacController::class, 'verifySignature'])->name('api.utility.rbac.jwt.verify-signature');
        });
    });
});