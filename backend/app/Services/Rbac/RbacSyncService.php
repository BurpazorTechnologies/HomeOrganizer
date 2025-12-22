<?php

namespace App\Services\Rbac;

use App\Models\Role;
use InvalidArgumentException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RbacSyncService
{
    public function __construct(private readonly PermissionRegistrar $permissionRegistrar)
    {
    }

    /**
     * Synchronize the configured roles and permissions into the database.
     *
     * @param  string|null  $guard  Limit the synchronization to a specific guard.
     */
    public function sync(?string $guard = null): array
    {
        $definitions = config('rbac.guards', []);

        if ($guard !== null) {
            if (!array_key_exists($guard, $definitions)) {
                throw new InvalidArgumentException("Guard [{$guard}] is not defined in config/rbac.php");
            }

            $definitions = [$guard => $definitions[$guard]];
        }

        $stats = [
            'guards_processed' => 0,
            'roles_synced' => 0,
            'permissions_synced' => 0,
        ];

        foreach ($definitions as $guardName => $config) {
            $stats['guards_processed']++;

            $availablePermissions = $this->syncPermissions($guardName, $config['permissions'] ?? []);
            $stats['permissions_synced'] += count($availablePermissions);

            $stats['roles_synced'] += $this->syncRoles(
                $guardName,
                $config['roles'] ?? [],
                $availablePermissions
            );
        }

        $this->permissionRegistrar->forgetCachedPermissions();

        return $stats;
    }

    /**
     * @return string[] permission names synced for the guard
     */
    private function syncPermissions(string $guard, array $permissions): array
    {
        $synced = [];

        foreach ($permissions as $key => $value) {
            $name = $this->resolveName($key, $value);

            if (!$name) {
                continue;
            }

            Permission::query()->updateOrCreate(
                ['name' => $name, 'guard_name' => $guard],
                ['name' => $name, 'guard_name' => $guard]
            );

            $synced[$name] = true;
        }

        return array_keys($synced);
    }

    private function syncRoles(string $guard, array $roles, array $availablePermissions): int
    {
        $count = 0;

        foreach ($roles as $key => $value) {
            [$roleName, $definition] = $this->resolveRoleDefinition($key, $value);

            if (!$roleName) {
                continue;
            }

            $role = Role::query()->updateOrCreate(
                ['name' => $roleName, 'guard_name' => $guard],
                ['name' => $roleName, 'guard_name' => $guard]
            );

            $permissions = $definition['permissions'] ?? [];

            if ($this->wantsAllPermissions($permissions)) {
                $role->syncPermissions($availablePermissions);
            } else {
                $role->syncPermissions((array) $permissions);
            }

            $count++;
        }

        return $count;
    }

    private function resolveName(int|string $key, mixed $value): ?string
    {
        if (is_string($key)) {
            return $key;
        }

        if (is_string($value)) {
            return $value;
        }

        if (is_array($value) && isset($value['name']) && is_string($value['name'])) {
            return $value['name'];
        }

        return null;
    }

    private function resolveRoleDefinition(int|string $key, mixed $value): array
    {
        if (is_string($key)) {
            return [$key, is_array($value) ? $value : []];
        }

        if (is_string($value)) {
            return [$value, []];
        }

        if (is_array($value) && isset($value['name']) && is_string($value['name'])) {
            $definition = $value;
            unset($definition['name']);

            return [$value['name'], $definition];
        }

        return [null, []];
    }

    private function wantsAllPermissions(mixed $permissions): bool
    {
        if ($permissions === '*') {
            return true;
        }

        return is_array($permissions) && in_array('*', $permissions, true);
    }
}

