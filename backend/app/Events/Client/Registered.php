<?php

namespace App\Events\Client;

use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Auth\Authenticatable;

class Registered
{
    use SerializesModels;

    /**
     * The authenticated user.
     *
     * @var \Illuminate\Contracts\Auth\Authenticatable
     */
    public $user;

    public bool $mustVerifyByEmail;

    /**
     * Create a new event instance.
     *
     * @param  \Illuminate\Contracts\Auth\Authenticatable  $user
     * @return void
     */
    public function __construct(Authenticatable $user, bool $mustVerifyByEmail = true)
    {
        $this->user = $user;
        $this->mustVerifyByEmail = $mustVerifyByEmail;
    }
}
