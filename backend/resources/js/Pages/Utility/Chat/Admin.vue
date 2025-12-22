<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import ChatBox from '@/Pages/Utility/Chat/ChatBox.vue';
import ConnectionStatus from '@/Pages/Utility/Chat/ConnectionStatus.vue';
import TestNotificationListener from '@/Pages/Utility/Chat/TestNotificationListener.vue';

const props = defineProps<{
    role: 'admin'
}>();
</script>

<template>
    <Head title="Admin Chat">
        <link rel="icon" type="image/png" href="/assets/img/_shared/homeorganizer-tech-logo.svg" />
    </Head>

    <div class="space-y-4">
        <ConnectionStatus />
        <TestNotificationListener />
        <ChatBox :role="props.role" />
    </div>
</template>

<style scoped lang="scss"></style>
