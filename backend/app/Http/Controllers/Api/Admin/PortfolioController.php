<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Http\Controllers\Controller;
use App\Services\Api\Admin\PortfolioService;
use App\Http\Requests\Api\Admin\Portfolio\ResumeUploadRequest;

class PortfolioController extends Controller
{
    public function __construct(protected PortfolioService $portfolioService)
    {
    }

    public function uploadResume(ResumeUploadRequest $request): JsonResponse
    {
        $file = $request->file('file');

        if (!$this->portfolioService->storeResume($file)) {
            return response()->json([
                'message' => 'resume upload failed. please try again.',
                'success' => false
            ], 400);
        }

        return response()->json([
            'message' => 'resume upload successfully.',
            'success' => true
        ], 201);
    }

    public function getResume(): JsonResponse|StreamedResponse
    {
        $fileUserId = config('portfolio.resume_user_id');

        $resumeFile = $this->portfolioService->getResumeByUserId($fileUserId);

        if (!$resumeFile) {
            return response()->json([
                'message' => 'Resume not found.',
                'success' => false
            ], 404);
        }

        if (!$this->portfolioService->fileExistsInStorage($resumeFile)) {
            return response()->json([
                'message' => 'Resume file not found in storage.',
                'success' => false
            ], 404);
        }

        return $this->portfolioService->getDownloadResponse($resumeFile);
    }
}
