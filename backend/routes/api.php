<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\UtilityController;

$apiPath = __DIR__ . '/api';

require $apiPath . '/v1/auth.php';
require $apiPath . '/v1/user.php';

Route::get('/health', [UtilityController::class, 'health']);

Route::middleware('debug.enabled')->group(function () {
    Route::get('/status', [UtilityController::class, 'status']);
});
