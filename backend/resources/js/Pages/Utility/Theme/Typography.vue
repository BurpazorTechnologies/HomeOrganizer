<script setup lang="ts">
import {ref} from 'vue';
import {Head} from '@inertiajs/vue3';

const fonts = [
    'font-montserrat',
    'font-roboto',
    'font-nunito-sans',
    'font-jetbrains-mono',
    'font-coral-pixels-light', // for dark background
    'font-coral-pixels' // for light background
];

const activeFont = ref(fonts[0]);

</script>

<template>
    <Head title="Typography Component">
        <link rel="icon" type="image/png" href="/assets/img/_shared/homeorganizer-tech-logo.svg"/>
    </Head>
    <div class="bg-surface min-h-[100vh] py-4 w-full">
        <div class="text-center space-x-2 my-4">
            <button
                v-for="font in fonts"
                :key="font"
                :class="['px-4 py-2 rounded border', font, activeFont === font ? 'bg-primary text-white' : 'bg-surface-content text-surface']"
                @click="activeFont = font"
            >
                {{ font.replace('font-', '').replace('-', ' ') }}
            </button>
        </div>

        <div :class="['headers', activeFont]">
            <div class="my-4">
                <h1 class="h1 text-surface-content text-center">
                    The quick brown fox jumps over the lazy dog
                </h1>
            </div>
            <div class="my-4">
                <h2 class="h2 text-surface-content text-center">
                    The quick brown fox jumps over the lazy dog
                </h2>
            </div>
            <div class="my-4">
                <h3 class="h3 text-surface-content text-center">
                    The quick brown fox jumps over the lazy dog
                </h3>
            </div>
            <div class="my-4">
                <h4 class="h4 text-surface-content text-center">
                    The quick brown fox jumps over the lazy dog
                </h4>
            </div>
            <div class="my-4">
                <h5 class="h5 text-surface-content text-center">
                    The quick brown fox jumps over the lazy dog
                </h5>
            </div>
            <div class="my-4">
                <h6 class="h6 text-surface-content text-center">
                    The quick brown fox jumps over the lazy dog
                </h6>
            </div>
            <div class="my-8">
                <p class="body text-surface-content text-center mx-auto w-1/2">
                    Body text. Paragraph.
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus consectetur sem id aliquet aliquet.
                    Proin hendrerit velit in metus commodo lobortis. Nam posuere lectus non posuere consectetur. Maecenas
                    non maximus velit.
                    Vestibulum et nisi vitae ex tempor vehicula. Mauris sit amet feugiat leo. Fusce tristique risus sed erat
                    maximus bibendum.
                    Ut venenatis imperdiet ex, in elementum sapien congue sit amet. Nam vel urna efficitur, hendrerit felis
                    eu, mollis felis.
                </p>
            </div>
            <div class="my-8 text-center">
                <small class="small text-surface-content">
                    Less Emphasized text (small)
                </small>
            </div>
            <div class="my-8 text-center">
                <footer class="footer text-surface-content">
                    © Copyright 2025
                </footer>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.coral-pixels-light {
    font-family: 'Coral Pixels', sans-serif;
    filter: invert(1) hue-rotate(180deg);
}
</style>
