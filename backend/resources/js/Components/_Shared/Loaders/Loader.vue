<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    show?: boolean;
}>();

watch(() => props.show, (isVisible) => {
    document.body.style.overflow = isVisible ? 'hidden' : '';
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<template>
    <div v-if="show" class="fixed inset-0 bg-white/10 backdrop-blur-[2px] z-50 flex justify-center items-center">
        <div class="flex justify-center items-center">
            <div
                :class="[
                    'animate-spin rounded-full border-4 border-gray-200',
                    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6',
                    color ? `border-${color}` : 'border-primary-variant'
                ]"
                style="border-top-color: transparent;"
            ></div>
        </div>
    </div>
</template>
