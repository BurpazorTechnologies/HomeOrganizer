<script setup lang="ts">
import NavHeader from "@/Components/_Shared/Navs/NavHeader/NavHeader.vue";
import navigationModel from '@/Models/NavigationLink';

const navigationLinks = navigationModel.links;
</script>

<template>
    <header class="bg-surface-dark">
        <NavHeader :navigationLinks="navigationLinks"/>
    </header>
</template>

<style scoped>

</style>
