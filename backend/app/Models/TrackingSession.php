<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'session_uuid',
        'ip_address',
        'user_agent',
    ];

    public function client()
    {
        return $this->belongsTo(TrackingClient::class);
    }

    public function events()
    {
        return $this->hasMany(TrackingEvent::class, 'session_id');
    }
}


