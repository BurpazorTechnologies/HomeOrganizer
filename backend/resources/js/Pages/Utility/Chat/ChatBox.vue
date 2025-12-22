<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useEchoChannel } from '@/Composables/useEchoChannel';

type Message = {
    from: 'guest' | 'admin';
    message: string;
    sent_at: string;
};

const props = defineProps<{
    role: 'guest' | 'admin' | 'client';
}>();

const messages = ref<Message[]>([]);
const input = ref<string>('');

function append(msg: Message) {
    messages.value.push(msg);
    requestAnimationFrame(() => {
        const el = document.getElementById('chat-scroll');
        if (el) el.scrollTop = el.scrollHeight;
    });
}

async function send() {
    const msg = input.value?.trim();
    if (!msg) return;

    input.value = '';

    try {
        await axios.post(route('utility.chat.send'), {
            from: props.role,
            message: msg,
        });
        // controller returns 204, nothing else happens here
    } catch (err) {
        console.error('Failed to send message:', err);
    }
}

useEchoChannel<Message>(
    'utility.chat',
    '.chat.message',
    (e) => {
        append(e);
    }
);
</script>

<template>
    <div class="max-w-xl mx-auto p-4 space-y-3">
        <div class="text-sm text-gray-500">
            Role: <span class="font-semibold uppercase">{{ role }}</span>
        </div>

        <div id="chat-scroll" class="h-64 overflow-y-auto border rounded-lg p-3 space-y-2 bg-white">
            <div
                v-for="(m, idx) in messages"
                :key="idx"
                class="flex"
                :class="m.from === role ? 'justify-end' : 'justify-start'"
            >
                <div
                    class="max-w-[80%] rounded-xl px-3 py-2 text-sm"
                    :class="m.from === role ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'"
                >
                    <div class="text-[10px] opacity-70 mb-1">
                        {{ m.from.toUpperCase() }} • {{ new Date(m.sent_at).toLocaleTimeString() }}
                    </div>
                    <div class="whitespace-pre-wrap break-words">{{ m.message }}</div>
                </div>
            </div>
        </div>

        <form @submit.prevent="send" class="flex items-center gap-2">
            <input
                v-model="input"
                type="text"
                placeholder="Type a message…"
                class="flex-1 border rounded-lg px-3 py-2 text-sm"
                autocomplete="off"
            />
            <button type="submit" class="px-3 py-2 rounded-lg text-sm border bg-gray-900 text-white">
                Send
            </button>
        </form>
    </div>
</template>

<style scoped lang="scss">
#chat-scroll { scroll-behavior: smooth; }
</style>
