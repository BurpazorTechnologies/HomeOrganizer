<script setup>
import { Link, usePage } from '@inertiajs/vue3';
import { defineProps } from 'vue';

const {props} = usePage();

defineProps({
    userName: {
        type: String,
        required: true
    },
    links: {
        type: Array,
        required: true
    }
});

const page = usePage();

const isActiveLink = (href) => {
    return page.url.startsWith(href);
};
</script>

<template>
    <div class="w-64 h-screen text-surface-content bg-surface-50 flex flex-col justify-between fixed w-35">
        <div>
            <div class="p-6">
                <img src="https://placehold.co/200x200" alt="Logo" class="w-24 mx-auto" />
            </div>
            <div class="px-6 py-4">
                <h6 class="h6">Welcome, {{ userName }}!</h6>
            </div>
            <nav class="px-6">
                <ul>
                    <li v-for="link in links" :key="link.text" class="mb-2">
                        <Link
                            :href="link.href"
                            class="flex items-center p-2 rounded hover:bg-primary-light hover:text-neutral-dark"
                            :class="{'bg-primary-dark': isActiveLink(link.href)}"
                        >
                            <i :class="link.icon" class="w-6 h-6 mr-3"></i>
                            <span>{{ link.text }}</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
        <div class="px-6 py-4">
            <ul>
                <li class="mt-2">
                    <Link href="/logout" method="post"
                          class="flex items-center p-2 rounded hover:bg-blue-100"
                          as="button"
                    >
                        <i class="fa-solid fa-right-from-bracket w-6 h-6 mr-3"></i>
                        <span>Log out</span>
                    </Link>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
/* Add any custom styles here */
</style>
