<?php

return [
    'default_service' => env('JWT_DEFAULT_SERVICE', 'lab'),
    'leeway' => env('JWT_LEEWAY', 0),
    'blacklist' => [
        'enabled' => env('JWT_BLACKLIST_ENABLED', true),
        'store' => env('JWT_BLACKLIST_STORE'),
        'prefix' => env('JWT_BLACKLIST_PREFIX', 'jwt:blacklist:'),
    ],
    'storage' => [
        'persist_short_tokens' => env('JWT_PERSIST_SHORT_TOKENS', true),
        'persist_long_tokens' => env('JWT_PERSIST_LONG_TOKENS', true),
        'persist_blacklist' => env('JWT_PERSIST_BLACKLIST', true),
        'hash_algo' => env('JWT_TOKEN_HASH_ALGO', 'sha256'),
    ],
    'services' => [
        'lab' => [
            'secret_key' => env('JWT_LAB_SECRET', 'secret-key-for-jwt-lab'),
            'algorithm' => env('JWT_LAB_ALGORITHM', 'HS256'),
            'ttl' => env('JWT_LAB_TTL', 1),
            'refresh_ttl' => env('JWT_LAB_REFRESH_TTL', 1440),
            'type' => 'JWT',
            'include_user_payload' => true,
            'default_claims' => [
                'iss' => env('APP_URL'),
                'aud' => env('APP_URL'),
            ],
            'header' => [
                'typ' => 'JWT',
            ],
        ],
        'app' => [
            'secret_key' => env('JWT_APP_SECRET', env('APP_KEY')),
            'algorithm' => env('JWT_APP_ALGORITHM', 'HS512'),
            'ttl' => env('JWT_APP_TTL', 60),
            'refresh_ttl' => env('JWT_APP_REFRESH_TTL', 10080),
            'type' => 'JWT',
            'include_user_payload' => true,
            'default_claims' => [
                'iss' => env('APP_URL'),
                'aud' => env('APP_URL'),
            ],
        ],
        'microservice' => [
            'secret_key' => env('JWT_MS_SECRET', 'microservice-secret'),
            'algorithm' => env('JWT_MS_ALGORITHM', 'HS256'),
            'ttl' => env('JWT_MS_TTL', 5),
            'refresh_ttl' => env('JWT_MS_REFRESH_TTL', 60),
            'type' => 'JWT',
            'include_user_payload' => false,
            'default_claims' => [
                'iss' => env('APP_URL'),
            ],
        ],
    ],
];

