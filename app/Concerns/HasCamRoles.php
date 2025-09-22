<?php

namespace app\Concerns;

use app\Models\Role;
use Database\Seeders\Production\RoleSeeder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

trait HasCamRoles
{
    use HasRoles;

    /**
     * @return Attribute<?string, null>
     */
    public function roleName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->currentRole()?->name
        );
    }

    /**
     * @return Attribute<bool, null>
     */
    public function isSuperAdmin(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => $this->currentRole()?->name === RoleSeeder::sa()
        );
    }

    /**
     * @return ?Role
     */
    public function currentRole(): ?Model
    {
        return $this->roles()->first(); // @phpstan-ignore-line
    }
}
