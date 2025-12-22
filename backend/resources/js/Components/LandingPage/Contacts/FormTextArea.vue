<script setup lang="ts">

defineProps<{
    label: string;
    placeholder?: string;
    modelValue: string;
    rows?: number;
    required?: boolean;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
    <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>
        <textarea
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
            :rows="rows || 4"
            class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-indigo-500 text-white"
            :placeholder="placeholder"
            :required="required"
        ></textarea>
    </div>
</template>
