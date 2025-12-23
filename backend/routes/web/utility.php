<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Utility\UtilityController;

Route::prefix('utility')->middleware('debug.enabled')->group(function () {

    Route::get('/', [UtilityController::class, 'index'])->name('utility.index');

    Route::get('/current-settings', [UtilityController::class, 'currentSettings'])->name('utility.current-settings');
    Route::get('/force-flush', [UtilityController::class, 'forceFlush'])->name('utility.force-flush');
    Route::get('/reverb', [UtilityController::class, 'reverb'])->name('utility.reverb');

    Route::prefix('websockets')->group(function () {
        Route::get('/', [UtilityController::class, 'showWebsocketsIndex'])->name('utility.websockets.index');
    });

    Route::prefix('email')->group(function () {
        Route::get('test', [UtilityController::class, 'emailTest'])->name('utility.email.test');
    });

    Route::prefix('ui')->group(function () {
        Route::get('/check-code-highlighter', [UtilityController::class, 'checkCodeHighlighter'])->name('utility.ui.checkCodeHighlighter');
        Route::get('/preview', [UtilityController::class, 'showPreview'])->name('utility.ui.preview');
        Route::get('/theme/{component}', [UtilityController::class, 'showThemeComponent'])->name('utility.ui.theme');
    });

    Route::prefix('admin')->group(function () {
        Route::get('/api-token', [UtilityController::class, 'getApiToken'])->name('utility.admin.api-token');
        
        Route::prefix('rbac')->group(function () {
            Route::get('/jwt/roles-permissions', [UtilityController::class, 'getJwtRolesPermissions'])->name('utility.admin.rbac.jwt.roles-permissions');
            Route::get('/roles-permissions', [UtilityController::class, 'getRolesPermissions'])->name('utility.admin.rbac.roles-permissions');
        });
    });
});
