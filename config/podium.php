<?php

declare(strict_types=1);

return [
    'models' => [
        'namespace' => 'App\\Models\\',
    ],

    'default_user_model' => env('PODIUM_DEFAULT_USER_MODEL', 'App\Models\User'),

    'migrations_connection' => env('PODIUM_MIGRATIONS_CONNECTION', 'non_persistent'),

    'user_stamp_columns' => [
        'created_by' => env('PODIUM_USER_STAMP_CREATED_BY_COLUMN', 'created_by'),
        'updated_by' => env('PODIUM_USER_STAMP_UPDATED_BY_COLUMN', 'updated_by'),
        'deleted_by' => env('PODIUM_USER_STAMP_DELETED_BY_COLUMN', 'deleted_by'),
    ],

    'icons' => [
        // Add your custom icons here
    ],
];
