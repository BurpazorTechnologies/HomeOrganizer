import type Echo from 'laravel-echo';

declare global {
    interface Window { Echo?: Echo }
}

export function getEcho(): Echo {
    const e = window.Echo;
    if (!e) throw new Error('[echo] window.Echo is undefined.');
    return e;
}

export function listenOn<T = any>(
    channelName: string,
    eventName: string,
    handler: (payload: T) => void | Promise<void>,
): () => void {
    const echo = getEcho();
    const channel = echo.channel(channelName);
    channel.listen(eventName, handler);
    return () => {
        channel.stopListening(eventName);
        echo.leaveChannel(channelName);
    };
}
