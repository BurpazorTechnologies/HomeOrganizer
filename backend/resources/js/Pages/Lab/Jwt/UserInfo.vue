<script setup>
import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

const page = usePage();
const user = computed(() => page.props.auth?.user);
const userInfo = computed(() => user.value?.user_information);
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div class="mb-4">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Current User Information</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">You Are Logged In as a client.</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div class="flex items-center">
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Email:</span>
                <span class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ user?.email || 'N/A' }}</span>
            </div>
            <div class="flex items-center">
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">First Name:</span>
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ userInfo?.first_name || 'N/A' }}</span>
            </div>
            <div class="flex items-center">
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Last Name:</span>
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ userInfo?.last_name || 'N/A' }}</span>
            </div>
            <div class="flex items-center">
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">User ID:</span>
                <span class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ user?.id || 'N/A' }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>

