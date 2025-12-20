<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\File;

class VersionController extends Controller
{
    public function getVersion(): JsonResponse
    {
        $changelogPath = base_path('CHANGELOG.md');
        $version = '0.1.0'; // Default version 

        if (File::exists($changelogPath)) {
            $content = File::get($changelogPath);
            if (preg_match('/^## v(\d+\.\d+\.\d+)/m', $content, $matches)) {
                $version = $matches[1];
            }
        }

        return response()->json([
            'version' => $version
        ]);
    }
}
