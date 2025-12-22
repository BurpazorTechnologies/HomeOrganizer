<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TesterResponse } from '@/Types/Utility/RBAC/axios/TesterResponse';

const props = defineProps<{
    title: string;
    permission: string;
    guard: string;
    description: string;
    fetcher: () => Promise<TesterResponse>;
}>();

const loading = ref(false);
const response = ref<TesterResponse | null>(null);
const errorMessage = ref<string | null>(null);

const features = computed(() => response.value?.features ?? []);

const handleCheck = async (): Promise<void> => {
    loading.value = true;
    errorMessage.value = null;

    try {
        response.value = await props.fetcher();
    } catch (error) {
        response.value = null;
        errorMessage.value =
            error instanceof Error ? error.message : 'Unable to verify this permission right now.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <article class="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg shadow-black/30">
        <header class="mb-4 flex items-start justify-between gap-4">
            <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">Permission probe</p>
                <h3 class="text-lg font-semibold text-white">
                    {{ title }}
                </h3>
                <p class="text-sm text-slate-400">
                    {{ description }}
                </p>
            </div>
            <span
                class="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
            >
                {{ guard }} guard
            </span>
        </header>

        <div class="mb-4 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300">
            {{ permission }}
        </div>

        <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            @click="handleCheck"
            :disabled="loading"
        >
            <svg
                v-if="loading"
                class="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>
            <span>{{ loading ? 'Checking…' : 'Check permission' }}</span>
        </button>

        <div
            v-if="response || errorMessage"
            class="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300"
        >
            <template v-if="response">
                <p :class="response.granted ? 'text-emerald-300' : 'text-red-300'">
                    {{ response.message }}
                </p>
                <p class="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    Echoed permission: {{ response.permission ?? 'n/a' }}
                </p>
                <div v-if="features.length" class="mt-3 space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Related features
                    </p>
                    <ul class="space-y-2">
                        <li
                            v-for="feature in features"
                            :key="feature.key"
                            class="rounded border border-slate-800/80 px-3 py-2"
                        >
                            <p class="text-sm font-semibold text-white">
                                {{ feature.label }}
                            </p>
                            <p class="text-xs text-slate-400">
                                {{ feature.summary }}
                            </p>
                        </li>
                    </ul>
                </div>
            </template>
            <template v-else-if="errorMessage">
                <p class="text-red-300">
                    {{ errorMessage }}
                </p>
            </template>
        </div>
    </article>
</template>

