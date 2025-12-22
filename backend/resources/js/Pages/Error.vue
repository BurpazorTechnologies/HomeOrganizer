<script setup lang="ts">
import { Head } from '@inertiajs/vue3';

const props = defineProps<{
    status: number;
    message?: string;
}>();
</script>

<template>
    <Head :title="`${status} Error`" />
    <div class="min-h-screen bg-gray-900 flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-300 mb-4">{{ status }}</h1>
            <h2 class="text-2xl font-semibold text-gray-300 mb-6 uppercase">
                {{ status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT FOUND' : 'ERROR' }}
            </h2>
            <p v-if="message" class="text-gray-400 text-lg max-w-md mx-auto">
                {{ message }}
            </p>
        </div>
    </div>
</template>

<style scoped>
</style>

