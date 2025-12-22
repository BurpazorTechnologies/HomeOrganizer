<script setup lang="ts">
import {Head} from '@inertiajs/vue3';
import Portfolio from "@/Pages/Admin/Dashboard/Portfolio.vue";
import AuthenticatedLayout from '@/Layouts/Admin/AuthenticatedLayout.vue';
</script>

<template>
    <Head title="Dashboard"/>
    <AuthenticatedLayout>
        <template #header>
            <h2 class="font-semibold text-xl leading-tight">Dashboard</h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <Portfolio/>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
