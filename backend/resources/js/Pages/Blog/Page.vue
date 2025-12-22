<script setup>
import { Link } from '@inertiajs/vue3';
import DefaultBlogLayout from '@/Layouts/Blog/DefaultBlogLayout.vue';
import MatrixBackground from '@/Components/_Shared/Effects/MatrixBackground.vue';

defineProps({
    html: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    breadcrumbs: {
        type: Array,
        required: true
    },
    posts: {
        type: Array,
        required: true
    },
    currentPath: {
        type: String,
        required: true
    }
});
</script>

<template>
    <div class="relative min-h-screen">
        <MatrixBackground />
        <DefaultBlogLayout :posts="posts" :current-path="currentPath">
            <!-- Breadcrumbs -->
            <nav class="blog-breadcrumbs text-surface-content">
                <ol class="flex flex-col sm:flex-row sm:items-center p-0 m-0 list-none">
                    <li>
                        <Link href="/blog">Blog</Link>
                    </li>
                    <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center p-0 m-0">
                        <span class="mx-2">/</span>
                        <Link
                            :href="crumb.url"
                            :class="{ 'text-primary-light font-medium': index === breadcrumbs.length - 1 }"
                        >
                            {{ crumb.label }}
                        </Link>
                    </li>
                </ol>
            </nav>

            <!-- Content -->
            <article class="blog-article">
                <h1>{{ title }}</h1>
                <div v-html="html" />
            </article>
        </DefaultBlogLayout>
    </div>
</template>

<style lang="scss" scoped>

</style>
