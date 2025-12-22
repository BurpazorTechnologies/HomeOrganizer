<?php

namespace App\Http\Controllers\Api\Tracking;

use App\Events\Tracking\EventTracked;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingEventController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_uuid' => ['required', 'uuid'],
            'session_uuid' => ['required', 'uuid'],
            'event_name' => ['required', 'string', 'max:255'],
            'payload' => ['nullable', 'array'],
        ]);

        event(new EventTracked(
            clientUuid: $validated['client_uuid'],
            sessionUuid: $validated['session_uuid'],
            eventName: $validated['event_name'],
            payload: $validated['payload'] ?? [],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        ));

        return response()->json([
            'status' => 'queued',
        ], 202);
    }
}