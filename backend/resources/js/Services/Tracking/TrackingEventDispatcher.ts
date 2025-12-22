import TrackingEventService from '@/Services/Tracking/TrackingEventService';
import TrackingCookieService from '@/Services/Tracking/TrackingCookieService';
import { initCsrf } from '@/Services/api';

let csrfToken: string | null = null;
let hasSyncedCsrf = false;

type NormalisedEventPayload = Record<string, unknown> & {
    client_uuid: string | null;
    session_uuid: string | null;
    event_name: string;
    payload: {
        source: string;
        properties: Record<string, unknown>;
    };
};

export async function dispatchTrackingEvent(payload: Record<string, unknown>): Promise<void> {
    const endpoint = route('api.v1.tracking.event.store');
    const requestPayload = normalisePayload(payload);

    if (!requestPayload.client_uuid || !requestPayload.session_uuid) {
        logWarning('dispatch', 'Missing tracking identifiers; aborting dispatch.');
        return;
    }

    const token = await ensureCsrfToken();
    const hasToken = typeof token === 'string' && token.length > 0;

    if (hasToken && (await sendViaFetch(endpoint, requestPayload, token))) {
        return;
    }

    if (hasToken && sendViaBeacon(endpoint, requestPayload, token)) {
        return;
    }

    await TrackingEventService.store(requestPayload);
}

function normalisePayload(payload: Record<string, unknown>): NormalisedEventPayload {
    const clientUuid = TrackingCookieService.getClientUuid();
    const sessionUuid = TrackingCookieService.getSessionUuid();
    const routeInfo = resolveRouteInfo();

    const tracking = payload.tracking as Record<string, unknown> | undefined;
    const properties = buildProperties(tracking);
    const eventDetails = buildEventDetails(payload);

    if (typeof payload.selector === 'string') properties.selector = payload.selector;
    if (typeof payload.timestamp === 'string') properties.timestamp = payload.timestamp;
    if (payload.id !== undefined) properties.element_id = payload.id;
    if (payload.classes !== undefined) properties.classes = payload.classes;
    if (payload.text !== undefined) properties.text = payload.text;
    if (Object.keys(eventDetails).length > 0) properties.event_body = eventDetails;
    if (routeInfo.href && properties.route_url === undefined) {
        properties.route_url = routeInfo.href;
    }
    if (routeInfo.path && properties.route_path === undefined) {
        properties.route_path = routeInfo.path;
    }

    return {
        client_uuid: clientUuid,
        session_uuid: sessionUuid,
        event_name: typeof payload.event_type === 'string' ? payload.event_type : 'unknown',
        payload: {
            source: typeof payload.source === 'string' ? payload.source : 'config',
            properties,
        },
    };
}

function buildProperties(tracking: Record<string, unknown> | undefined): Record<string, unknown> {
    const out: Record<string, unknown> = tracking ? { ...tracking } : {};
    delete out.page;
    delete out.page_name;
    delete out.page_section;
    delete out.section;
    return out;
}

function buildEventDetails(payload: Record<string, unknown>) {
    const details: Record<string, unknown> = {};

    if (typeof payload.selector === 'string') details.selector = payload.selector;
    if (typeof payload.target_name === 'string') details.target_name = payload.target_name;
    if (typeof payload.event_type === 'string') details.event_type = payload.event_type;
    if (typeof payload.tag === 'string') details.tag = payload.tag;
    if (typeof payload.x === 'number') details.client_x = payload.x;
    if (typeof payload.y === 'number') details.client_y = payload.y;
    if (typeof payload.button === 'number') details.mouse_button = payload.button;

    if (payload.scrollY !== undefined) {
        details.scroll = {
            scroll_y: payload.scrollY,
            scroll_x: payload.scrollX,
            viewport_h: payload.viewportH,
            document_h: payload.docH,
        };
    }

    if (payload.key !== undefined) {
        details.key = {
            key: payload.key,
            code: payload.code,
            ctrl: payload.ctrl,
            shift: payload.shift,
            alt: payload.alt,
            meta: payload.meta,
        };
    }

    return details;
}

async function sendViaFetch(
    endpoint: string,
    payload: Record<string, unknown>,
    token: string | null,
): Promise<boolean> {
    if (typeof fetch !== 'function' || !token) return false;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(payload),
            credentials: 'include',
            keepalive: true,
        });
        if (!response.ok) {
            if (response.status === 419) {
                invalidateCsrfToken();
            }
            logWarning(`fetch Status ${response.status}`, await safeResponseText(response));
            return false;
        }
        return true;
    } catch (error) {
        logWarning('fetch Error', error);
        return false;
    }
}

function sendViaBeacon(endpoint: string, payload: Record<string, unknown>, token: string | null): boolean {
    if (!token || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false;
    try {
        const body = buildBeaconBody(payload, token);
        return navigator.sendBeacon(endpoint, body);
    } catch (error) {
        logWarning('sendBeacon Error', error);
        return false;
    }
}

function buildBeaconBody(payload: Record<string, unknown>, token: string | null): BodyInit {
    const hasFormData = typeof FormData !== 'undefined';
    if (!hasFormData) {
        const data = { ...payload };
        return new Blob([JSON.stringify(data)], { type: 'application/json' });
    }

    const formData = new FormData();

    for (const [key, value] of Object.entries(payload)) {
        if (value === undefined) continue;
        formData.append(key, serializeValue(value));
    }

    return formData;
}

function serializeValue(value: unknown): string {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return JSON.stringify(value);
}

async function ensureCsrfToken(): Promise<string | null> {
    if (!hasSyncedCsrf) {
        try {
            await initCsrf();
            hasSyncedCsrf = true;
        } catch (error) {
            logWarning('initCsrf Error', error);
            return null;
        }
    }

    csrfToken = readCsrfToken();
    if (!csrfToken) {
        invalidateCsrfToken();
    }

    return csrfToken;
}

function readCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const entry = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
    if (!entry) return null;
    const [, value] = entry.split('=');
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function invalidateCsrfToken() {
    csrfToken = null;
    hasSyncedCsrf = false;
}

async function safeResponseText(response: Response): Promise<string> {
    try {
        return await response.text();
    } catch {
        return '';
    }
}

function logWarning(label: string, detail: unknown) {
    const message = detail instanceof Error ? detail.message : String(detail);
    console.warn(`TrackingEventDispatcher ${label}:`, message);
}

function resolveRouteInfo(): { href: string | null; path: string | null } {
    if (typeof window === 'undefined' || typeof window.location === 'undefined') {
        return { href: null, path: null };
    }

    const { href, pathname } = window.location;

    return {
        href: typeof href === 'string' ? href : null,
        path: typeof pathname === 'string' ? pathname : null,
    };
}


