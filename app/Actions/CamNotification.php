<?php

namespace app\Actions;

use app\Models\User;
use Filament\Notifications\Notification;

class CamNotification
{
    public static function make(string $id, string $title, ?string $body = null, bool $onScreen = false, bool $persistent = false, bool $danger = false, ?User $user = null): void
    {
        $notification = Notification::make($id)
            ->title($title)
            ->body($body);
        $danger ? $notification->danger() : $notification->success();
        $danger ? $notification->color('danger') : $notification->color('success');
        if ($onScreen) {
            $notification->send();
            if ($persistent) {
                $notification->persistent();
            }
        } else {
            /** @var string $devId */
            $devId = config('app.developer.id');
            /** @var User $dev */
            $dev = $user ?? User::firstWhere('id', $devId);
            $notification
                ->sendToDatabase($dev);
        }
    }
}
