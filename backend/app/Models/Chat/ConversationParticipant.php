<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    use HasFactory;
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'conversation_participants';

    protected $fillable = [
        'conversation_id',
        'room_id',
        'user_id',
        'role',
        'status',
        'invited_by',
        'joined_at',
        'left_at',
        'last_read_at',
        'last_read_message_id',
        'prefs',
        'permissions',
        'notifications_enabled',
        'muted_at',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'muted_at' => 'datetime',
        'notifications_enabled' => 'boolean',
        'prefs' => 'array',
        'permissions' => 'array',
        'user_id' => 'integer',
        'invited_by' => 'integer',
    ];

    /**
     * Get the conversation this participant belongs to
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    /**
     * Associated room metadata (if applicable)
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    /**
     * Get the user who is participating
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * User who invited this participant (if tracked)
     */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Cached reference to the last read message
     */
    public function lastReadMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_read_message_id');
    }

    /**
     * Scope to filter by role
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope alias for legacy "owner" role (maps to admin)
     */
    public function scopeOwners($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope to filter by admin role (platform Admin)
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope to filter by client role
     */
    public function scopeClients($query)
    {
        return $query->where('role', 'client');
    }

    /**
     * Scope to filter by guest role
     */
    public function scopeGuests($query)
    {
        return $query->where('role', 'guest');
    }

    /**
     * Scope to filter by membership status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
