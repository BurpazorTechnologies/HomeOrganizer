<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\BlogController;

$webPath = __DIR__ . '/web';

require $webPath . '/lab.php';
require $webPath . '/utility.php';
require $webPath . '/guest.php';
require $webPath . '/admin.php';
require $webPath . '/client.php';

Route::get('/', [LandingPageController::class, 'index'])->name('index');


Route::prefix('blog')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('blog.index');
    Route::get('/{path}', [BlogController::class, 'show'])
        ->where('path', '.*')
        ->name('blog.show');
});