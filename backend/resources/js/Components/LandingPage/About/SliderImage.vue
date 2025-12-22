<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    beforeImage: string;
    afterImage: string;
    beforeAlt?: string;
    afterAlt?: string;
}>();

const wrapper = ref<HTMLElement | null>(null);
const after = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);
const isActive = ref(false);

const handleMouseDown = () => {
    isActive.value = true;
    scroller.value?.classList.add('scrolling');
};

const handleMouseUp = () => {
    isActive.value = false;
    scroller.value?.classList.remove('scrolling');
};

const handleMouseMove = (e: MouseEvent) => {
    if (!isActive.value || !wrapper.value) return;
    
    const rect = wrapper.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    scrollIt(x);
};

const handleTouchStart = () => {
    isActive.value = true;
    scroller.value?.classList.add('scrolling');
};

const handleTouchEnd = () => {
    isActive.value = false;
    scroller.value?.classList.remove('scrolling');
};

const handleTouchMove = (e: TouchEvent) => {
    if (!isActive.value || !wrapper.value) return;
    
    const rect = wrapper.value.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    scrollIt(x);
};

const scrollIt = (x: number) => {
    if (!wrapper.value || !after.value || !scroller.value) return;
    
    const transform = Math.max(0, Math.min(x, wrapper.value.offsetWidth));
    after.value.style.width = `${transform}px`;
    scroller.value.style.left = `${transform - 25}px`;
};

onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    if (wrapper.value) {
        scrollIt(0);
    }
});

onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
});
</script>

<template>
    <div ref="wrapper" class="slider-wrapper">
        <!-- Before Image -->
        <div class="slider-image before">
            <img :src="beforeImage" 
                 :alt="beforeAlt || 'Before image'" 
                 class="slider-image__content"
                 draggable="false"/>
        </div>
        
        <!-- After Image -->
        <div ref="after" class="slider-image after">
            <img :src="afterImage" 
                 :alt="afterAlt || 'After image'" 
                 class="slider-image__content"
                 draggable="false"/>
        </div>
        
        <!-- Scroller -->
        <div ref="scroller" 
             class="slider-scroller"
             @mousedown="handleMouseDown"
             @touchstart="handleTouchStart">
            <svg class="slider-scroller__thumb" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <polygon points="0 50 37 68 37 32 0 50" style="fill:#fff"/>
                <polygon points="100 50 64 32 64 68 100 50" style="fill:#fff"/>
            </svg>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "tailwindcss" as *;

.slider {
    &-wrapper {
        @apply relative overflow-hidden w-75 h-120 sm:w-auto sm:h-100 xl:h-140 sm:aspect-[6/7] aspect-square;
    }

    &-image {
        @apply absolute top-0 left-0 h-full pointer-events-none;
        background-color: var(--color-surface-light);

        &.before {
            @apply w-full;
        }

        &__content {
            @apply w-full h-full object-cover;
        }
    }

    &-scroller {
        @apply absolute top-1/2 -translate-y-1/2 w-[50px] h-[50px] rounded-full cursor-pointer bg-transparent opacity-90 pointer-events-auto z-10;

        &:hover {
            @apply opacity-100;
        }

        &.scrolling {
            @apply pointer-events-none opacity-100;
        }

        &:before,
        &:after {
            content: " ";
            @apply block w-[7px] absolute left-1/2 -ml-[3.5px] z-30 transition-all duration-100 bg-white;
        }

        &:before {
            @apply top-full;
        }

        &:after {
            @apply bottom-full;
        }

        &__thumb {
            @apply w-full h-full p-[5px];
        }
    }
}
</style>
