<script setup lang="ts">
import type { CurrentUser } from '@/Types/Utility/RBAC/jwt/Types';

const props = defineProps<{
    currentUser: CurrentUser | null;
}>();
</script>

<template>
    <section class="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-semibold text-white">Current Session User</h2>
                <p class="text-sm text-slate-400">
                    User information retrieved from session.
                </p>
            </div>
        </div>

        <div v-if="props.currentUser" class="space-y-6">
            <div class="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <div class="text-xs uppercase tracking-wide text-slate-500">User ID</div>
                    <div class="text-lg font-semibold text-white">
                        {{ props.currentUser.id }}
                    </div>
                </div>
                <div>
                    <div class="text-xs uppercase tracking-wide text-slate-500">Email</div>
                    <div class="text-lg font-semibold text-white break-all">
                        {{ props.currentUser.email ?? 'n/a' }}
                    </div>
                </div>
                <div>
                    <div class="text-xs uppercase tracking-wide text-slate-500">Guard</div>
                    <div class="text-lg font-semibold text-white capitalize">
                        {{ props.currentUser.guard ?? 'unknown' }}
                    </div>
                </div>
                <div>
                    <div class="text-xs uppercase tracking-wide text-slate-500">Role Count</div>
                    <div class="text-lg font-semibold text-white">
                        {{ props.currentUser.roles.length ?? 0 }}
                    </div>
                </div>
            </div>

            <div v-if="props.currentUser.roles.length" class="rounded-xl border border-slate-800 bg-slate-950/60">
                <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div class="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        User Roles
                    </div>
                    <div class="text-xs text-slate-500">
                        {{ props.currentUser.roles.length }} assigned
                    </div>
                </header>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[320px] border-collapse text-sm">
                        <thead>
                            <tr class="text-left text-slate-400">
                                <th class="px-4 py-3 font-medium">Role</th>
                                <th class="px-4 py-3 font-medium">Guard</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="role in props.currentUser.roles"
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
            </div>
        </div>

        <div v-else class="rounded-xl border border-dashed border-slate-800 px-6 py-8 text-center text-slate-500">
            No authenticated user detected.
        </div>
    </section>
</template>

