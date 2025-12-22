<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class MessageAttachment extends Model
{
    use HasFactory;
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'message_attachments';

    protected $fillable = [
        'message_id',
        'conversation_id',
        'room_id',
        'name',
        'storage_disk',
        'path',
        'mime_type',
        'size_bytes',
        'hash',
        'meta',
        'visibility',
        'expires_at',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
        'meta' => 'array',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the message this attachment belongs to
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Shortcut to the parent conversation
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Shortcut to the room (if attachments are scoped)
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the full URL for the attachment
     */
    public function getUrlAttribute(): string
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($this->storage_disk);

        return $disk->url($this->path);
    }

    /**
     * Get the file size in a human-readable format
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size_bytes;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if the attachment is an image
     */
    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if the attachment is a video
     */
    public function getIsVideoAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }

    /**
     * Check if the attachment is an audio file
     */
    public function getIsAudioAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'audio/');
    }

    /**
     * Scope to filter by storage disk
     */
    public function scopeByStorageDisk($query, string $disk)
    {
        return $query->where('storage_disk', $disk);
    }

    /**
     * Scope to filter by MIME type
     */
    public function scopeByMimeType($query, string $mimeType)
    {
        return $query->where('mime_type', $mimeType);
    }

    /**
     * Scope to filter images
     */
    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    /**
     * Scope to filter videos
     */
    public function scopeVideos($query)
    {
        return $query->where('mime_type', 'like', 'video/%');
    }

    /**
     * Scope to filter audio files
     */
    public function scopeAudio($query)
    {
        return $query->where('mime_type', 'like', 'audio/%');
    }

    /**
     * Scope to filter by file size range
     */
    public function scopeSizeBetween($query, int $minSize, int $maxSize)
    {
        return $query->whereBetween('size_bytes', [$minSize, $maxSize]);
    }

    /**
     * Scope to filter by visibility level
     */
    public function scopeVisibleAs($query, string $visibility)
    {
        return $query->where('visibility', $visibility);
    }
}
