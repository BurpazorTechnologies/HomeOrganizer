<script setup>
import { ref } from 'vue';

const searchQuery = ref('');

const performSearch = () => {
  if (searchQuery.value.trim()) {
    console.log(searchQuery.value);
  }
};
</script>

<template>
  <div class="relative">
    <input
        v-model="searchQuery"
        type="text"
        placeholder="Search..."
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="performSearch"
    />
    <button
        @click="performSearch"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
    >
      <!-- Magnifying Glass Icon -->
      <span class="fa fa-magnifying-glass">
      </span>
    </button>
  </div>
</template>
<style scoped>
</style>
