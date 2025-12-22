<?php

return [
    'defaults' => [
        'social' => [
            'og:title' => 'HomeOrganizer',
            'og:description' => 'HomeOrganizer Personal App',
            'og:image' => '/assets/img/_shared/homeorganizer-tech-logo.png',
            'og:url' => env('APP_URL', 'https://homeorganizer.xyz'),
            'og:site_name' => 'HomeOrganizer',
            'og:locale' => 'en',
            'og:type' => 'website',
            'twitter:title' => 'HomeOrganizer - Personal App',
            'twitter:description' => 'HomeOrganizer Personal App',
            'twitter:image' => '/assets/img/_shared/homeorganizer-tech-logo.png',
        ]
    ],
    'local' => [
        'social' => [
            'og:title' => 'HomeOrganizer Local Environment',
            'og:site_name' => 'HomeOrganizer Local',
        ],
    ],
    'develop' => [
        'social' => [
            'og:title' => 'HomeOrganizer Dev Server',
            'og:site_name' => 'HomeOrganizer Dev',
        ],
    ],
    'production' => [
        'social' => [

        ]
    ]
];
