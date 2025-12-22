<?php

namespace App\Listeners\Admin\Contact;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Events\Admin\Contact\ContactMailReceived;

class SendAutomatedMailResponse implements ShouldQueue
{
    public function handle(ContactMailReceived $event)
    {
        $mail = $event->portfolioContactMail;

        try {
            Mail::send('mails.admin.contact.automated-reply', [], function ($message) use ($mail) {
                $message->to($mail->sender_email, $mail->sender_name)
                    ->subject('Thank you for contacting us!');
            });

            $smtpConfig = [
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'username' => config('mail.mailers.smtp.username'),
                'encryption' => config('mail.mailers.smtp.encryption'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
            ];

            $details = $mail->additional_details ?? [];
            $details['automated_reply_sent'] = true;
            $details['smtp_used'] = $smtpConfig;

            $mail->additional_details = $details;
            $mail->save();
        } catch (\Exception $e) {
            Log::error('Automated reply failed for ContactMailReceived', [
                'error' => $e->getMessage(),
                'mail_id' => $mail->id ?? null,
                'sender_email' => $mail->sender_email ?? null,
            ]);
        }
    }
}
