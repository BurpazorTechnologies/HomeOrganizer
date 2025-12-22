<script setup lang="ts">
const startYear = 2018;
const currentYear = new Date().getFullYear();
const yearsOfExperience = currentYear - startYear;
</script>

<template>
    <span class="text-complementary-light">
    with {{ yearsOfExperience }}+ Years Experience
    </span>
</template>
