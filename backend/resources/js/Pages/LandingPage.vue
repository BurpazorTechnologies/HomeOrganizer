<script setup lang="ts">
import {Head} from '@inertiajs/vue3';
import Hero from '@/Components/LandingPage/Hero.vue';
import About from '@/Components/LandingPage/About.vue';
import Footer from '@/Components/LandingPage/Footer.vue';
import Header from '@/Components/LandingPage/Header.vue';
import Skills from '@/Components/LandingPage/Skills.vue';
import Contacts from '@/Components/LandingPage/Contacts.vue';
import Projects from '@/Components/LandingPage/Projects.vue';
</script>

<template>
    <Head title="Winzor Paelmo | Full Stack Developer">
        <link rel="icon" type="image/png" href="/assets/img/_shared/homeorganizer-tech-logo.svg"/>
    </Head>
    <div id="landing-page" class="bg-surface min-h-100">
        <Header/>
        <Hero/>
        <About/>
        <Skills/>
        <Projects/>
        <Contacts/>
        <Footer/>
    </div>
</template>

<style>

</style>
