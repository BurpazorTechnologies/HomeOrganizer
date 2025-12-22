<?php

namespace App\Http\Requests\Client\Auth;

use Illuminate\Validation\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;
use App\Models\Client\User;

/**
 * @property string first_name
 * @property string last_name
 * @property string email
 * @property string password
 */
class RegisterRequest extends FormRequest
{
    protected $redirectRoute = 'client.register';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
