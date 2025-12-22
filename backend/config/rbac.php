<?php

return [
    'guards' => [
        'admin' => [
            'permissions' => [
                // Admin dashboard
                'admin.dashboard.access',

                // Admin chat
                'admin.chat.view',
                'admin.chat.respond',
                'admin.chat.audit',
                'admin.chat.manage',

                // Tracking / analytics
                'admin.tracking.dashboard.view',
                'admin.tracking.report.export',
                'admin.tracking.configure',

                // Portfolio management
                'admin.portfolio.manage',

                // Resume workflow
                'admin.resume.review',
                'admin.resume.approve',

                // Existing platform permissions
                'admin.users.manage',
                'admin.utility.access',
            ],
            'roles' => [
                'superadmin' => [
                    'label' => 'Super Administrator',
                    'description' => 'Unrestricted access that bypasses RBAC enforcement.',
                    'permissions' => '*',
                ],
                'admin' => [
                    'label' => 'Administrator',
                    'description' => 'Full access to manage the platform.',
                    'permissions' => '*',
                ],
            ],
        ],
        'client' => [
            'permissions' => [
                // Client dashboard
                'client.dashboard.access',

                // Profile management
                'client.profile.view',
                'client.profile.update',

                // Chat
                'client.chat.view-history',
                'client.chat.send',
                'client.chat.attachments',

                // Portfolio
                'client.portfolio.download',

            ],
            'roles' => [
                'client' => [
                    'label' => 'Client',
                    'description' => 'Default role for onboarded clients.',
                    'permissions' => [
                        'client.dashboard.access',
                        'client.profile.view',
                        'client.profile.update',
                        'client.chat.view-history',
                        'client.chat.send',
                        'client.chat.attachments',
                        'client.portfolio.download',
                    ],
                ],
            ],
        ],
    ],
];

