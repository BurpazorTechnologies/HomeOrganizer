<?php

namespace App\Http\Requests\Api\Admin\Contact;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\Recaptcha;
use App\Services\RecaptchaService;

class ContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => 'required|email',
            'name' => 'required|string',
            'subject' => 'required|string',
            'message' => 'required|string',
            'recaptcha_token' => ['sometimes', 'required', 'string', new Recaptcha(app(RecaptchaService::class))]
        ];
    }
}
