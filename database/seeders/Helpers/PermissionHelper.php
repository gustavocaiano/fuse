<?php

namespace Database\Seeders\Helpers;

use Illuminate\Support\Str;

class PermissionHelper
{
    public static function qualifiedName(string $ability, string $modelClass): string
    {
        return Str::of($modelClass)
            ->classBasename()
            ->prepend($ability)
            ->kebab()
            ->toString();
    }
}
