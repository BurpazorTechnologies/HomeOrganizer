<?php

namespace App\Http\Controllers\Utility;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;


class UtilityTrackingController extends Controller
{
    public function showPreview(): InertiaResponse
    {
        return Inertia::render('Utility/Tracking/Preview', []);
    }
}
