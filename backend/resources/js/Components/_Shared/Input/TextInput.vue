<script setup>
const props = defineProps({
    id: String,
    type: {
        type: String,
        default: 'text',
    },
    modelValue: String,
    readonly: Boolean,
    required: Boolean,
    autocomplete: String,
});

const emit = defineEmits(['update:modelValue']);

</script>

<template>
    <input
        :id="id"
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        class="text-primary-content"
    />
</template>
