<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Utility\UtilityController;
use App\Http\Controllers\Utility\UtilityChatController;
use App\Http\Controllers\Utility\UtilityTrackingController;

Route::prefix('utility')->middleware('debug.enabled')->group(function () {

    Route::get('/', [UtilityController::class, 'index'])->name('utility.index');

    Route::get('/current-settings', [UtilityController::class, 'currentSettings'])->name('utility.current-settings');
    Route::get('/force-flush', [UtilityController::class, 'forceFlush'])->name('utility.force-flush');
    Route::get('/reverb', [UtilityController::class, 'reverb'])->name('utility.reverb');
    Route::prefix('email')->group(function () {
        Route::get('test', [UtilityController::class, 'emailTest'])->name('utility.email.test');
        Route::get('preview/admin/{emailView}', [UtilityController::class, 'emailPreviewAdmin'])->name('utility.email.preview.admin');
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

    Route::prefix('chat')->group(function () {
        Route::get('guest', [UtilityChatController::class, 'chatAsGuest'])->name('utility.chat.guest');
        Route::get('client', [UtilityChatController::class, 'chatAsClient'])->name('utility.chat.client');
        Route::get('admin', [UtilityChatController::class, 'chatAsAdmin'])->name('utility.chat.admin');
        Route::post('send', [UtilityChatController::class, 'sendMessage'])->name('utility.chat.send');
        Route::get('test-notification', [UtilityChatController::class, 'dispatchTestNotification'])->name('utility.chat.test.notification');
    });

    Route::prefix('tracking')->group(function () {
        Route::get('preview', [UtilityTrackingController::class, 'showPreview'])->name('utility.tracking.preview');
    });
});
