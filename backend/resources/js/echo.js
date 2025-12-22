import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

const echoConfig = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: window.location.hostname,
    wsPort: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
    wssPort: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
    forceTLS: window.location.protocol === 'https:',
    enabledTransports: ['ws', 'wss'],
};

console.table(echoConfig);

window.Echo = new Echo(echoConfig);
