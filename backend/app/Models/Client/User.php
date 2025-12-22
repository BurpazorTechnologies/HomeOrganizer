<?php

namespace App\Models\Client;

use App\Models\UserInformation;
use App\Notifications\Client\VerifyEmail as ClientVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    protected $table = 'users';
    
    private const CLIENT_ROLE_NAME = 'client';

    use HasFactory, HasApiTokens, HasRoles, Notifiable, SoftDeletes;

    protected string $guard_name = 'client';

    protected $fillable = [
        'email',
        'password',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected static function booted()
    {
        static::created(function (self $user) {
            $user->assignRole(config('user.defaults.client.role'));
            $user->createToken('default');
            $user->save();
        });
    }

    public function userInformation(): HasOne
    {
        return $this->hasOne(UserInformation::class, 'user_id', 'id');
    }

    public function isClient(): bool
    {
        return $this->hasRole(self::CLIENT_ROLE_NAME);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new ClientVerifyEmail());
    }
}
