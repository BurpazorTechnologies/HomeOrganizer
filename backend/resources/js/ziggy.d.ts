declare global {
    interface Window {
        Ziggy: {
            routes: Record<string, string>;
            url: string;
            port: number | null;
            defaults: Record<string, any>;
            location: string;
        };
    }
}

export {};
