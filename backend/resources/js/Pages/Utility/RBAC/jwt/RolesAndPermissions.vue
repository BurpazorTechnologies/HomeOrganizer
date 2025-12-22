<script setup lang="ts">
import { ref } from 'vue';
import {Head} from '@inertiajs/vue3';
import CurrentUserSection from './components/CurrentUserSection.vue';
import JwtTokenSection from './components/JwtTokenSection.vue';
import JwtTesterSection from './components/JwtTesterSection.vue';
import type { CurrentUser, JwtConfig, RoleOption, PermissionOption } from '@/Types/Utility/RBAC/jwt/Types';

const props = defineProps<{
    currentUser: CurrentUser | null;
    jwtToken: string | null;
    jwtConfig: JwtConfig;
}>();

// Available roles and permissions from rbac.php config
const availableRoles: RoleOption[] = [
    { name: 'superadmin', guard: 'admin' },
    { name: 'admin', guard: 'admin' },
    { name: 'client', guard: 'client' },
];

const availablePermissions: PermissionOption[] = [
    // Admin permissions
    { name: 'admin.dashboard.access', guard: 'admin' },
    { name: 'admin.chat.view', guard: 'admin' },
    { name: 'admin.chat.respond', guard: 'admin' },
    { name: 'admin.chat.audit', guard: 'admin' },
    { name: 'admin.chat.manage', guard: 'admin' },
    { name: 'admin.tracking.dashboard.view', guard: 'admin' },
    { name: 'admin.tracking.report.export', guard: 'admin' },
    { name: 'admin.tracking.configure', guard: 'admin' },
    { name: 'admin.portfolio.manage', guard: 'admin' },
    { name: 'admin.resume.review', guard: 'admin' },
    { name: 'admin.resume.approve', guard: 'admin' },
    { name: 'admin.users.manage', guard: 'admin' },
    { name: 'admin.utility.access', guard: 'admin' },
    // Client permissions
    { name: 'client.dashboard.access', guard: 'client' },
    { name: 'client.profile.view', guard: 'client' },
    { name: 'client.profile.update', guard: 'client' },
    { name: 'client.chat.view-history', guard: 'client' },
    { name: 'client.chat.send', guard: 'client' },
    { name: 'client.chat.attachments', guard: 'client' },
    { name: 'client.portfolio.download', guard: 'client' },
];

// JWT token reference for tester section
const jwtTokenSectionRef = ref<InstanceType<typeof JwtTokenSection> | null>(null);

const getJwtToken = (): string | null => {
    if (jwtTokenSectionRef.value) {
        return jwtTokenSectionRef.value.getJwtToken();
    }
    return sessionStorage.getItem('jwt_token');
};
</script>

<template>
    <Head title="Utility | RBAC JWT Roles and Permissions">
        <link rel="icon" type="image/png" href="/assets/img/_shared/homeorganizer-tech-logo.svg"/>
    </Head>
    <div class="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div class="mx-auto w-full max-w-5xl">
            <header class="mb-10 space-y-3">
                <p class="text-sm font-mono uppercase tracking-[0.3em] text-slate-400">
                    Utility · JWT RBAC Testing
                </p>
                <h1 class="text-3xl font-semibold text-white">
                    JWT-Based Role & Permission Testing
                </h1>
                <p class="text-slate-400">
                    Test role and permission checks using JWT tokens. JWT tokens are stored in sessionStorage.
                </p>
            </header>

            <CurrentUserSection :current-user="props.currentUser" />

            <JwtTokenSection
                ref="jwtTokenSectionRef"
                :jwt-token="props.jwtToken"
                :jwt-config="props.jwtConfig"
            />

            <JwtTesterSection
                :get-jwt-token="getJwtToken"
                :available-roles="availableRoles"
                :available-permissions="availablePermissions"
            />
        </div>
    </div>
</template>
