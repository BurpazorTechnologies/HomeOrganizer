<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import TestNotificationListener from '@/Pages/Utility/Websockets/TestNotificationListener.vue';
import api from '@/Services/api';

const isLoading = ref(false);
const lastResponse = ref<{ message?: string; data?: unknown } | null>(null);
const error = ref<string | null>(null);

const triggerReverb = async () => {
    isLoading.value = true;
    error.value = null;
    lastResponse.value = null;

    try {
        const response = await api.get('/utility/reverb');
        lastResponse.value = response.data;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'Failed to trigger Reverb broadcast';
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <Head title="Utility - Reverb Websockets">
        <link rel="icon" type="image/png" href="/assets/img/_shared/burpazor-tech-logo.svg" />
    </Head>

    <div class="bg-slate-950 text-slate-100 min-h-screen font-[Inter]">
        <div class="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <header class="mb-12">
                <p class="text-sm uppercase tracking-[0.2em] text-emerald-400 mb-2">Utility Suite</p>
                <h1 class="text-3xl sm:text-4xl font-semibold text-white">WebSocket Testing</h1>
                <p class="mt-3 text-slate-400 max-w-3xl">
                    Test WebSocket connections and realtime event broadcasting via Laravel Reverb.
                </p>
            </header>

            <div class="space-y-8">
                <!-- Reverb Broadcast Section -->
                <section>
                    <div class="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-lg shadow-black/30 backdrop-blur">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h2 class="text-xl font-semibold text-white">Reverb Broadcast</h2>
                                <p class="text-sm text-slate-400 mt-1">Trigger a test event to verify broadcasting is working</p>
                            </div>
                            <span class="text-xs font-semibold rounded-md px-2 py-1 bg-slate-800 text-slate-300">
                                GET
                            </span>
                        </div>

                        <div class="mt-6">
                            <button
                                @click="triggerReverb"
                                :disabled="isLoading"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                            >
                                <svg
                                    v-if="isLoading"
                                    class="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    ></circle>
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                <span>{{ isLoading ? 'Broadcasting...' : 'Trigger Broadcast' }}</span>
                            </button>
                        </div>

                        <div v-if="lastResponse" class="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p class="text-sm font-medium text-emerald-300 mb-2">Response:</p>
                            <pre class="text-xs text-slate-300 overflow-x-auto">{{ JSON.stringify(lastResponse, null, 2) }}</pre>
                        </div>

                        <div v-if="error" class="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-800">
                            <p class="text-sm font-medium text-red-300">Error:</p>
                            <p class="text-xs text-red-400 mt-1">{{ error }}</p>
                        </div>

                        <p class="mt-4 text-[11px] text-slate-500 break-words">
                            /utility/reverb
                        </p>
                    </div>
                </section>

                <!-- Notification Listener Section -->
                <section>
                    <div class="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-lg shadow-black/30 backdrop-blur">
                        <div class="mb-4">
                            <h2 class="text-xl font-semibold text-white">Notification Listener</h2>
                            <p class="text-sm text-slate-400 mt-1">Listen for realtime notifications on the utility.reverb channel</p>
                        </div>
                        <TestNotificationListener />
                    </div>
                </section>
            </div>

            <footer class="mt-16 border-t border-slate-800 pt-6 text-slate-500 text-sm">
                <span>Debug middleware enforced: <span class="font-semibold text-white">local</span></span>
            </footer>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>