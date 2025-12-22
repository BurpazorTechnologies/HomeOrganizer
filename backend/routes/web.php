<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LandingPageController;

$webPath = __DIR__ . '/web';

require $webPath . '/lab.php';
require $webPath . '/utility.php';
require $webPath . '/guest.php';
require $webPath . '/client.php';

Route::get('/', [LandingPageController::class, 'index'])->name('index');
