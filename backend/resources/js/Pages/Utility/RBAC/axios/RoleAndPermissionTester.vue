<script setup lang="ts">
import axios, { AxiosError } from 'axios';
import PermissionProbeCard from './components/PermissionProbeCard.vue';
import RoleProbeCard from './components/RoleProbeCard.vue';
import type { TesterResponse } from '@/Types/Utility/RBAC/axios/TesterResponse';

type PermissionProbe = {
    id: string;
    title: string;
    permission: string;
    guard: string;
    description: string;
};

type RoleProbe = {
    id: string;
    title: string;
    role: string;
    guard: string;
    description: string;
};

const permissionProbes: PermissionProbe[] = [
    {
        id: 'admin-chat-manage',
        title: 'Admin · Chat Manage',
        permission: 'admin.chat.manage',
        guard: 'admin',
        description: 'Full control over live chat moderation, matching config/rbac.php.',
    },
    {
        id: 'admin-dashboard-access',
        title: 'Admin · Dashboard Access',
        permission: 'admin.dashboard.access',
        guard: 'admin',
        description: 'Entry point to the admin overview dashboard.',
    },
    {
        id: 'client-dashboard-access',
        title: 'Client · Dashboard Access',
        permission: 'client.dashboard.access',
        guard: 'client',
        description: 'Default access for clients to review their project status.',
    },
    {
        id: 'client-chat-send',
        title: 'Client · Chat Send',
        permission: 'client.chat.send',
        guard: 'client',
        description: 'Allows clients to send chat messages to admins.',
    },
];

const roleProbes: RoleProbe[] = [
    {
        id: 'superadmin-role',
        title: 'Super Administrator',
        role: 'superadmin',
        guard: 'admin',
        description: 'Unrestricted role defined in config/rbac.php.',
    },
    {
        id: 'admin-role',
        title: 'Administrator',
        role: 'admin',
        guard: 'admin',
        description: 'Standard admin role with platform-wide access.',
    },
    {
        id: 'client-role',
        title: 'Client',
        role: 'client',
        guard: 'client',
        description: 'Default client role with dashboard, profile, and chat access.',
    },
];

const normalizeAxiosError = (error: unknown): Error => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? 'Unable to reach the RBAC tester API.';
        return new Error(message);
    }

    return new Error('Unable to reach the RBAC tester API.');
};

const probePermission = async (permission: string): Promise<TesterResponse> => {
    try {
        const { data } = await axios.get<TesterResponse>('/api/utility/rbac/test-permission', {
            params: { permission },
        });

        return data;
    } catch (error) {
        throw normalizeAxiosError(error);
    }
};

const probeRole = async (role: string): Promise<TesterResponse> => {
    try {
        const { data } = await axios.get<TesterResponse>('/api/utility/rbac/test-role', {
            params: { role },
        });

        return data;
    } catch (error) {
        throw normalizeAxiosError(error);
    }
};
</script>

<template>
    <section class="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <p class="text-xs font-mono uppercase tracking-[0.3em] text-slate-500">
                    Inline RBAC Tester
                </p>
                <h2 class="text-xl font-semibold text-white">
                    Manual Role & Permission Checks
                </h2>
                <p class="text-sm text-slate-400">
                    Pick a sample definition from <code class="font-mono text-amber-300">config/rbac.php</code> and fire
                    off a probe. Responses stream straight from the debug-only API endpoints.
                </p>
            </div>
            <span
                class="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
            >
                Manual trigger
            </span>
        </div>

        <div class="mt-10 space-y-10">
            <div>
                <header class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-slate-500">Permission presets</p>
                        <h3 class="text-lg font-semibold text-white">
                            Call <code class="font-mono text-amber-300">/api/utility/rbac/test-permission</code>
                        </h3>
                    </div>
                    <p class="text-xs text-slate-500">
                        {{ permissionProbes.length }} definitions
                    </p>
                </header>

                <div class="mt-4 grid gap-4 md:grid-cols-2">
                    <PermissionProbeCard
                        v-for="probe in permissionProbes"
                        :key="probe.id"
                        :title="probe.title"
                        :permission="probe.permission"
                        :guard="probe.guard"
                        :description="probe.description"
                        :fetcher="() => probePermission(probe.permission)"
                    />
                </div>
            </div>

            <div>
                <header class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-slate-500">Role presets</p>
                        <h3 class="text-lg font-semibold text-white">
                            Call <code class="font-mono text-amber-300">/api/utility/rbac/test-role</code>
                        </h3>
                    </div>
                    <p class="text-xs text-slate-500">
                        {{ roleProbes.length }} definitions
                    </p>
                </header>

                <div class="mt-4 grid gap-4 md:grid-cols-3">
                    <RoleProbeCard
                        v-for="probe in roleProbes"
                        :key="probe.id"
                        :title="probe.title"
                        :role="probe.role"
                        :guard="probe.guard"
                        :description="probe.description"
                        :fetcher="() => probeRole(probe.role)"
                    />
                </div>
            </div>
        </div>
    </section>
</template>
