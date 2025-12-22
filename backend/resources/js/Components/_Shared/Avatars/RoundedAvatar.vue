<script setup lang="ts">
defineProps<{
    src: string;
    alt: string;
    containerClass?: string;
    imgClass?: string;
}>();
</script>

<template>
    <div :class="[
            'rounded-full bg-opacity-20 border border-solid border-1',
            containerClass || 'bg-primary-variant-focus border-secondary-content max-w-80'
        ]">
        <img :src="src" :alt="alt"
             :class="[
                'w-auto h-auto object-contain rounded-full',
                imgClass
             ]" />
    </div>
</template>

<style scoped>

</style>
