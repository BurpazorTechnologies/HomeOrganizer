<?php

namespace App\Http\Requests\Api\Admin\Portfolio;

use Illuminate\Foundation\Http\FormRequest;

class ResumeUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240', // 10MB max file size
            ],
        ];
    }
}
