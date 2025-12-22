<?php

namespace App\Traits\Client;

trait HandlesUserSessionActivityKeys
{
    public function setUserAchievedNewLevel(): void
    {
        session()->flash('user_achieved_new_level', true);
    }

    public function resetUserAchievedNewLevel(): void
    {
        session()->put('user_achieved_new_level', false);
    }

    public function hasUserAchievedNewLevel(): bool
    {
        return session()->get('user_achieved_new_level', false);
    }

}
