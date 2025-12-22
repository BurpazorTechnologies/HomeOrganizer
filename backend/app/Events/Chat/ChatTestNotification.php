<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
class ChatTestNotification implements ShouldBroadcast
{
    use SerializesModels;

    public array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('utility.chat');
    }

    public function broadcastAs(): string
    {
        return 'chat.test-notification';
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
