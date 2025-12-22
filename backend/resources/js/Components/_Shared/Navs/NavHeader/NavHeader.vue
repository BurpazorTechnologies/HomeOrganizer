<script setup lang="ts">
import { ref } from 'vue';
import type {Link} from "@/Types/_Shared/Link";

defineProps<{
    navigationLinks: Link[];
}>();

const isOpen = ref(false);

const toggleMenu = () => {
    isOpen.value = !isOpen.value;
};
</script>

<template>
    <div class="font-jetbrains-mono fixed top-0 bg-surface-50 w-full z-99">
        <!-- Logo and Button container -->
        <div class="w-full flex md:hidden" :class="{ 'border-b-1 border-primary': !isOpen }">
            <span class="w-24 p-2">
                <img src="/assets/img/_shared/homeorganizer-tech-logo-white.svg" :style="{ transform: isOpen ? 'scaleX(1)' : 'scaleX(-1)' }" alt="HomeOrganizer logo"/>
            </span>
            <!-- Hamburger Button -->
            <button @click="toggleMenu" class="p-4 focus:outline-none ml-auto">
                <!-- Hamburger Icon -->
                <svg v-if="!isOpen" class="w-6 h-6 text-surface-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <!-- Close Icon (x) -->
                <svg v-else class="w-6 h-6 text-surface-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <nav class="py-4 border-b-1 border-primary md:flex-row md:space-x-20 md:justify-center md:flex lg:space-x-20"
             :class="[
                isOpen ? 'flex flex-col items-center' : 'hidden',
             ]">
            <a
                v-for="(link, index) in navigationLinks"
                :key="index"
                :href="link.href"
                class="block py-2 text-xl hover:text-primary-focus active:text-primary-light text-surface-content transition-colors"
            >
                {{ link.label }}
            </a>
        </nav>
    </div>
</template>

<style scoped lang="scss">

</style>
