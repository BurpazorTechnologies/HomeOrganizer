<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted } from 'vue';

const props = withDefaults(defineProps<{
    customClass?: string
}>(), {
    customClass: 'text-xs text-neutral-accent-light'
});

const version = ref('');

onMounted(async () => {
    try {
        const response = await axios.get('/api/version');
        if (response.status === 200) {
            version.value = response.data.version;
        } else {
            version.value = "0.1.0"; // default ui version
        }
    } catch (error) {
        console.error('Failed to fetch version:', error);
    }
});
</script>

<template>
    <span v-if="version" :class="customClass">v{{ version }}</span>
</template> 