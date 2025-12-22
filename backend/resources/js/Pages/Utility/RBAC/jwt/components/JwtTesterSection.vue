<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import type { TesterResponse, RoleOption, PermissionOption } from '@/Types/Utility/RBAC/jwt/Types';

const props = defineProps<{
    getJwtToken: () => string | null;
    availableRoles: RoleOption[];
    availablePermissions: PermissionOption[];
}>();

// Testing
const roleInput = ref('');
const permissionInput = ref('');
const roleResponse = ref<TesterResponse | null>(null);
const permissionResponse = ref<TesterResponse | null>(null);
const roleLoading = ref(false);
const permissionLoading = ref(false);
const roleError = ref<string | null>(null);
const permissionError = ref<string | null>(null);

const selectRole = (roleName: string): void => {
    roleInput.value = roleName;
};

const selectPermission = (permissionName: string): void => {
    permissionInput.value = permissionName;
};

const testRole = async (): Promise<void> => {
    if (!roleInput.value.trim()) {
        alert('Please enter a role name');
        return;
    }

    const token = props.getJwtToken();
    if (!token) {
        alert('No JWT token found. Please ensure you are logged in.');
        return;
    }

    roleLoading.value = true;
    roleError.value = null;
    roleResponse.value = null;

    try {
        const { data } = await axios.get<TesterResponse>('/api/utility/rbac/jwt/test-role', {
            params: { role: roleInput.value },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        roleResponse.value = data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            roleError.value = error.response?.data?.message || 'Failed to test role';
        } else {
            roleError.value = 'Failed to test role';
        }
    } finally {
        roleLoading.value = false;
    }
};

const testPermission = async (): Promise<void> => {
    if (!permissionInput.value.trim()) {
        alert('Please enter a permission name');
        return;
    }

    const token = props.getJwtToken();
    if (!token) {
        alert('No JWT token found. Please ensure you are logged in.');
        return;
    }

    permissionLoading.value = true;
    permissionError.value = null;
    permissionResponse.value = null;

    try {
        const { data } = await axios.get<TesterResponse>('/api/utility/rbac/jwt/test-permission', {
            params: { permission: permissionInput.value },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        permissionResponse.value = data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            permissionError.value = error.response?.data?.message || 'Failed to test permission';
        } else {
            permissionError.value = 'Failed to test permission';
        }
    } finally {
        permissionLoading.value = false;
    }
};
</script>

<template>
    <section class="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-semibold text-white">JWT-Based Testing</h2>
                <p class="text-sm text-slate-400">
                    Test roles and permissions using JWT token from sessionStorage.
                </p>
            </div>
        </div>

        <div class="space-y-8">
            <!-- Role Testing -->
            <div>
                <h3 class="mb-4 text-lg font-semibold text-white">Test Role</h3>
                <div class="mb-4 flex gap-4">
                    <input
                        v-model="roleInput"
                        type="text"
                        placeholder="Enter role name (e.g., admin, client)"
                        class="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        @click="testRole"
                        :disabled="roleLoading"
                        class="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {{ roleLoading ? 'Testing...' : 'Test Role' }}
                    </button>
                </div>

                <!-- Role Tags -->
                <div class="mb-4">
                    <div class="mb-2 text-xs uppercase tracking-wide text-slate-500">Quick Select Roles</div>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="role in availableRoles"
                            :key="role.name"
                            @click="selectRole(role.name)"
                            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:border-blue-500 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            {{ role.name }}
                            <span class="ml-1 text-slate-500">({{ role.guard }})</span>
                        </button>
                    </div>
                </div>

                <div v-if="roleError" class="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
                    {{ roleError }}
                </div>

                <div v-if="roleResponse" class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div class="mb-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Role</div>
                            <div class="font-semibold text-white">{{ roleResponse.role }}</div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Granted</div>
                            <div :class="roleResponse.granted ? 'text-green-400' : 'text-red-400'" class="font-semibold">
                                {{ roleResponse.granted ? 'Yes' : 'No' }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Guard</div>
                            <div class="font-semibold text-white">{{ roleResponse.guard }}</div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Message</div>
                            <div class="text-sm text-slate-300">{{ roleResponse.message }}</div>
                        </div>
                    </div>
                    <div v-if="roleResponse.jwt_roles" class="mb-4">
                        <div class="text-xs uppercase tracking-wide text-slate-500 mb-2">JWT Roles</div>
                        <div class="flex flex-wrap gap-2">
                            <span
                                v-for="role in roleResponse.jwt_roles"
                                :key="role"
                                class="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300"
                            >
                                {{ role }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Permission Testing -->
            <div>
                <h3 class="mb-4 text-lg font-semibold text-white">Test Permission</h3>
                <div class="mb-4 flex gap-4">
                    <input
                        v-model="permissionInput"
                        type="text"
                        placeholder="Enter permission name (e.g., admin.chat.manage)"
                        class="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        @click="testPermission"
                        :disabled="permissionLoading"
                        class="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {{ permissionLoading ? 'Testing...' : 'Test Permission' }}
                    </button>
                </div>

                <!-- Permission Tags -->
                <div class="mb-4">
                    <div class="mb-2 text-xs uppercase tracking-wide text-slate-500">Quick Select Permissions</div>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="permission in availablePermissions"
                            :key="permission.name"
                            @click="selectPermission(permission.name)"
                            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:border-blue-500 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            {{ permission.name }}
                        </button>
                    </div>
                </div>

                <div v-if="permissionError" class="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
                    {{ permissionError }}
                </div>

                <div v-if="permissionResponse" class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div class="mb-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Permission</div>
                            <div class="font-semibold text-white">{{ permissionResponse.permission }}</div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Granted</div>
                            <div :class="permissionResponse.granted ? 'text-green-400' : 'text-red-400'" class="font-semibold">
                                {{ permissionResponse.granted ? 'Yes' : 'No' }}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Guard</div>
                            <div class="font-semibold text-white">{{ permissionResponse.guard }}</div>
                        </div>
                        <div>
                            <div class="text-xs uppercase tracking-wide text-slate-500">Message</div>
                            <div class="text-sm text-slate-300">{{ permissionResponse.message }}</div>
                        </div>
                    </div>
                    <div v-if="permissionResponse.jwt_roles" class="mb-4">
                        <div class="text-xs uppercase tracking-wide text-slate-500 mb-2">JWT Roles</div>
                        <div class="flex flex-wrap gap-2">
                            <span
                                v-for="role in permissionResponse.jwt_roles"
                                :key="role"
                                class="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300"
                            >
                                {{ role }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

