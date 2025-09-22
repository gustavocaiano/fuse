<?php

namespace App\Http\Traits;

use app\Actions\CamNotification;
use app\Models\User;

trait NotifierTrait
{
    protected static function successNotification(string $notify, ?User $user = null): void
    {
        CamNotification::make(
            id: 'success-notification',
            title: __('Success'),
            body: $notify,
            onScreen: true,
            user: $user
        );
    }

    protected static function errorNotification(string $notify, ?string $id = null, ?string $title = null, ?User $user = null, bool $onScreen = false): void
    {
        CamNotification::make(
            id: $id ?? 'error-response',
            title: $title ?? __('Error'),
            body: $notify,
            onScreen: $onScreen,
            danger: true,
            user: $user
        );

    }
}
