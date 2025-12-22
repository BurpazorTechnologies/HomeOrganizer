<script setup lang="ts">
defineProps<{
    favicon: string;
    value: string;
    iconBgClass?: string;
    iconColor?: string;
    textColor?: string;
}>();
</script>

<template>
    <div class="flex items-center">
        <div
            class="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
            :class="iconBgClass || 'bg-primary-variant bg-opacity-20'"
        >
            <i class="text-xl" :class="favicon"></i>
        </div>
        <span :class="textColor || 'text-gray-300'">{{ value }}</span>
    </div>
</template>
