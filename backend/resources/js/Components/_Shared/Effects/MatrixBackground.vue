<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number;
let drops: number[] = [];

const initMatrix = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴ';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 20;
    const columns = Math.floor(canvas.width / fontSize);

    const activeColumns = columns;      // use all columns
    const columnSpacing = 1;            // no spacing multiplier
    drops = Array(activeColumns).fill(1);

    let lastFrameTime = 0;
    const frameDelay = 100;

    const draw = (currentTime: number) => {
        if (currentTime - lastFrameTime < frameDelay) {
            animationFrameId = requestAnimationFrame(draw);
            return;
        }
        lastFrameTime = currentTime;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.font = `${fontSize}px arial`;

        for (let i = 0; i < drops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
            ctx.shadowBlur = 8;
            ctx.fillText(text, x, y);
            ctx.shadowBlur = 0;

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) {
                drops[i] = 0;
            }

            drops[i]++;
        }

        animationFrameId = requestAnimationFrame(draw);
    };

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    draw(0);
};

const handleResize = () => {
    initMatrix(); // re-initialize on resize
};

onMounted(() => {
    initMatrix();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
</script>

<template>
    <canvas
        ref="canvasRef"
        class="fixed inset-0 w-screen h-screen -z-10 block"
    ></canvas>
</template>
