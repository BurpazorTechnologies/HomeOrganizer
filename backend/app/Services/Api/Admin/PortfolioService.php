<?php

namespace App\Services\Api\Admin;

use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\FileUpload;

class PortfolioService
{
    private const PATH = 'portfolio/resume';
    private const DISK = 'public';

    public function __construct(protected FileUpload $fileUpload)
    {
    }

    public function storeResume(UploadedFile $file): FileUpload
    {
        $userId = Auth::id();
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $filePath = Storage::disk(self::DISK)->putFileAs(self::PATH, $file, $filename);

        $existingFile = $this->fileUpload
            ->where('user_id', $userId)
            ->where('file_category', 'portfolio')
            ->where('file_path', 'like', self::PATH . '/%')
            ->first();

        if ($existingFile) {
            if (Storage::disk(self::DISK)->exists($existingFile->file_path)) {
                Storage::disk(self::DISK)->delete($existingFile->file_path);
            }

            $existingFile->update([
                'file_path' => $filePath,
                'file_name' => pathinfo($filePath, PATHINFO_BASENAME),
                'original_file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_at' => Carbon::now(),
            ]);

            $existingFile->refresh();

            return $existingFile;
        }

        $uploadedFile = $this->fileUpload->create([
            'user_id' => $userId,
            'file_path' => $filePath,
            'file_name' => pathinfo($filePath, PATHINFO_BASENAME),
            'original_file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
            'file_category' => 'portfolio',
            'file_size' => $file->getSize(),
            'uploaded_at' => Carbon::now(),
        ]);

        return $uploadedFile;
    }

    public function getResumeByUserId(int $userId): ?FileUpload
    {
        return $this->fileUpload
            ->where('user_id', $userId)
            ->where('file_category', 'portfolio')
            ->where('file_path', 'like', self::PATH . '/%')
            ->latest('uploaded_at')
            ->first();
    }

    public function fileExistsInStorage(FileUpload $fileUpload): bool
    {
        return Storage::disk(self::DISK)->exists($fileUpload->file_path);
    }

    public function getDownloadResponse(FileUpload $fileUpload): StreamedResponse
    {
        return Storage::disk(self::DISK)->download(
            $fileUpload->file_path,
            $fileUpload->original_file_name,
            [
                'Content-Type' => $fileUpload->file_type,
                'Content-Disposition' => 'inline; filename="' . $fileUpload->original_file_name . '"'
            ]
        );
    }
}
