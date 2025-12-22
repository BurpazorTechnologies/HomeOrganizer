<?php

use Illuminate\Support\Facades\Route;

$webPath = __DIR__ . '/web';

require $webPath . '/utility.php';

Route::get('/', function () {
    return view('app');
});

