<?php

namespace App\Jobs\Tracking;

use App\Services\Api\Tracking\TrackingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecordEvent implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array{
     *     client_uuid:string,
     *     session_uuid:string,
     *     event_name:string,
     *     payload?:array|null,
     *     ip_address:string,
     *     user_agent:string|null
     * }  $trackingData
     */
    public function __construct(protected array $trackingData)
    {
        $this->trackingData['payload'] = $this->trackingData['payload'] ?? [];
    }

    public function handle(TrackingService $trackingService): void
    {
        $trackingService->recordEvent($this->trackingData);
    }
}
