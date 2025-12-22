<?php

namespace App\Services\Api\Tracking;

use App\Models\TrackingClient;
use App\Models\TrackingEvent;
use App\Models\TrackingSession;
use Illuminate\Support\Carbon;

class TrackingService
{
    /**
     * Persist a tracking event by ensuring the client and session exist and recording the event payload.
     *
     * @param  array{
     *     client_uuid:string,
     *     session_uuid:string,
     *     event_name:string,
     *     payload?:array|null,
     *     ip_address:string,
     *     user_agent:string|null
     * }  $data
     */
    public function recordEvent(array $data): void
    {
        $data['payload'] = $data['payload'] ?? [];

        $client = $this->storeClient($data['client_uuid'], $data['user_agent']);

        $session = $this->storeSession(
            $client,
            $data['session_uuid'],
            $data['ip_address'],
            $data['user_agent']
        );

        TrackingEvent::create([
            'session_id' => $session->id,
            'event_name' => $data['event_name'],
            'payload' => $data['payload'],
        ]);
    }

    protected function storeClient(string $clientUuid, ?string $userAgent): TrackingClient
    {
        $client = TrackingClient::firstOrCreate(
            ['client_uuid' => $clientUuid],
            [
                'user_agent' => $userAgent,
                'expires_at' => $this->clientExpiry(),
            ],
        );

        if ($client->wasRecentlyCreated === false) {
            $client->user_agent = $userAgent ?? $client->user_agent;
            $client->expires_at = $this->clientExpiry();
            $client->save();
        }

        return $client;
    }

    protected function storeSession(
        TrackingClient $client,
        string $sessionUuid,
        string $ipAddress,
        ?string $userAgent,
    ): TrackingSession {
        $session = TrackingSession::firstOrCreate(
            ['session_uuid' => $sessionUuid],
            [
                'client_id' => $client->id,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ],
        );

        if ($session->client_id !== $client->id) {
            $session->client()->associate($client);
        }

        $session->ip_address = $ipAddress;
        $session->user_agent = $userAgent;

        if ($session->isDirty(['client_id', 'ip_address', 'user_agent'])) {
            $session->save();
        }

        return $session;
    }

    protected function clientExpiry(): Carbon
    {
        return Carbon::now()->addDays(730);
    }
}
