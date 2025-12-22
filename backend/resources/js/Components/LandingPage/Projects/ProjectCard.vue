<script setup lang="ts">
import TechStackTag from "@/Components/LandingPage/Projects/TechStackTag.vue";
import {Technology} from "@/Types/LandingPage/Projects/Technology";

defineProps<{
    title: string;
    description: string;
    technologies: Technology[];
    githubUrl?: string;
    detailsUrl?: string;
    projectImage?: string;
}>();
</script>

<template>
    <div class="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-shadow flex flex-col">
        <div class="h-48 bg-gray-700 flex items-center justify-center">
            <slot name="image">
                <!-- Show project image if available, otherwise show placeholder -->
                <img v-if="projectImage" :src="projectImage" :alt="title" class="h-full w-full object-cover">
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                </svg>
            </slot>
        </div>
        <div class="p-6 flex flex-col flex-grow">
            <div class="flex sm:flex-col items-center mb-4">
                <h3 class="h3 text-complementary-light">{{ title }}</h3>
            </div>
            <p class="body mb-6 font-jetbrains-mono text-surface-content" v-html="description">
            </p>
        </div>
        <div class="px-6 pb-6">
            <div class="flex flex-wrap gap-2 mb-4">
                <TechStackTag
                    v-for="(tech, index) in technologies"
                    :key="index"
                    :name="tech.name"
                    :color="tech.color"
                    :bgColor="tech.bgColor"
                />
            </div>
            <div class="flex items-center justify-between">
                <a v-if="detailsUrl" :href="detailsUrl" class="text-complementary-light hover:text-complementary transition-colors flex items-center">
                    <span>View Details</span>
                </a>
                <a v-if="githubUrl" :href="githubUrl" class="text-gray-400 hover:text-white">
                    <i class="fa-solid fa-code"></i>
                </a>
            </div>
        </div>
    </div>
</template>
