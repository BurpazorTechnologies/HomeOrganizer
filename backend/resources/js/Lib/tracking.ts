import type {
    TrackingConfig,
    TrackedEvent,
    TrackTarget,
} from '@/Config/tracking.config';
import { dispatchTrackingEvent } from '@/Services/Tracking/TrackingEventDispatcher';

type ListenerRecord = {
    event: TrackedEvent;
    target: 'document' | 'window';
    handler: (ev: Event) => void;
    options?: AddEventListenerOptions | boolean;
};

let active = false;
let listeners: ListenerRecord[] = [];
let cachedSelectors: Array<{ name: string; css: string; events: TrackedEvent[] }> = [];
let debug = false;

const EVENT_OPTIONS: Partial<Record<TrackedEvent, AddEventListenerOptions | boolean>> = {
    click: { passive: true },
    keydown: false,
    keyup: false,
    input: false,
    scroll: { passive: true },
};

function toCssSelector(t: TrackTarget): string {
    const s = t.selector;
    switch (s.type) {
        case 'id':
            return `#${CSS.escape(s.value)}`;
        case 'class':
            return `.${CSS.escape(s.value)}`;
        case 'css':
            return s.value;
    }
}

function safeMatches(el: Element, selector: string): boolean {
    try {
        return el.matches(selector);
    } catch {
        return false;
    }
}

function throttle<T extends Event>(fn: (ev: T) => void, ms: number) {
    let last = 0;
    let queued: T | null = null;
    return (ev: T) => {
        const now = performance.now();
        if (now - last >= ms) {
            last = now;
            fn(ev);
        } else {
            queued = ev;
            const delay = ms - (now - last);
            window.setTimeout(() => {
                if (queued) {
                    last = performance.now();
                    fn(queued);
                    queued = null;
                }
            }, delay);
        }
    };
}

function logEvent(payload: Record<string, unknown>) {
    console.log('[tracking]', payload);
}

function collectTrackingDataset(el: HTMLElement): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(el.dataset)) {
        if (!k.toLowerCase().startsWith('tracking')) continue;
        const raw = k.slice('tracking'.length);
        const snake = raw
            .replace(/^[A-Z]/, (m) => m.toLowerCase())
            .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        const key = snake || 'id';
        out[key] = v;
    }
    return out;
}

function resolveHit(ev: Event): {
    el: HTMLElement;
    source: 'data-attr' | 'config';
    name: string;
    css?: string | null;
    tracking: Record<string, unknown>; // collected tracking dataset
} | null {
    // composedPath for ShadowDOM safety
    const path = (ev.composedPath?.() || []) as Element[];

    const chain: HTMLElement[] =
        path.length && (path[0] as Element)?.nodeType === 1
            ? (path.filter((n) => n instanceof HTMLElement) as HTMLElement[])
            : (() => {
                const arr: HTMLElement[] = [];
                let curr = ev.target as HTMLElement | null;
                while (curr) {
                    arr.push(curr);
                    curr = curr.parentElement;
                }
                return arr;
            })();

    for (const el of chain) {
        if (!el.dataset) continue;
        const hasAnyTracking = Object.keys(el.dataset).some((k) =>
            k.toLowerCase().startsWith('tracking'),
        );
        if (hasAnyTracking) {
            const tracking = collectTrackingDataset(el);
            const name =
                (tracking.id as string) ||
                el.getAttribute('data-tracking-id') ||
                `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`;
            return { el, source: 'data-attr', name, css: null, tracking };
        }
    }

    for (const { name, css } of cachedSelectors) {
        for (const el of chain) {
            if (safeMatches(el, css)) {
                return {
                    el,
                    source: 'config',
                    name,
                    css,
                    tracking: collectTrackingDataset(el),
                };
            }
        }
    }

    return null;
}

function buildPayload(ev: Event, hit: ReturnType<typeof resolveHit> & {}) {
    const timestamp = new Date().toISOString();
    const el = hit.el;

    const base: Record<string, unknown> = {
        timestamp,
        event_type: ev.type,
        target_name: hit.name,
        selector: hit.css ?? null,
        source: hit.source, // 'data-attr' | 'config'
        tracking: hit.tracking, // { id?, label?, ... }
    };

    if (ev instanceof MouseEvent) {
        base.x = ev.clientX;
        base.y = ev.clientY;
        base.button = ev.button;
    }

    if (ev instanceof KeyboardEvent) {
        base.key = ev.key;
        base.code = ev.code;
        base.ctrl = ev.ctrlKey;
        base.shift = ev.shiftKey;
        base.alt = ev.altKey;
        base.meta = ev.metaKey;
    }

    if (ev.type === 'scroll') {
        base.scrollY = window.scrollY;
        base.scrollX = window.scrollX;
        base.viewportH = window.innerHeight;
        base.docH = document.documentElement.scrollHeight;
    }

    base.tag = el.tagName;
    base.id = el.id || null;
    base.classes = el.className || null;
    base.text = el.innerText?.trim().slice(0, 100) ?? null;

    return base;
}

function registerDelegated(event: TrackedEvent) {
    const onDoc = (ev: Event) => {
        const hit = resolveHit(ev);
        if (!hit) return;
        const payload = buildPayload(ev, hit);
        logEvent(payload);
        dispatchTrackingEvent(payload).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Tracking Dispatch Error:', message);
        });
        if (debug) {
            console.debug('[tracking:hit]', event, hit.name, hit.css, hit.el, hit.tracking);
        }
    };

    if (event === 'scroll') {
        const throttled = throttle<Event>(onDoc, 250);
        window.addEventListener('scroll', throttled, EVENT_OPTIONS.scroll ?? { passive: true });
        listeners.push({ event, target: 'window', handler: throttled, options: EVENT_OPTIONS.scroll });
        return;
    }

    document.addEventListener(event, onDoc, EVENT_OPTIONS[event] ?? false);
    listeners.push({ event, target: 'document', handler: onDoc, options: EVENT_OPTIONS[event] });
}

function computeEnabledEvents(config: TrackingConfig): TrackedEvent[] {
    const set = new Set<TrackedEvent>();
    const defaults = config.defaultEvents?.length ? config.defaultEvents : (['click'] as TrackedEvent[]);
    for (const t of cachedSelectors) for (const e of t.events) set.add(e);
    for (const e of defaults) set.add(e);
    return [...set.values()];
}


function buildSelectorCache(config: TrackingConfig) {
    cachedSelectors = (config.targets ?? []).map((t: TrackTarget) => ({
        name: t.name,
        css: toCssSelector(t),
        events: t.events && t.events.length ? t.events : (config.defaultEvents?.length ? config.defaultEvents : (['click'] as TrackedEvent[])),
    }));
}

/** Public API */
export function startTracking(config: TrackingConfig) {
    if (active) return;

    debug = !!config.debug;

    buildSelectorCache(config);

    const events = computeEnabledEvents(config);

    for (const e of events) registerDelegated(e);

    active = true;

    if (debug) console.info('[tracking] started with events:', events);
}
