const CLIENT_COOKIE_KEY = 'tracking_client_uuid';
const SESSION_STORAGE_KEY = 'tracking_session_uuid';
const SESSION_COOKIE_KEY = 'tracking_session_uuid';
const CLIENT_COOKIE_TTL_DAYS = 730; // roughly two years

class TrackingCookieService {
    static getClientUuid(): string | null {
        if (typeof document === 'undefined') return null;

        let clientUuid = this.readCookie(CLIENT_COOKIE_KEY);

        if (!clientUuid) {
            clientUuid = this.generateUuid();
            this.writeCookie(CLIENT_COOKIE_KEY, clientUuid, CLIENT_COOKIE_TTL_DAYS);
        }

        return clientUuid;
    }

    static getSessionUuid(): string | null {
        if (typeof window === 'undefined') return null;

        if (typeof window.sessionStorage !== 'undefined') {
            let sessionUuid = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (!sessionUuid) {
                sessionUuid = this.generateUuid();
                window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionUuid);
            }
            return sessionUuid;
        }

        if (typeof document === 'undefined') return null;

        let sessionUuid = this.readCookie(SESSION_COOKIE_KEY);
        if (!sessionUuid) {
            sessionUuid = this.generateUuid();
            this.writeCookie(SESSION_COOKIE_KEY, sessionUuid);
        }
        return sessionUuid;
    }

    private static readCookie(key: string): string | null {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`));
        if (!match) return null;
        const [, value] = match.split('=');
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }

    private static writeCookie(key: string, value: string, ttlDays?: number) {
        if (typeof document === 'undefined') return;

        const encodedValue = encodeURIComponent(value);
        let cookie = `${key}=${encodedValue}; path=/; SameSite=Lax`;

        if (this.isSecureContext()) {
            cookie += '; Secure';
        }

        if (typeof ttlDays === 'number') {
            const expires = new Date();
            expires.setTime(expires.getTime() + ttlDays * 24 * 60 * 60 * 1000);
            cookie += `; Expires=${expires.toUTCString()}`;
        }

        document.cookie = cookie;
    }

    private static isSecureContext(): boolean {
        if (typeof window === 'undefined' || typeof window.location === 'undefined') {
            return false;
        }

        return window.location.protocol === 'https:';
    }

    private static generateUuid(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        // RFC 4122 variant 1, version 4 UUID template (bits 12-15 = 0100, bits 6-7 = 10)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}

export default TrackingCookieService;


