<?php

namespace app\Concerns;

use Symfony\Component\HttpFoundation\Exception\UnexpectedValueException;
use Traits\NotifierTrait;
use ValueError;

trait HasFromOr
{
    use NotifierTrait;

    public static function fromOrNull(null|int|string $value): ?static
    {
        if ($value === null) {
            return null;
        }
        try {
            return static::from($value);
        } catch (ValueError) {
            return null;
        }
    }

    public static function fromOrDefault(null|int|string $value, ?string $information = null): static
    {
        if ($value === null) {
            return self::default($value, $information);
        }
        try {
            return static::from($value);
        } catch (ValueError) {
            return self::default($value, $information);
        }
    }

    private static function default(null|int|string $value, ?string $information): static
    {
        self::errorNotification(
            notify: __('CASE ":value" is not implemented yet (:information)', ['value' => $value ?? '', 'information' => $information ?? '']),
            id: 'case-not-supported',
            title: __('Value not implemented'),
        );

        /** @var string $dev */
        $dev = config('app.developer.name');

        if (method_exists(static::class, 'getDefault')) {
            return static::getDefault();
        }

        return throw new UnexpectedValueException("CASE \"$value\" is not implemented yet, please contact $dev -> $information");
    }
}
