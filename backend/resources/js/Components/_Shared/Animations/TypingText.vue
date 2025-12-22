<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import gsap from 'gsap';

const props = defineProps<{
    text: string;
    speed?: number;
    delay?: number;
    cursorColor?: string;
}>();

const textRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const currentText = ref('');

const defaultSpeed = 0.05; // seconds per character
const defaultDelay = 0.5; // seconds before starting

const animateText = () => {
    if (textRef.value && cursorRef.value) {
        const text = textRef.value;
        const cursor = cursorRef.value;
        
        // Set initial state
        currentText.value = '';
        gsap.set(cursor, { opacity: 1 });
        
        // Create the typing animation
        const timeline = gsap.timeline();
        
        // Add each character with a delay
        for (let i = 0; i <= props.text.length; i++) {
            timeline.to(currentText, {
                value: props.text.substring(0, i),
                duration: 0,
                ease: 'none',
            }, i * (props.speed || defaultSpeed));
        }
        
        // Add cursor blink animation
        gsap.to(cursor, {
            opacity: 0,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });
        
        // Start the animation after delay
        timeline.delay(props.delay || defaultDelay);
    }
};

onMounted(() => {
    animateText();
});

// Watch for text changes
watch(() => props.text, () => {
    animateText();
});
</script>

<template>
    <div class="typing-container inline-flex items-center">
        <span ref="textRef" class="typing-text">{{ currentText }}</span>
        <span 
            ref="cursorRef" 
            class="typing-cursor ml-0.5" 
            :style="{ backgroundColor: cursorColor || 'currentColor' }"
        ></span>
    </div>
</template>

<style scoped lang="scss">
.typing-container {
    display: inline-flex;
    align-items: center;
}

.typing-cursor {
    display: inline-block;
    width: 1px;
    height: 1.2em;
    margin-left: 1px;
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    from, to { opacity: 1; }
    50% { opacity: 0; }
}
</style> 