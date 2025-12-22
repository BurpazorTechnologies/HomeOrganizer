import axios from 'axios';

const api = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
    withCredentials: true,
});

let csrfInitPromise: Promise<void> | null = null;

export const initCsrf = async (): Promise<void> => {
    if (hasCsrfCookie()) {
        return;
    }

    if (!csrfInitPromise) {
        csrfInitPromise = axios
            .get('/sanctum/csrf-cookie', { withCredentials: true })
            .then(() => undefined)
            .catch((error) => {
                console.error('Failed to initialize CSRF:', error);
                throw error;
            })
            .finally(() => {
                csrfInitPromise = null;
            });
    }

    return csrfInitPromise;
};

function hasCsrfCookie(): boolean {
    if (typeof document === 'undefined') return false;
    return document.cookie.split('; ').some((row) => row.startsWith('XSRF-TOKEN='));
}

export default api;
