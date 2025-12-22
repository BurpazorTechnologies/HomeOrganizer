import api, { initCsrf } from '@/Services/api';

export default class TrackingEventService {
    static async store(payload: Record<string, unknown>): Promise<void> {
        try {
            await initCsrf();

            await api.post(
                route('api.v1.tracking.event.store'),
                payload,
            );
        } catch (error: any) {
            console.error('TrackingEventService Error:', error.response?.data?.message || error.message);
            throw error;
        }
    }
}