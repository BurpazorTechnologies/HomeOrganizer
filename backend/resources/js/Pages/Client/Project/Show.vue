<script setup>
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/Client/AuthenticatedLayout.vue';

const props = defineProps({
    project: {
        type: Object,
        required: true,
    },
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<template>
    <Head :title="`Project: ${project.name}`" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="font-semibold text-xl leading-tight text-gray-100">Project Details</h2>
        </template>

        <div class="py-12">
            <div class="max-w-4xl mx-auto">
                <div class="bg-gray-800 border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                    <div class="px-6 py-4 bg-gray-700 border-b border-gray-600">
                        <h3 class="text-lg font-semibold text-gray-100">{{ project.name }}</h3>
                    </div>
                    <div class="px-6 py-4">
                        <table class="min-w-full divide-y divide-gray-700">
                            <tbody class="bg-gray-800 divide-y divide-gray-700">
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-200 bg-gray-700 w-1/4">
                                        UUID
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-300 font-mono">
                                        {{ project.uuid }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-200 bg-gray-700">
                                        Name
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-300">
                                        {{ project.name }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-200 bg-gray-700">
                                        Created At
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-300">
                                        {{ formatDate(project.created_at) }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-200 bg-gray-700">
                                        Updated At
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-300">
                                        {{ formatDate(project.updated_at) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

