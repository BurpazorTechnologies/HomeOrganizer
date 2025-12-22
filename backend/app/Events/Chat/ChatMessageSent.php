<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(
        public string $from,    // "guest" | "admin" | "client"
        public string $message, // content
        public string $sent_at, // ISO string for UI
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('utility.chat');
    }

    public function broadcastAs(): string
    {
        return 'chat.message';
    }
}
