<script setup>
import { useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';

const form = useForm({
    name: '',
});

const showDialog = ref(false);

const submit = () => {
    form.post(route('client.project.store'), {
        preserveScroll: true,
        onSuccess: () => {
            showDialog.value = false;
            form.reset();
            router.reload({ only: ['projects'] });
        },
    });
};
</script>

<template>
    <div>
        <button
            @click="showDialog = true"
            class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition ease-in-out duration-150 shadow-lg"
        >
            Create Project
        </button>

        <div
            v-if="showDialog"
            class="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
            @click.self="showDialog = false"
        >
            <div class="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-100 mb-4">Create New Project</h3>
                    <form @submit.prevent="submit">
                        <div class="mb-4">
                            <label for="name" class="block text-sm font-medium text-gray-200 mb-2">
                                Project Name
                            </label>
                            <input
                                id="name"
                                v-model="form.name"
                                type="text"
                                class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100"
                                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': form.errors.name }"
                                placeholder="Enter project name"
                                required
                            />
                            <div v-if="form.errors.name" class="mt-1 text-sm text-red-400">
                                {{ form.errors.name }}
                            </div>
                        </div>
                        <div class="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                @click="showDialog = false; form.reset()"
                                class="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="form.processing"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span v-if="form.processing">Creating...</span>
                                <span v-else>Create</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

