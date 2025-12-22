<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageRead extends Model
{
    use HasFactory;
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'message_reads';

    protected $fillable = [
        'message_id',
        'conversation_id',
        'room_id',
        'user_id',
        'read_at',
        'status',
        'read_via',
        'context',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'context' => 'array',
    ];

    /**
     * Get the message that was read
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Conversation reference
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Room reference
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the user who read the message
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by message
     */
    public function scopeByMessage($query, string $messageId)
    {
        return $query->where('message_id', $messageId);
    }

    /**
     * Scope to filter by read date range
     */
    public function scopeReadBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('read_at', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by receipt status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
