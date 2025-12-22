<script setup lang="ts">
import { Link } from '@inertiajs/vue3';

interface Props {
    post: {
        slug: string;
        title: string;
    };
    headingLevel?: 'h2' | 'h3' | 'h4';
}

const props = withDefaults(defineProps<Props>(), {
    headingLevel: 'h2'
});
</script>

<template>
    <Link 
        :href="`/blog/${post.slug}`"
        class="group block"
    >
        <article class="bg-surface-light p-6 rounded-lg border border-primary-variant hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
            <component 
                :is="headingLevel"
                class="text-xl font-semibold text-primary-light group-hover:text-primary transition-colors duration-300"
            >
                {{ post.title }}
            </component>
            <div class="mt-4 text-neutral-accent-light">
                Read more →
            </div>
        </article>
    </Link>
</template> 