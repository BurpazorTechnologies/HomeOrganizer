<?php

namespace App\Models\Jwt;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JwtLongToken extends Model
{
    use HasFactory;

    protected $table = 'jwt_tokens_long';

    protected $fillable = [
        'jti',
        'linked_short_jti',
        'token_hash',
        'family',
        'service',
        'context',
        'guard',
        'subject_type',
        'subject_id',
        'subject_connection',
        'subject_snapshot',
        'claims',
        'abilities',
        'issued_at',
        'expires_at',
        'last_used_at',
        'revoked_at',
        'revoked_reason',
        'meta',
    ];

    protected $casts = [
        'subject_snapshot' => 'array',
        'claims' => 'array',
        'abilities' => 'array',
        'meta' => 'array',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}

