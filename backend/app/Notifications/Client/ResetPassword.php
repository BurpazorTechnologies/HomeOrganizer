<?php

namespace App\Notifications\Client;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPassword extends BaseResetPassword
{
    public function resetUrl($notifiable)
    {
        if (static::$createUrlCallback) {
            return call_user_func(static::$createUrlCallback, $notifiable, $this->token);
        }

        return url(route('client.password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Reset Password')
            ->view('mails.client.reset-password', [
                'resetUrl' => $this->resetUrl($notifiable)
            ]);
    }
}
