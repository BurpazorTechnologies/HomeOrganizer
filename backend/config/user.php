<?php

return [
    'super_admin' => [
        'email' => env('SUPER_ADMIN_EMAIL', 'admin@homeorganizer.com'),
        'role' => 'superadmin',
    ],
    'defaults' => [
        'admin' => [
            'role' => 'admin',
            'password' => env('ADMIN_DEFAULT_PASSWORD', 'admin@1234'),
        ],
        'client' => [
            'role' => 'client',
            'password' => env('CLIENT_DEFAULT_PASSWORD', 'pass1234'),
        ],
    ],
];
