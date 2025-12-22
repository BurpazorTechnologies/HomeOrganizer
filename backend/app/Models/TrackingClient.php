<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackingClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_uuid',
        'user_agent',
        'expires_at',
    ];

    public function sessions()
    {
        return $this->hasMany(TrackingSession::class);
    }
}


