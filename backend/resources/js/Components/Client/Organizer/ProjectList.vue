<script setup>
import { router } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
    projects: {
        type: Array,
        default: () => [],
    },
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

const handleProjectClick = (project) => {
    router.visit(route('client.project.show', { project_uuid: project.uuid }));
};
</script>

<template>
    <div class="mt-6">
        <h3 class="text-lg font-semibold text-gray-100 mb-4">Projects</h3>
        <div v-if="projects.length === 0" class="text-gray-400">
            No projects yet. Create your first project!
        </div>
        <div v-else class="space-y-3">
            <div
                v-for="project in projects"
                :key="project.id"
                @click="handleProjectClick(project)"
                class="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200 shadow-lg"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-base font-medium text-gray-100">{{ project.name }}</h4>
                        <p class="text-sm text-gray-400 mt-1">
                            Created {{ formatDate(project.created_at) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

