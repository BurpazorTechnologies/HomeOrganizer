<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $connection = 'pgsql';
    protected $table = 'messages';

    protected $fillable = [
        'conversation_id',
        'room_id',
        'user_id',
        'recipient_id',
        'parent_id',
        'content',
        'meta',
        'mentions',
        'context',
        'type',
        'state',
        'client_reference',
        'is_pinned',
        'is_flagged',
        'delivered_at',
        'seen_at',
        'edited_at',
        'expires_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'mentions' => 'array',
        'context' => 'array',
        'is_pinned' => 'boolean',
        'is_flagged' => 'boolean',
        'delivered_at' => 'datetime',
        'seen_at' => 'datetime',
        'edited_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the conversation this message belongs to
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the room this message belongs to
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the user who sent this message
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Optional direct recipient (for 1:1 delivery)
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Get the parent message (for replies/threads)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'parent_id');
    }

    /**
     * Get the replies to this message
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'parent_id');
    }

    /**
     * Get the reactions to this message
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * Get the attachments for this message
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Get the read receipts for this message
     */
    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    /**
     * Scope to filter by message type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter text messages
     */
    public function scopeText($query)
    {
        return $query->where('type', 'text');
    }

    /**
     * Scope to filter system messages
     */
    public function scopeSystem($query)
    {
        return $query->where('type', 'system');
    }

    /**
     * Scope to filter file messages
     */
    public function scopeFiles($query)
    {
        return $query->where('type', 'file');
    }

    /**
     * Scope to filter image messages
     */
    public function scopeImages($query)
    {
        return $query->where('type', 'image');
    }

    /**
     * Scope to filter pinned messages
     */
    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope to filter flagged messages
     */
    public function scopeFlagged($query)
    {
        return $query->where('is_flagged', true);
    }

    /**
     * Scope to filter by delivery state
     */
    public function scopeByState($query, string $state)
    {
        return $query->where('state', $state);
    }

    /**
     * Scope to filter only root messages (no replies)
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to filter replies (has parent)
     */
    public function scopeReplies($query)
    {
        return $query->whereNotNull('parent_id');
    }

    /**
     * Scope to filter messages within a specific room
     */
    public function scopeInRoom($query, string $roomId)
    {
        return $query->where('room_id', $roomId);
    }
}
