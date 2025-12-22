<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

class RecaptchaService
{
    private const RECAPTCHA_API_URL = "https://recaptchaenterprise.googleapis.com/v1/projects/%s/assessments";
    private const PROJECT_ID = "homeorganizer-1746790706580";
    private const ACTION = "CONTACT";

    private string $googleCloudApiKey;
    private string $siteKey;
    private float $minScore;

    public function __construct()
    {
        $this->googleCloudApiKey = Config::get('services.google_cloud.api_key');
        $this->siteKey = Config::get('services.recaptcha.contact.site_key');
        $this->minScore = Config::get('services.recaptcha.contact.min_score', 0.5);
    }

    public function verify(string $token): bool
    {
        if (empty($token)) {
            return false;
        }

        $apiUrl = sprintf(self::RECAPTCHA_API_URL, self::PROJECT_ID) . "?key={$this->googleCloudApiKey}";

        $payload = [
            'event' => [
                'token' => $token,
                'siteKey' => $this->siteKey,
                'expectedAction' => 'contact_send'
            ]
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post($apiUrl, $payload);

        if (config('app.debug') || app()->environment('local')) {
            Log::info('Recaptcha verification result: ' . $response->body());
        }

        if (!$response->successful()) {
            if (config('app.debug') || app()->environment('local')) {
                Log::error('Recaptcha verification failed: ' . $response->body());
            }
            return false;
        }

        $result = $response->json();

        $isValid =
            isset($result['tokenProperties']) &&
            isset($result['riskAnalysis']) &&

            $result['tokenProperties']['valid'] === true &&

            $result['tokenProperties']['action'] === self::ACTION &&

            $result['riskAnalysis']['score'] >= $this->minScore;

        if (!$isValid || app()->environment('local')) {
            Log::info('Recaptcha validation failed details:', [
                'token_valid' => $result['tokenProperties']['valid'] ?? 'missing',
                'action' => $result['tokenProperties']['action'] ?? 'missing',
                'expected_action' => self::ACTION,
                'score' => $result['riskAnalysis']['score'] ?? 'missing',
                'min_score' => $this->minScore,
            ]);
        }

        return $isValid;
    }
}
