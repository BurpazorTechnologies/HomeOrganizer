<?php

namespace App\Events\Admin\Contact;

use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Auth\Authenticatable;
use App\Models\Admin\PortfolioContactMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ContactMailReceived implements ShouldQueue
{
    use SerializesModels, InteractsWithQueue;

    public function __construct(public PortfolioContactMail $portfolioContactMail)
    {
    }
    
}
