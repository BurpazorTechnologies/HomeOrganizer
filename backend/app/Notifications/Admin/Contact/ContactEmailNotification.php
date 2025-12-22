<?php

namespace App\Notifications\Admin\Contact;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Admin\PortfolioContactMail;

class ContactEmailNotification extends Notification
{
    use Queueable;


    public function __construct()
    {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Thanks for contacting me!')
            ->view('mails.admin.contact.automated-reply', []);
    }
}
