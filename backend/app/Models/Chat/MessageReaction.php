<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReaction extends Model
{
    use HasFactory;
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'message_reactions';

    protected $fillable = [
        'message_id',
        'conversation_id',
        'room_id',
        'user_id',
        'emoji',
        'skin_tone',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    /**
     * Get the message this reaction belongs to
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Conversation helper relation
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Room helper relation
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the user who added this reaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by emoji
     */
    public function scopeByEmoji($query, string $emoji)
    {
        return $query->where('emoji', $emoji);
    }

    /**
     * Scope to filter by skin tone variant
     */
    public function scopeBySkinTone($query, string $skinTone)
    {
        return $query->where('skin_tone', $skinTone);
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
     * Get reaction count for a specific emoji on a message
     */
    public static function getEmojiCount(string $messageId, string $emoji): int
    {
        return static::where('message_id', $messageId)
            ->where('emoji', $emoji)
            ->count();
    }

    /**
     * Get all emojis used on a message with their counts
     */
    public static function getEmojiCounts(string $messageId): array
    {
        return static::where('message_id', $messageId)
            ->selectRaw('emoji, COUNT(*) as count')
            ->groupBy('emoji')
            ->pluck('count', 'emoji')
            ->toArray();
    }
}
