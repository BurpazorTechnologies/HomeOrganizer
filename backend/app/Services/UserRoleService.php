<?php

namespace App\Services;

use App\Models\Admin\User as AdminUser;
use App\Models\Client\User as ClientUser;

class UserRoleService
{
    public function isEmailRegisteredAsAdmin(string $email): bool
    {
        $adminUser = AdminUser::where('email', $email)->first();
        
        return $adminUser && $adminUser->isAdmin();
    }

    public function isEmailRegisteredAsClient(string $email): bool
    {
        $clientUser = ClientUser::where('email', $email)->first();
        
        return $clientUser && $clientUser->isClient();
    }

    public function isEmailRegisteredWithAnyRole(string $email): bool
    {
        return $this->isEmailRegisteredAsAdmin($email) || $this->isEmailRegisteredAsClient($email);
    }
}
