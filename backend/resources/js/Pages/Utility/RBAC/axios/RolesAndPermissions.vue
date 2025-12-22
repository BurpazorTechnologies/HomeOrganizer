<script setup lang="ts">
import { computed } from 'vue';
import {Head} from '@inertiajs/vue3';
import RoleAndPermissionTester from './RoleAndPermissionTester.vue';

type Role = {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
};

type Permission = {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
};

type CurrentUserRole = {
    id: number;
    name: string;
    guard_name: string;
};

type CurrentUserPermission = {
    id: number;
    name: string;
    guard_name: string;
};

type CurrentUser = {
    id: number | string;
    email: string | null;
    guard: string | null;
    roles: CurrentUserRole[];
    permissions: CurrentUserPermission[];
};

const props = defineProps<{
    roles: Role[];
    permissions: Permission[];
    generatedAt: string;
    currentUser: CurrentUser | null;
}>();

const hasRoles = computed(() => props.roles.length > 0);
const hasPermissions = computed(() => props.permissions.length > 0);
const hasCurrentUser = computed(() => Boolean(props.currentUser));

const rolesByGuard = computed<Record<string, Role[]>>(() => {
    return props.roles.reduce<Record<string, Role[]>>((groups, role) => {
        if (!groups[role.guard_name]) {
            groups[role.guard_name] = [];
        }

        groups[role.guard_name].push(role);
        return groups;
    }, {});
});

const permissionsByGuard = computed<Record<string, Permission[]>>(() => {
    return props.permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
        if (!groups[permission.guard_name]) {
            groups[permission.guard_name] = [];
        }

        groups[permission.guard_name].push(permission);
        return groups;
    }, {});
});
</script>

