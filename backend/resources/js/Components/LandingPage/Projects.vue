<script setup lang="ts">
import ProjectList from "@/Components/LandingPage/Projects/ProjectList.vue";
</script>

<template>
    <section id="projects" class="font-roboto container bg-surface-light mx-auto py-20">
        <div>
            <h2 class="h2 mb-12 text-center text-complementary-light">Projects & Contributions</h2>
            <ProjectList />
            <div class="text-center mt-12">
                <button
                    class="border border-complementary-light text-complementary-light hover:bg-indigo-400 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    View All Projects
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>

</style>
