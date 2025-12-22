<script setup lang="ts">
defineProps<{
    name: string;
    color?: string;
    bgColor?: string;
}>();
</script>

<template>
  <span
      class="px-2 py-1 rounded text-xs bg-opacity-20"
      :class="[bgColor || 'bg-indigo-600', color || 'text-indigo-400']"
  >
    {{ name }}
  </span>
</template>
