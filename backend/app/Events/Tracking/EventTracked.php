<?php

namespace App\Events\Tracking;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EventTracked
{
    use Dispatchable;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public readonly string $clientUuid,
        public readonly string $sessionUuid,
        public readonly string $eventName,
        public readonly array $payload,
        public readonly string $ipAddress,
        public readonly ?string $userAgent,
    ) {
    }
}

