<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, computed} from 'vue';

type ConnState =
    | 'initialized'     // created but not connected yet
    | 'connecting'
    | 'connected'
    | 'unavailable'     // can’t reach server (network/DNS/SSL/etc)
    | 'failed'          // auth/handshake failure
    | 'disconnected';

const state = ref<ConnState>('initialized');
const lastError = ref<string | null>(null);
const attempts = ref<number>(0);

const label = computed(() => {
    switch (state.value) {
        case 'connected':
            return 'Connected';
        case 'connecting':
            return 'Connecting…';
        case 'unavailable':
            return 'Server unavailable';
        case 'failed':
            return 'Connection failed';
        case 'disconnected':
            return 'Disconnected';
        default:
            return 'Initialized';
    }
});

const dotClass = computed(() => {
    switch (state.value) {
        case 'connected':
            return 'bg-emerald-500';
        case 'connecting':
            return 'bg-amber-500 animate-pulse';
        case 'unavailable':
            return 'bg-orange-500';
        case 'failed':
            return 'bg-red-600';
        case 'disconnected':
            return 'bg-gray-400';
        default:
            return 'bg-gray-300';
    }
});

let unbinders: Array<() => void> = [];

onMounted(() => {
    const echo = (window as any)?.Echo;
    if (!echo) {
        state.value = 'failed';
        lastError.value = 'window.Echo is not available.';
        return;
    }

    const pusher = (echo.connector as any)?.pusher;
    const connection = pusher?.connection;

    if (!connection) {
        state.value = 'failed';
        lastError.value = 'Echo connector has no underlying connection.';
        return;
    }

    state.value = connection.state;

    const bind = (event: string, fn: (...args: any[]) => void) => {
        connection.bind(event, fn);
        unbinders.push(() => connection.unbind(event, fn));
    };

    bind('state_change', ({current}: { previous: string; current: ConnState }) => {
        state.value = current;
        if (current === 'connecting') attempts.value++;
    });

    // Errors (TLS, handshake, auth, protocol)
    bind('error', (err: any) => {
        lastError.value = (err?.data?.message || err?.message || JSON.stringify(err));
    });

    bind('connected', () => {
        state.value = 'connected';
    });
    bind('disconnected', () => {
        state.value = 'disconnected';
    });
    bind('unavailable', () => {
        state.value = 'unavailable';
    });
});

onBeforeUnmount(() => {
    unbinders.forEach((u) => u());
    unbinders = [];
});
</script>

<template>
    <div class="w-full text-center py-6">
        <div class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <span class="h-2 w-2 rounded-full" :class="dotClass"/>
            <span class="font-medium">{{ label }}</span>
            <span v-if="attempts > 0" class="text-gray-500">(#{{ attempts }})</span>
            <span v-if="lastError" class="ml-2 max-w-[32ch] truncate text-gray-500" :title="lastError">– {{ lastError }}</span>
        </div>
    </div>
</template>
