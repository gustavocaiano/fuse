<?php

namespace app\Enums;

use app\Concerns\HasFromOr;

enum Action: string
{
    use HasFromOr;
    case viewAny = 'view-any';
    case view = 'view';
    case create = 'create';
    case update = 'update';
    case delete = 'delete';
    case restore = 'restore';
    case replicate = 'replicate';
    case forceDelete = 'force-delete';

    /**
     * @return self[]
     */
    public static function except(self ...$cases): array
    {
        return array_filter(
            self::cases(),
            fn ($case) => ! in_array($case, $cases, true)
        );
    }
}
