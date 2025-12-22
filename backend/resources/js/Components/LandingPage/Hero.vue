<script setup lang="ts">
import RoundedAvatar from "@/Components/_Shared/Avatars/RoundedAvatar.vue";
import TypingText from "@/Components/_Shared/Animations/TypingText.vue";
import { useScrollTo } from "@/Composables/useScrollTo";

const { scrollToElement } = useScrollTo();

const scrollToContact = () => {
    scrollToElement('contact');
};

const scrollToProjects = () => {
    scrollToElement('projects');
};
</script>

<template>
    <section id="hero" class="font-roboto container min-h-screen flex pt-28">
        <div class="my-auto flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div class="md:w-1/2 text-center md:text-left">
                <h1 class="h1 text-primary-content">
                    <TypingText 
                        text="Full Stack Developer"
                        :speed="0.05"
                        :delay="0.5"
                        class="block"
                    />
                    <br>
                    <TypingText 
                        text="Laravel Expert"
                        :speed="0.05"
                        :delay="2"
                        class="text-primary-light block py-2"
                    />
                </h1>
                <p class="font-jetbrains-mono body text-primary-content my-4">
                    Turning complex problems into elegant, efficient solutions.
                </p>
                <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-center md:justify-start">
                    <button @click="scrollToProjects" class="btn-primary w-50 sm:w-40 mx-auto md:mx-2">
                        View Projects
                    </button>
                    <button @click="scrollToContact" class="btn-primary-outline w-50 sm:w-40 mx-auto md:mx-2">
                        Let's Connect
                    </button>
                </div>
            </div>
            <div class="mx-auto w-3/4 md:w-1/2 flex justify-center py-10">
                <RoundedAvatar src="/assets/img/landing_page/hero/1.png" alt="Winzor Paelmo Avatar 1" />
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">

</style>
