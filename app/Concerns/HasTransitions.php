<?php

namespace app\Concerns;

use BackedEnum;
use Eloquent;

/**
 * @mixin Eloquent
 */
trait HasTransitions // @phpstan-ignore-line
{
    public function canMakeMovement(BackedEnum $place): bool
    {
        return $this->workflow_can($place->value);
    }

    public function applyMovement(BackedEnum $place): void
    {
        $this->workflow_apply($place->value);
        $this->save();
    }
}
