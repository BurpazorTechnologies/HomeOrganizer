<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    use HasFactory;

    protected $connection = 'pgsql';
    protected $table = 'users';

    protected $fillable = [
        'email',
        'password',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the conversation participants for this user
     */
    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /**
     * Get the messages sent by this user
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the message reactions by this user
     */
    public function messageReactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * Get the message reads by this user
     */
    public function messageReads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    /**
     * Get the conversations this user participates in
     */
    public function conversations()
    {
        return $this->belongsToMany(
            Conversation::class,
            'conversation_participants',
            'user_id',
            'conversation_id'
        )->withPivot(['role', 'last_read_at', 'prefs'])
         ->withTimestamps();
    }

    /**
     * Rooms this user participates in
     */
    public function rooms()
    {
        return $this->belongsToMany(
            Room::class,
            'conversation_participants',
            'user_id',
            'room_id'
        )
        ->whereNotNull('conversation_participants.room_id')
        ->withPivot([
            'role',
            'status',
            'joined_at',
            'last_read_at',
            'prefs',
            'permissions',
        ])
        ->withTimestamps();
    }

    /**
     * Rooms created by this user (convenience access)
     */
    public function createdRooms(): HasMany
    {
        return $this->hasMany(Room::class, 'created_by');
    }
}
