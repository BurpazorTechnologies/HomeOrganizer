<?php

namespace App\Models\Admin;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\UserInformation;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    protected $table = 'users';

    private const ADMIN_ROLE_NAME = 'admin';
    private const SUPER_ADMIN_ROLE_NAME = 'superadmin';

    use HasFactory, HasApiTokens, HasRoles, Notifiable, SoftDeletes {
        HasRoles::hasPermissionTo as protected traitHasPermissionTo;
    }

    protected string $guard_name = 'admin';

    protected $fillable = [
        'email',
        'password',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'email_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function userInformation(): HasOne
    {
        return $this->hasOne(UserInformation::class, 'user_id', 'id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->matchesSuperAdminEmail() && $this->hasRole(self::SUPER_ADMIN_ROLE_NAME);
    }

    public function isAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->hasRole(self::ADMIN_ROLE_NAME);
    }

    public function hasPermissionTo($permission, $guardName = null): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->traitHasPermissionTo($permission, $guardName);
    }

    private function matchesSuperAdminEmail(): bool
    {
        $email = strtolower((string) $this->email);
        $superAdminEmail = strtolower((string) config('user.super_admin.email', 'admin@homeorganizer.com'));

        return $email !== '' && $email === $superAdminEmail;
    }
}
