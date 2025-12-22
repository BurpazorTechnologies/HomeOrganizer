<?php

namespace App\Services\Api\Admin;

use App\Models\Admin\PortfolioContactMail;
use App\Events\Admin\Contact\ContactMailReceived;
class ContactService
{

    public function __construct(protected PortfolioContactMail $portfolioContactMail)
    {}

    public function sendMail(string $from, string $name, string $subject, string $message, array $additionalDetails = []): bool
    {
        $mailSender = $from;
        $mailSenderName = $name;
        $mailReceiver = config('contact.contact_email_receiver');
        $mailSubject = $subject;
        $mailMessage = $message;

        $portfolioContactMail = $this->portfolioContactMail->create([
            'sender_email' => $mailSender,
            'sender_name' => $mailSenderName,
            'receiver_email' => $mailReceiver,
            'subject' => $mailSubject,
            'message' => $mailMessage,
            'additional_details' => $additionalDetails,
        ]); 

        event(new ContactMailReceived($portfolioContactMail));

        return true;
    }
}
