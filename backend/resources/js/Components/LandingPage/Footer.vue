<script setup lang="ts">
import navigationModel from '@/Models/NavigationLink';
import Version from "@/Components/_Shared/Sections/Version.vue";
import Copyright from "@/Components/LandingPage/Footer/Copyright.vue";

const navigationLinks = navigationModel.links;
</script>

<template>
    <footer class="bg-gray-900 border-t border-gray-800">
        <div class="container mx-auto px-4 pt-8 pb-4">
            <div class="flex flex-col justify-between items-center">
                <div class="mb-4 md:mb-0">
                    <p class="body text-complementary-light mt-2">Full Stack Developer |
                        <span class="text-primary-variant-light">Laravel Vue Expert</span>
                    </p>
                </div>
                <div class="text-center md:text-right">
                    <Copyright />
                    <div class="flex justify-center md:justify-end space-x-6 mt-4">
                        <a v-for="(link, index) in navigationLinks"
                           :key="index"
                           :href="link.href"
                           class="small text-gray-400 hover:text-indigo-400 transition-colors">
                            {{ link.label }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <Version />
    </footer>
</template>

<style scoped>

</style>
