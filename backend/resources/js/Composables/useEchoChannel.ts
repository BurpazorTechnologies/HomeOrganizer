import { onMounted, onBeforeUnmount } from 'vue';
import { listenOn } from '@/Lib/echo';

export function useEchoChannel<T = any>(
    channelName: string,
    eventName: string,
    handler: (payload: T) => void | Promise<void>,
) {
    let unsubscribe: null | (() => void) = null;

    onMounted(() => {
        unsubscribe = listenOn<T>(channelName, eventName, handler);
    });

    onBeforeUnmount(() => {
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    });

    return {
        stop: () => { if (unsubscribe) { unsubscribe(); unsubscribe = null; } },
    };
}
