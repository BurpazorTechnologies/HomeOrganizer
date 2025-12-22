<?php

namespace App\Listeners\Tracking;

use App\Events\Tracking\EventTracked;
use App\Jobs\Tracking\RecordEvent;

class QueueEventRecording
{
    public function handle(EventTracked $event): void
    {
        RecordEvent::dispatch([
            'client_uuid' => $event->clientUuid,
            'session_uuid' => $event->sessionUuid,
            'event_name' => $event->eventName,
            'payload' => $event->payload,
            'ip_address' => $event->ipAddress,
            'user_agent' => $event->userAgent,
        ]);
    }
}