<template>
    <Head title="Utility | RBAC Axios Roles and Permissions">
        <link rel="icon" type="image/png" href="/assets/img/_shared/homeorganizer-tech-logo.svg"/>
    </Head>
    <div class="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div class="mx-auto w-full max-w-5xl">
            <header class="mb-10 space-y-3">
                <p class="text-sm font-mono uppercase tracking-[0.3em] text-slate-400">
                    Utility · RBAC Inspection
                </p>
                <h1 class="text-3xl font-semibold text-white">
                    Roles & Permissions Snapshot
                </h1>
                <p class="text-slate-400">
                    Live data pulled directly from the Spatie permission tables. Use this view to confirm which
                    guards are active and what labels are available before wiring up UI or seeds.
                </p>
                <div class="text-xs text-slate-500">
                    Generated at {{ props.generatedAt }}
                </div>
            </header>
            
            <RoleAndPermissionTester />

            <section class="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-semibold text-white">Current Session</h2>
                        <p class="text-sm text-slate-400">
                            Showing the authenticated user detected across your configured guards.
                        </p>
                    </div>
                    <div
                        class="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
                    >
                        Runtime context
                    </div>
                </div>

                <div v-if="hasCurrentUser" class="space-y-6">
                    <div
                        class="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">User ID</div>
                            <div class="text-lg font-semibold text-white">
                                {{ props.currentUser?.id }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Email</div>
                            <div class="text-lg font-semibold text-white break-all">
                                {{ props.currentUser?.email ?? 'n/a' }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Guard</div>
                            <div class="text-lg font-semibold text-white capitalize">
                                {{ props.currentUser?.guard ?? 'unknown' }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Role Count</div>
                            <div class="text-lg font-semibold text-white">
                                {{ props.currentUser?.roles.length ?? 0 }}
                            </div>
                        </div>
                    </div>

                    <div class="grid gap-6 lg:grid-cols-2">
                        <div class="rounded-xl border border-slate-800 bg-slate-950/60">
                            <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                                <div class="text-sm font-semibold uppercase tracking-wide text-slate-400">
                                    User Roles
                                </div>
                                <div class="text-xs text-slate-500">
                                    {{ props.currentUser?.roles.length ?? 0 }} assigned
                                </div>
                            </header>
                            <div v-if="props.currentUser?.roles.length" class="overflow-x-auto">
                                <table class="w-full min-w-[320px] border-collapse text-sm">
                                    <thead>
                                    <tr class="text-left text-slate-400">
                                        <th class="px-4 py-3 font-medium">Role</th>
                                        <th class="px-4 py-3 font-medium">Guard</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr
                                        v-for="role in props.currentUser?.roles"
                                        :key="role.id"
                                        class="border-t border-slate-800/60"
                                    >
                                        <td class="px-4 py-3 font-semibold text-white">
                                            {{ role.name }}
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="rounded bg-slate-800 px-2 py-1 text-xs uppercase tracking-wider text-slate-300">
                                                {{ role.guard_name }}
                                            </span>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else class="px-4 py-6 text-center text-sm text-slate-500">
                                No roles attached to this user.
                            </div>
                        </div>

                        <div class="rounded-xl border border-slate-800 bg-slate-950/60">
                            <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                                <div class="text-sm font-semibold uppercase tracking-wide text-slate-400">
                                    User Permissions
                                </div>
                                <div class="text-xs text-slate-500">
                                    {{ props.currentUser?.permissions.length ?? 0 }} resolved
                                </div>
                            </header>
                            <div v-if="props.currentUser?.permissions.length" class="overflow-x-auto">
                                <table class="w-full min-w-[320px] border-collapse text-sm">
                                    <thead>
                                    <tr class="text-left text-slate-400">
                                        <th class="px-4 py-3 font-medium">Permission</th>
                                        <th class="px-4 py-3 font-medium">Guard</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr
                                        v-for="permission in props.currentUser?.permissions"
                                        :key="permission.id"
                                        class="border-t border-slate-800/60"
                                    >
                                        <td class="px-4 py-3 font-semibold text-white">
                                            {{ permission.name }}
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="rounded bg-slate-800 px-2 py-1 text-xs uppercase tracking-wider text-slate-300">
                                                {{ permission.guard_name }}
                                            </span>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else class="px-4 py-6 text-center text-sm text-slate-500">
                                No direct or inherited permissions detected.
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="rounded-xl border border-dashed border-slate-800 px-6 py-8 text-center text-slate-500">
                    No authenticated user detected for any guard. Login as an admin/client to inspect runtime
                    access.
                </div>
            </section>

            <section class="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-semibold text-white">Roles</h2>
                        <p class="text-sm text-slate-400">
                            {{ props.roles.length }} total role<span v-if="props.roles.length !== 1">s</span>
                            across {{ Object.keys(rolesByGuard).length }} guard<span v-if="Object.keys(rolesByGuard).length !== 1">s</span>.
                        </p>
                    </div>
                    <div class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Guard aware
                    </div>
                </div>

                <div v-if="hasRoles" class="mt-6 space-y-8">
                    <div
                        v-for="(groupRoles, guard) in rolesByGuard"
                        :key="guard"
                        class="rounded-xl border border-slate-800 bg-slate-900/60"
                    >
                        <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="h-2 w-2 rounded-full bg-emerald-400/80" />
                                <div class="text-sm uppercase tracking-wide text-slate-400">
                                    {{ guard }} guard
                                </div>
                            </div>
                            <div class="text-xs text-slate-500">
                                {{ groupRoles.length }} role<span v-if="groupRoles.length !== 1">s</span>
                            </div>
                        </header>
                        <div class="overflow-x-auto">
                            <table class="w-full min-w-[480px] border-collapse text-sm">
                                <thead>
                                <tr class="text-left text-slate-400">
                                    <th class="px-4 py-3 font-medium">Role</th>
                                    <th class="px-4 py-3 font-medium">Guard</th>
                                    <th class="px-4 py-3 font-medium">Created</th>
                                    <th class="px-4 py-3 font-medium">Updated</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr
                                    v-for="role in groupRoles"
                                    :key="role.id"
                                    class="border-t border-slate-800/60"
                                >
                                    <td class="px-4 py-3 font-semibold text-white">
                                        {{ role.name }}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="rounded bg-slate-800 px-2 py-1 text-xs uppercase tracking-wider text-slate-300">
                                            {{ role.guard_name }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-slate-400">
                                        {{ new Date(role.created_at).toLocaleString() }}
                                    </td>
                                    <td class="px-4 py-3 text-slate-400">
                                        {{ new Date(role.updated_at).toLocaleString() }}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div v-else class="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-500">
                    No roles found. Run `php artisan rbac:sync` or seed via `RbacSeeder`.
                </div>
            </section>

            <section class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-semibold text-white">Permissions</h2>
                        <p class="text-sm text-slate-400">
                            {{ props.permissions.length }} permission<span v-if="props.permissions.length !== 1">s</span>
                            currently registered.
                        </p>
                    </div>
                    <div class="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                        Read-only view
                    </div>
                </div>

                <div v-if="hasPermissions" class="mt-6 space-y-8">
                    <div
                        v-for="(groupPermissions, guard) in permissionsByGuard"
                        :key="guard"
                        class="rounded-xl border border-slate-800 bg-slate-900/60"
                    >
                        <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="h-2 w-2 rounded-full bg-sky-400/80" />
                                <div class="text-sm uppercase tracking-wide text-slate-400">
                                    {{ guard }} guard
                                </div>
                            </div>
                            <div class="text-xs text-slate-500">
                                {{ groupPermissions.length }} permission<span v-if="groupPermissions.length !== 1">s</span>
                            </div>
                        </header>
                        <div class="overflow-x-auto">
                            <table class="w-full min-w-[480px] border-collapse text-sm">
                                <thead>
                                <tr class="text-left text-slate-400">
                                    <th class="px-4 py-3 font-medium">Permission</th>
                                    <th class="px-4 py-3 font-medium">Guard</th>
                                    <th class="px-4 py-3 font-medium">Created</th>
                                    <th class="px-4 py-3 font-medium">Updated</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr
                                    v-for="permission in groupPermissions"
                                    :key="permission.id"
                                    class="border-t border-slate-800/60"
                                >
                                    <td class="px-4 py-3 font-semibold text-white">
                                        {{ permission.name }}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="rounded bg-slate-800 px-2 py-1 text-xs uppercase tracking-wider text-slate-300">
                                            {{ permission.guard_name }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-slate-400">
                                        {{ new Date(permission.created_at).toLocaleString() }}
                                    </td>
                                    <td class="px-4 py-3 text-slate-400">
                                        {{ new Date(permission.updated_at).toLocaleString() }}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div v-else class="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-500">
                    No permissions recorded yet. Register permissions via the Spatie models.
                </div>
            </section>
        </div>
    </div>
</template>
