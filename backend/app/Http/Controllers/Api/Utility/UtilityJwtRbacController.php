<?php

namespace App\Http\Controllers\Api\Utility;

use App\Http\Controllers\Controller;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UtilityJwtRbacController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
        // Use 'app' service for JWT decoding (production service)
        $this->jwtService = $jwtService->forService('app');
    }

    public function testRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string'],
        ]);

        $jwtUserInfo = $this->resolveJwtUserContext($request);

        if (!$jwtUserInfo) {
            return $this->jwtNotDetectedResponse();
        }

        $roleName = $validated['role'];
        $roles = $jwtUserInfo['roles'] ?? [];
        $guard = $jwtUserInfo['guard'] ?? null;
        $hasRole = in_array($roleName, $roles, true);

        $roleModel = $this->findRoleModel($roleName, $guard);
        $features = $this->describeRoleFeatureSet($roleModel, $roles, $roleName, $guard, $hasRole);

        return response()->json([
            'role' => $roleName,
            'guard' => $guard,
            'granted' => $hasRole,
            'super_admin_override' => $this->isSuperAdmin($roles),
            'message' => $hasRole
                ? sprintf('You have role: %s', $roleName)
                : sprintf('You don\'t have role: %s', $roleName),
            'features' => $features,
            'jwt_roles' => $roles,
        ]);
    }

    public function testPermission(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'permission' => ['required', 'string'],
        ]);

        $jwtUserInfo = $this->resolveJwtUserContext($request);

        if (!$jwtUserInfo) {
            return $this->jwtNotDetectedResponse();
        }

        $permissionName = $validated['permission'];
        $roles = $jwtUserInfo['roles'] ?? [];
        $guard = $jwtUserInfo['guard'] ?? null;
        $isAllowed = $this->hasPermission($permissionName, $roles, $guard);

        $features = $this->describePermissionFeatures($permissionName, $guard, $isAllowed);

        return response()->json([
            'permission' => $permissionName,
            'guard' => $guard,
            'granted' => $isAllowed,
            'super_admin_override' => $this->isSuperAdmin($roles),
            'message' => $isAllowed
                ? sprintf('You have permission: %s', $permissionName)
                : sprintf('You don\'t have permission: %s', $permissionName),
            'features' => $features,
            'jwt_roles' => $roles,
        ]);
    }

    /**
     * Resolve user context from JWT token
     *
     * @param Request $request
     * @return array|null Returns ['id', 'email', 'roles', 'guard', 'context'] or null
     */
    protected function resolveJwtUserContext(Request $request): ?array
    {
        return $this->jwtService->getJwtUserInfo($request);
    }

    protected function jwtNotDetectedResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'No valid JWT token detected. Include JWT token in Authorization header (Bearer token).',
        ], 401);
    }

    /**
     * Check if user has permission based on JWT roles
     *
     * @param string $permissionName
     * @param array $roles
     * @param string|null $guard
     * @return bool
     */
    protected function hasPermission(string $permissionName, array $roles, ?string $guard): bool
    {
        // Superadmin has all permissions
        if ($this->isSuperAdmin($roles)) {
            return true;
        }

        // Get role permissions from config
        $rbacConfig = config('rbac.guards', []);
        $guardConfig = $rbacConfig[$guard] ?? null;

        if (!$guardConfig) {
            return false;
        }

        // Check each role for the permission
        foreach ($roles as $roleName) {
            $roleConfig = $guardConfig['roles'][$roleName] ?? null;

            if (!$roleConfig) {
                continue;
            }

            $rolePermissions = $roleConfig['permissions'] ?? [];

            // If role has wildcard permissions, grant all
            if ($rolePermissions === '*' || (is_array($rolePermissions) && in_array('*', $rolePermissions, true))) {
                return true;
            }

            // Check if permission is in role's permissions list
            if (is_array($rolePermissions) && in_array($permissionName, $rolePermissions, true)) {
                return true;
            }
        }

        return false;
    }

    protected function describeRoleFeatureSet(?Role $role, array $jwtRoles, string $roleName, ?string $guardName, bool $roleAttached): array
    {
        if (!$role) {
            return [$this->missingRoleDescriptor($roleName, $guardName ?? 'unknown', $roleAttached)];
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

        // Map JWT roles to permissions using config
        $rbacConfig = config('rbac.guards', []);
        $guardConfig = $rbacConfig[$guardName] ?? null;

        return $role->permissions
            ->sortBy('name')
            ->map(function (Permission $permission) use ($jwtRoles, $guardName, $guardConfig) {
                $granted = $this->hasPermission($permission->name, $jwtRoles, $guardName);
                $summary = $granted
                    ? 'Granted via JWT role claims.'
                    : 'Denied. Role not in JWT or permission not assigned to role.';

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
            ? 'Permission granted via JWT role claims.'
            : 'Permission denied. Role not in JWT or permission not assigned to role.';

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

    protected function findRoleModel(string $roleName, ?string $guardName): ?Role
    {
        return Role::query()
            ->where('name', $roleName)
            ->when($guardName, fn($query) => $query->where('guard_name', $guardName))
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

    protected function isSuperAdmin(array $roles): bool
    {
        return in_array('superadmin', $roles, true);
    }

    public function verifySignature(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'secret_key' => ['required', 'string'],
            'algorithm' => ['required', 'string', 'in:HS256,HS512'],
        ]);

        try {
            // Create a temporary JWT service with the provided secret key
            $tempConfig = config('jwt.services.app', []);
            $tempConfig['secret_key'] = $validated['secret_key'];
            $tempConfig['algorithm'] = $validated['algorithm'];

            // Create a custom service instance with the provided secret
            $customService = new \App\Services\JwtService('app', $tempConfig);
            
            // Try to decode with the provided secret (this will verify the signature)
            $payload = $customService->decodeToken($validated['token'], validateExpiration: false);
            
            return response()->json([
                'valid' => true,
                'message' => 'Signature is valid',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Signature verification failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}
