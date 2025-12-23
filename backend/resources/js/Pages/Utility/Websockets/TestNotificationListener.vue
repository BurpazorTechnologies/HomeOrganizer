<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEchoChannel } from '@/Composables/useEchoChannel';
import Swal from 'sweetalert2';

type NotificationEvent = {
    title?: string;
    message?: string;
    [k: string]: unknown;
};

const receivedEvents = ref<Array<{ timestamp: string; data: NotificationEvent }>>([]);
const isConnected = ref(false);

useEchoChannel<NotificationEvent>(
    'utility.reverb',
    '.reverb.test-notification',
    async (data) => {
        receivedEvents.value.unshift({
            timestamp: new Date().toLocaleTimeString(),
            data,
        });

        // Keep only last 10 events
        if (receivedEvents.value.length > 10) {
            receivedEvents.value = receivedEvents.value.slice(0, 10);
        }

        await Swal.fire({
            icon: 'success',
            title: data.title ?? 'Notification',
            text: data.message ?? '',
        });
    }
);

onMounted(() => {
    // Assume connected after mount
    setTimeout(() => {
        isConnected.value = true;
    }, 500);
});
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center gap-3">
            <div
                :class="[
                    'h-3 w-3 rounded-full',
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                ]"
            ></div>
            <span class="text-sm text-slate-300">
                {{ isConnected ? 'Connected and listening' : 'Connecting...' }}
            </span>
        </div>

        <div v-if="receivedEvents.length > 0" class="space-y-2">
            <p class="text-sm font-medium text-slate-300">Received Events ({{ receivedEvents.length }})</p>
            <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                    v-for="(event, index) in receivedEvents"
                    :key="index"
                    class="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-emerald-400 font-medium">{{ event.timestamp }}</span>
                    </div>
                    <pre class="text-xs text-slate-300 overflow-x-auto">{{ JSON.stringify(event.data, null, 2) }}</pre>
                </div>
            </div>
        </div>
        <div v-else class="text-sm text-slate-500 italic">
            No events received yet. Trigger a broadcast to see events here.
        </div>
    </div>
</template>
