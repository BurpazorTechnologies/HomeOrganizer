<?php

namespace App\Notifications\Client;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Config;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;

class VerifyEmail extends BaseVerifyEmail
{
    protected function verificationUrl($notifiable)
    {
        if (static::$createUrlCallback) {
            return call_user_func(static::$createUrlCallback, $notifiable);
        }

        return URL::temporarySignedRoute(
            'client.verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }

    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        return (new MailMessage)
            ->subject('Verify Your Email Address')
            ->view('mails.client.email-verification', [
                'firstName' => $notifiable->userInformation->first_name,
                'verificationLink' => $verificationUrl
            ]);
    }
}
