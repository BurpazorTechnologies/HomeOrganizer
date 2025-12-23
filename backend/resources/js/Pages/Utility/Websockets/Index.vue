<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import TestNotificationListener from '@/Pages/Utility/Websockets/TestNotificationListener.vue';
</script>

<template>
    <Head title="Utility - Reverb Websockets">
        <link rel="icon" type="image/png" href="/assets/img/_shared/burpazor-tech-logo.svg" />
    </Head>

    <div class="space-y-4">
        <TestNotificationListener />
    </div>
</template>

<style scoped lang="scss"></style>