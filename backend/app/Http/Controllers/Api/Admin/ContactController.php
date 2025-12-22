<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Http\Controllers\Controller;
use App\Services\Api\Admin\ContactService;
use App\Http\Requests\Api\Admin\Contact\ContactRequest;

class ContactController extends Controller
{
    public function __construct(protected ContactService $contactService)
    {
    }

    public function sendMail(ContactRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // simple throttlingt to show the loader icon
        sleep(1); 

        $additionalDetails = [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];
        
        $mailSent = $this->contactService->sendMail(
            $validatedData['from'], 
            $validatedData['name'], 
            $validatedData['subject'], 
            $validatedData['message'], 
            $additionalDetails
        );

        if (!$mailSent) {
            return response()->json([
                'message' => 'Mail send failed. please try again.',
                'success' => false
            ], 400);
        }

        return response()->json([
            'message' => "Thank you for reaching out. I've received your message and will get back to you shortly.",
            'success' => true
        ], 201);
    }
}
