<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Project;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:' . Project::class],
        ];
    }
}

