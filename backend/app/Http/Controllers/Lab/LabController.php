<?php

namespace App\Http\Controllers\Lab;

use Illuminate\View\View;
use App\Http\Controllers\Controller;


class LabController extends Controller
{
    public function index(): View
    {
        $sections = [

            [
                'title' => 'JWT Flow Demo',
                'description' => 'Interactive demonstration of JWT token generation and authentication flow.',
                'links' => [
                    [
                        'label' => 'JWT Demo',
                        'description' => 'Page demo of JWT flow for client authentication.',
                        'method' => 'GET',
                        'url' => route('lab.jwt.index'),
                    ],
                ],
            ],
        ];

        return view('lab.index', [
            'sections' => $sections,
        ]);
    }
}
