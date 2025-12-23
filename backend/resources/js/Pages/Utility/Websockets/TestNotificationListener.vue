<script setup lang="ts">
import { useEchoChannel } from '@/Composables/useEchoChannel';
import Swal from 'sweetalert2';

type NotificationEvent = {
    title?: string;
    message?: string;
    [k: string]: unknown;
};

useEchoChannel<NotificationEvent>(
    'utility.reverb',
    '.reverb.test-notification',
    async (data) => {
        await Swal.fire({
            icon: 'success',
            title: data.title ?? 'Notification',
            text: data.message ?? '',
        });
    }
);
</script>

<template>
    <div class="">
        <h1>Listening for test notifications...</h1>
    </div>
</template>
