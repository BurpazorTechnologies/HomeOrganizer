<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;
    use HasUuids;

    protected $connection = 'pgsql';

    protected $table = 'chat_rooms';

    protected $fillable = [
        'conversation_id',
        'code',
        'room_type',
        'access',
        'status',
        'max_participants',
        'requires_approval',
        'created_by',
        'updated_by',
        'allowed_roles',
        'options',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'allowed_roles' => 'array',
        'options' => 'array',
        'requires_approval' => 'boolean',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'max_participants' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    /**
     * Underlying conversation thread
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    /**
     * Participants scoped to this room (via pivot)
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class, 'room_id');
    }

    /**
     * Messages inside this room
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'room_id');
    }

    /**
     * Room creator helper (uses chat user model)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Room updater helper relation
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope: only public rooms
     */
    public function scopePublic($query)
    {
        return $query->where('access', 'public');
    }

    /**
     * Scope: only rooms that allow a specific role
     */
    public function scopeAllowsRole($query, string $role)
    {
        return $query->whereJsonContains('allowed_roles', $role);
    }
}

