<script setup lang="ts">

defineProps<{
    favicon: string;
    url: string;
    name: string;
    bgClass?: string;
    hoverClass?: string;
    iconClass?: string;
}
>();

</script>

<template>
    <a
        :href="url"
        :aria-label="name"
        class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"f
        :class="[bgClass || 'bg-primary-variant', hoverClass || 'hover:primary-variant-focus']"
    >
        <i :class="favicon" class="w-auto h-auto text-3xl"></i>
    </a>
</template>
