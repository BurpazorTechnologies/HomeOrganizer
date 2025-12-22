<?php

namespace App\Listeners\Admin\Contact;

use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Events\Admin\Contact\ContactMailReceived;

class ForwardEmail implements ShouldQueue
{
    public function handle(ContactMailReceived $event)
    {
        $mail = $event->portfolioContactMail;

        Mail::send('mails.admin.contact.forward-mail', ['mail' => $mail], function ($message) use ($mail) {
            $message->to($mail->receiver_email)
                ->subject('[Forwarded Contact] ' . $mail->subject);
        });
    }
}