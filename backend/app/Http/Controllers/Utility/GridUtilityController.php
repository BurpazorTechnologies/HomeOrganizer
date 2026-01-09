<?php

namespace App\Http\Controllers\Utility;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Http\Controllers\Controller;

class GridUtilityController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('Utility/Grid/Index', []);
    }
}
