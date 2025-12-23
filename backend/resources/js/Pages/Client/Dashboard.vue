<script setup>
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/Client/AuthenticatedLayout.vue';
import CreateProjectBtn from '@/Components/Client/Organizer/CreateProjectBtn.vue';
import ProjectList from '@/Components/Client/Organizer/ProjectList.vue';

const props = defineProps({
    projects: {
        type: Array,
        default: () => [],
    },
});
</script>

<template>
    <Head title="Dashboard" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="font-semibold text-xl leading-tight text-gray-100">Dashboard</h2>
        </template>

        <div class="py-12">
            <CreateProjectBtn />
            <ProjectList :projects="projects" />
        </div>
    </AuthenticatedLayout>
</template>
