<script setup>
import { ref } from 'vue';
import Version from '@/Components/_Shared/Sections/Version.vue';
import ResponsiveSidebar from '@/Components/_Shared/Sections/ResponsiveSidebar.vue';
const props = defineProps({
    posts: {
        type: Array,
        required: true
    },
    currentPath: {
        type: String,
        required: true
    }
});

// Sidebar open state for mobile
const sidebarOpen = ref(false);
</script>

<template>
    <div class="min-h-screen bg-surface/90">
        <ResponsiveSidebar
            v-model:isOpen="sidebarOpen"
            :posts="posts"
            :currentPath="currentPath"
            width="16rem"
        />
        <!-- Main Content -->
        <main class="p-8 md:ml-64 min-h-screen">
            <div class="blog-content">
                <slot />
            </div>
        </main>
        <Version customClass="text-neutral-accent-light bg-surface" />
    </div>
</template>
