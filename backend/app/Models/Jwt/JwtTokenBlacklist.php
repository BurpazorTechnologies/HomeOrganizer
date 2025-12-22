<?php

namespace App\Models\Jwt;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JwtTokenBlacklist extends Model
{
    use HasFactory;

    protected $table = 'jwt_tokens_blacklist';

    protected $fillable = [
        'token_type',
        'jti',
        'token_hash',
        'service',
        'context',
        'guard',
        'subject_type',
        'subject_id',
        'subject_connection',
        'reason',
        'blacklisted_at',
        'expires_at',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'blacklisted_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}

