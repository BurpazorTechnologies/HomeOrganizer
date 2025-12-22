<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VersionController;

$apiPath = __DIR__ . '/api';

require $apiPath . '/lab.php';
require $apiPath . '/utility.php';
require $apiPath . '/guest.php';
require $apiPath . '/client.php';

Route::get('up', function() {
    return response()->json(['message' => 'health check: success!']);
});

Route::get('version', [VersionController::class, 'getVersion']);

