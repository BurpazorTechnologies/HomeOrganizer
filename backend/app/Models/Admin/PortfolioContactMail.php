<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PortfolioContactMail extends Model
{
    protected $table = 'portfolio_contact_mail';
    
    use HasFactory;

    protected $fillable = [
        'sender_email',
        'receiver_email',
        'sender_name',
        'subject',
        'message',
        'additional_details',
    ];

    protected $casts = [
        'additional_details' => 'array',
    ];
} 