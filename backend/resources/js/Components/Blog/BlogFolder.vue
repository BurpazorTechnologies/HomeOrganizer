<script setup lang="ts">
import { ref } from 'vue';
import BlogPost from './BlogPost.vue';

interface Props {
    name: string;
    posts: Array<{
        slug: string;
        title: string;
    }>;
    subfolders: {
        [key: string]: {
            posts: Array<{
                slug: string;
                title: string;
            }>;
            subfolders: Record<string, any>;
        };
    };
    level?: number;
}

const props = withDefaults(defineProps<Props>(), {
    level: 0
});

const isExpanded = ref(false);

const formatFolderName = (name: string) => {
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

const getHeadingLevel = (level: number): 'h2' | 'h3' | 'h4' => {
    switch (level) {
        case 0: return 'h2';
        case 1: return 'h3';
        default: return 'h4';
    }
};
</script>

<template>
    <div class="mb-8" :class="{ 'ml-8': level > 0 }">
        <div class="flex items-center gap-2 mb-4">
            <button 
                @click="isExpanded = !isExpanded"
                class="text-primary-variant hover:text-primary transition-colors duration-300"
                :aria-expanded="isExpanded"
            >
                <svg 
                    class="w-5 h-5 transform transition-transform duration-300"
                    :class="{ 'rotate-90': isExpanded }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
            <component 
                :is="getHeadingLevel(level)"
                class="text-xl font-semibold text-primary-variant"
            >
                {{ formatFolderName(name) }}
            </component>
        </div>

        <div 
            v-show="isExpanded"
            class="space-y-6 transition-all duration-300 ease-in-out"
            :class="{ 'opacity-0': !isExpanded, 'opacity-100': isExpanded }"
        >
            <!-- Posts in this folder -->
            <div v-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BlogPost 
                    v-for="post in posts" 
                    :key="post.slug"
                    :post="post"
                    :heading-level="getHeadingLevel(level + 1)"
                />
            </div>

            <!-- Subfolders -->
            <BlogFolder
                v-for="(subfolder, subfolderName) in subfolders"
                :key="subfolderName"
                :name="String(subfolderName)"
                :posts="subfolder.posts"
                :subfolders="subfolder.subfolders"
                :level="level + 1"
            />
        </div>
    </div>
</template>

<style scoped>
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}
</style> 