<?php

declare(strict_types=1);

namespace Database\Seeders\Production;

use app\Enums\Action;
use app\Models\Permission;
use App\Models\Process;
use app\Models\Role;
use app\Models\User;
use Database\Seeders\Helpers\PermissionHelper;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $definitions = $this->getRoleDefinitions();

        foreach ($definitions as $roleName => $definition) {
            /**
             * Only two supported forms:
             * - 'role' => 'all'
             * - 'role' => ['models' => [...], 'custom' => [...]]
             *
             * @var array{
             *     models?: array<Model::class, Action[]>,
             *     custom?: string[]
             *         }|string $definition
             */
            $role = Role::findOrCreate($roleName, 'web');

            if ($definition === 'all') {
                $role->syncPermissions(Permission::all());

                continue;
            }

            /** @var array{
             *     models?: array<Model::class, Action[]>,
             *     custom?: string[]
             *         } $definition
             */
            $permissionNames = [];
            /** @var array<Model::class , Action[]> $definitionModels */
            $definitionModels = Arr::get($definition, 'models', []);
            foreach ($definitionModels as $modelClass => $actions) {
                foreach ($actions as $action) {
                    $permissionNames[] = PermissionHelper::qualifiedName($action->value, $modelClass);
                }
            }

            /** @var string[] $definitionNames */
            $definitionNames = Arr::get($definition, 'custom', []);
            foreach ($definitionNames as $permissionName) {
                $permissionNames[] = $permissionName;
            }

            if ($permissionNames === []) {
                $role->syncPermissions([]);

                continue;
            }

            $permissions = Permission::query()
                ->whereIn('name', $permissionNames)
                ->get();

            $role->syncPermissions($permissions);
        }
    }

    /**
     * Define roles as either:
     * - 'role-name' => 'all' (grant every permission)
     * - 'role-name' => ['models' => [Model::class => [Action::...]], 'custom' => ['...']]
     *
     * @return array<string, array{models?: array<class-string, array<int, Action>>, custom?: array<int, string>}|string>
     */
    private function getRoleDefinitions(): array
    {
        return [
            // Full access
            self::sa() => 'all',
            self::operator() => [
                'models' => [
                    User::class => [Action::viewAny, Action::view],
                    Process::class => [Action::viewAny, Action::view],
                ],
            ],
        ];
    }

    public static function sa(): string
    {
        return __('System Admin');
    }

    public static function delegate(): string
    {
        return __('Delegate');
    }

    public static function operator(): string
    {
        return __('Operator');
    }
}
