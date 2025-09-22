<?php

declare(strict_types=1);

namespace Database\Seeders\Production;

use app\Enums\Action;
use app\Models\Permission;
use app\Models\Role;
use app\Models\User;
use Arr;
use Database\Seeders\Helpers\PermissionHelper;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models = [
            Role::class => [Action::update, Action::view, Action::viewAny],
            User::class => Action::cases(),
            Permission::class => [Action::view, Action::viewAny],
        ];

        Permission::unguard();

        $bulkList = $this->getCustomPermissions();
        foreach ($models as $model => $actions) {
            foreach ($actions as $action) {
                $bulkList[] = [
                    'name' => PermissionHelper::qualifiedName($action->value, $model),
                    'guard_name' => 'web',
                    'group' => Str::of($model)->classBasename()->toString(),
                ];
            }
        }

        foreach ($bulkList as $permissions) {
            /** @var array<string, string> $permissions */
            Permission::updateOrCreate(['name' => Arr::get($permissions, 'name')], $permissions);
        }

        Permission::reguard();
    }

    /**
     * if you need to create a custom permission, you can add it here.
     * Example: $bulkList = [
     *   [
     *      'name' => 'custom-permission',
     *      'guard_name' => 'web',
     *      'group' => 'group_name',
     *   ],
     * ]
     *
     * @return array<int, array<string, string>>
     */
    private function getCustomPermissions(): array
    {
        return [
        ];
    }
}
