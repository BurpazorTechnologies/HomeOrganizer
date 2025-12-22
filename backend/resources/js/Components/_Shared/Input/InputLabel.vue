<script setup>
defineProps({
    value: {
        type: String,
    },
});
</script>

<template>
    <label class="text-primary-content whitespace-nowrap">
        <span v-if="value">{{ value }}</span>
        <span v-else><slot /></span>
    </label>
</template>
