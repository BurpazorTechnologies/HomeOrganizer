<?php

namespace App\Http\Controllers\Api\Utility;

use App\Http\Controllers\Controller;
use App\Models\Admin\User as AdminUser;
use App\Models\Client\User as ClientUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UtilityRbacController extends Controller
{
    public function testRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string'],
        ]);

        /** @var AdminUser|ClientUser|null $user */
        [$user, $guard] = $this->resolveUserContext();

        if (!$user || !$guard) {
            return $this->userNotDetectedResponse();
        }

        $roleName = $validated['role'];
        $hasRole = $user->hasRole($roleName, $guard);

        $roleModel = $this->findRoleModel($roleName, $guard);
        $features = $this->describeRoleFeatureSet($roleModel, $user, $roleName, $guard, $hasRole);

        return response()->json([
            'role' => $roleName,
            'guard' => $guard,
            'granted' => $hasRole,
            'super_admin_override' => $this->isSuperAdmin($user),
            'message' => $hasRole
                ? sprintf('You have role: %s', $roleName)
                : sprintf('You don\'t have role: %s', $roleName),
            'features' => $features,
        ]);
    }

    public function testPermission(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'permission' => ['required', 'string'],
        ]);

        /** @var AdminUser|ClientUser|null $user */
        [$user, $guard] = $this->resolveUserContext();

        if (!$user || !$guard) {
            return $this->userNotDetectedResponse();
        }

        $permissionName = $validated['permission'];
        $isAllowed = $user->can($permissionName);

        $features = $this->describePermissionFeatures($permissionName, $guard, $isAllowed);

        return response()->json([
            'permission' => $permissionName,
            'guard' => $guard,
            'granted' => $isAllowed,
            'super_admin_override' => $this->isSuperAdmin($user),
            'message' => $isAllowed
                ? sprintf('You have permission: %s', $permissionName)
                : sprintf('You don\'t have permission: %s', $permissionName),
            'features' => $features,
        ]);
    }

    /**
     * @return array{AdminUser|ClientUser|null, string|null}
     */
    protected function resolveUserContext(): array
    {
        $guards = array_keys(config('auth.guards', []));

        foreach ($guards as $guard) {
            $user = Auth::guard($guard)->user();
            if ($user && method_exists($user, 'hasRole')) {
                Auth::shouldUse($guard);
                return [$user, $guard];
            }
        }

        $fallbackUser = Auth::user();

        if ($fallbackUser && method_exists($fallbackUser, 'hasRole')) {
            return [$fallbackUser, Auth::getDefaultDriver()];
        }

        return [null, null];
    }

    protected function userNotDetectedResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'No authenticated admin/client user detected. Login before using the RBAC tester.',
        ], 401);
    }

    protected function describeRoleFeatureSet(?Role $role, AdminUser|ClientUser $user, string $roleName, string $guardName, bool $roleAttached): array
    {
        if (!$role) {
            return [$this->missingRoleDescriptor($roleName, $guardName, $roleAttached)];
        }

        $role->loadMissing('permissions');

        if ($role->permissions->isEmpty()) {
            return [
                [
                    'key' => $role->name,
                    'label' => Str::headline($role->name),
                    'summary' => 'Role has no permissions assigned yet. Use spatie/permission to attach permissions.',
                    'guard' => $role->guard_name,
                    'permission' => $role->name,
                    'status' => $roleAttached ? 'granted' : 'requires-elevation',
                ],
            ];
        }

        return $role->permissions
            ->sortBy('name')
            ->map(function (Permission $permission) use ($user) {
                $granted = $user->can($permission->name);
                $summary = $granted
                    ? 'Granted via current guard context.'
                    : 'Denied. Attach this permission or elevate roles.';

                return $this->permissionDescriptorFromModel($permission, $granted, $summary);
            })
            ->values()
            ->all();
    }

    protected function describePermissionFeatures(string $permissionName, ?string $guardName, bool $granted): array
    {
        $permission = $this->findPermissionModel($permissionName, $guardName);

        if (!$permission) {
            return [$this->missingPermissionDescriptor($permissionName, $guardName, $granted)];
        }

        $summary = $granted
            ? 'Gate allowed this permission via $user->can().'
            : 'Gate denied this permission for the current assignment.';

        return [
            $this->permissionDescriptorFromModel($permission, $granted, $summary),
        ];
    }

    protected function permissionDescriptorFromModel(Permission $permission, bool $granted, ?string $summary = null): array
    {
        return [
            'key' => $permission->name,
            'label' => Str::headline($permission->name),
            'summary' => $summary ?? sprintf('Guard [%s] • Permission #%d', $permission->guard_name, $permission->id),
            'guard' => $permission->guard_name,
            'permission' => $permission->name,
            'status' => $granted ? 'granted' : 'requires-elevation',
        ];
    }

    protected function missingRoleDescriptor(string $roleName, string $guardName, bool $roleAttached): array
    {
        return [
            'key' => $roleName,
            'label' => Str::headline($roleName),
            'summary' => sprintf('Role `%s` is not registered for guard [%s].', $roleName, $guardName),
            'guard' => $guardName,
            'permission' => $roleName,
            'status' => $roleAttached ? 'granted' : 'requires-elevation',
        ];
    }

    protected function missingPermissionDescriptor(string $permissionName, ?string $guardName, bool $granted): array
    {
        return [
            'key' => $permissionName,
            'label' => Str::headline($permissionName),
            'summary' => sprintf(
                'Permission `%s` is not registered for guard [%s].',
                $permissionName,
                $guardName ?? 'default'
            ),
            'guard' => $guardName ?? 'n/a',
            'permission' => $permissionName,
            'status' => $granted ? 'granted' : 'requires-elevation',
        ];
    }

    protected function findRoleModel(string $roleName, string $guardName): ?Role
    {
        return Role::query()
            ->where('name', $roleName)
            ->where('guard_name', $guardName)
            ->with('permissions')
            ->first();
    }

    protected function findPermissionModel(string $permissionName, ?string $guardName): ?Permission
    {
        return Permission::query()
            ->where('name', $permissionName)
            ->when($guardName, fn($query) => $query->where('guard_name', $guardName))
            ->first();
    }

    protected function isSuperAdmin(AdminUser|ClientUser $user): bool
    {
        return method_exists($user, 'hasRole') && $user->hasRole('superadmin');
    }
}
