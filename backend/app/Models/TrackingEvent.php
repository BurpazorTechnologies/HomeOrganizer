<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'event_name',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function session()
    {
        return $this->belongsTo(TrackingSession::class, 'session_id');
    }
}


