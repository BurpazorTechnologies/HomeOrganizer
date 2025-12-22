<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $connection = 'pgsql';
    protected $table = 'conversations';

    protected $fillable = [
        'title',
        'slug',
        'is_group',
        'room_type',
        'visibility',
        'status',
        'owner_id',
        'last_message_id',
        'avatar_url',
        'topic',
        'settings',
        'archived_at',
        'locked_at',
    ];

    protected $casts = [
        'is_group' => 'boolean',
        'settings' => 'array',
        'archived_at' => 'datetime',
        'locked_at' => 'datetime',
        'owner_id' => 'integer',
    ];

    /**
     * Get the participants in this conversation
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class, 'conversation_id');
    }

    /**
     * Get the messages in this conversation
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'conversation_id');
    }

    /**
     * Chat room metadata for this conversation
     */
    public function room(): HasOne
    {
        return $this->hasOne(Room::class, 'conversation_id');
    }

    /**
     * Owner of the conversation (if assigned)
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Last message reference
     */
    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    /**
     * Get the users participating in this conversation
     */
    public function users(): HasManyThrough
    {
        return $this->hasManyThrough(
            User::class,
            ConversationParticipant::class,
            'conversation_id',
            'id',
            'id',
            'user_id'
        );
    }

    /**
     * Scope to filter by group conversations
     */
    public function scopeGroups($query)
    {
        return $query->where('is_group', true);
    }

    /**
     * Scope to filter by direct conversations
     */
    public function scopeDirect($query)
    {
        return $query->where('is_group', false);
    }

    /**
     * Scope to filter conversations visible publicly
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    /**
     * Scope to filter active conversations
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
