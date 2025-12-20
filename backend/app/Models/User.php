<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends BaseModel
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'string',
        ];
    }

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->attributes['first_name'] ?? null,
            $this->attributes['last_name'] ?? null,
        ]);

        return trim(implode(' ', $parts));
    }

    public function getNameAttribute(): string
    {
        return $this->full_name;
    }
}
