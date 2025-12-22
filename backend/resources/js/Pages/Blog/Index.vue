<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import BlogPost from '@/Components/Blog/BlogPost.vue';
import BlogFolder from '@/Components/Blog/BlogFolder.vue';
import Version from '@/Components/_Shared/Sections/Version.vue';
import MatrixBackground from '@/Components/_Shared/Effects/MatrixBackground.vue';

const route = (window as any).route;

interface Post {
    slug: string;
    title: string;
}

const props = defineProps<{
    posts: Post[];
}>();

interface GroupedPosts {
    posts: Post[];
    subfolders: {
        [key: string]: GroupedPosts;
    };
}

const groupedPosts = computed(() => {
    const groups: GroupedPosts = {
        posts: [],
        subfolders: {}
    };

    props.posts.forEach(post => {
        const parts = post.slug.split('/');
        if (parts.length === 1) {
            // Root level post
            groups.posts.push(post);
        } else {
            // Nested post
            let currentGroup = groups;
            for (let i = 0; i < parts.length - 1; i++) {
                const folder = parts[i];
                if (!currentGroup.subfolders[folder]) {
                    currentGroup.subfolders[folder] = {
                        posts: [],
                        subfolders: {}
                    };
                }
                currentGroup = currentGroup.subfolders[folder];
            }
            currentGroup.posts.push(post);
        }
    });

    return groups;
});
</script>

<template>

    <Head title="Blog | HomeOrganizer">
        <link rel="icon" type="image/png" href="/assets/img/_shared/homeorganizer-tech-logo.svg" />
    </Head>

    <MatrixBackground />

    <div class="min-h-screen bg-surface/90">
        <Link :href="route('index')" class="block">
        <span class="w-auto h-auto">
            <img src="/assets/img/_shared/homeorganizer-tech-logo-white.svg" alt="HomeOrganizer logo"
                class="w-[70px] h-auto object-contain mx-auto">
        </span>
        </Link>
        <section class="container mx-auto py-20 px-4">
            <h1 class="h1 text-center text-primary-light mb-12">Blog Posts</h1>
            <div class="max-w-4xl mx-auto">
                <!-- Root level posts -->
                <div v-if="groupedPosts.posts.length > 0" class="mb-12">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BlogPost v-for="post in groupedPosts.posts" :key="post.slug" :post="post" />
                    </div>
                </div>

                <!-- Folders -->
                <BlogFolder v-for="(group, folder) in groupedPosts.subfolders" :key="folder" :name="String(folder)"
                    :posts="group.posts" :subfolders="group.subfolders" />
            </div>
        </section>
        <Version customClass="text-neutral-accent-light bg-surface fixed bottom-0" />
    </div>
</template>

<style lang="scss" scoped></style>
