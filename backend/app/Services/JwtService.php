<?php

namespace App\Services;

use App\Models\Jwt\JwtLongToken;
use App\Models\Jwt\JwtShortToken;
use App\Models\Jwt\JwtTokenBlacklist;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Model as EloquentModel;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use InvalidArgumentException;

class JwtService
{
    private string $serviceName;
    private array $serviceConfig;
    private array $blacklistConfig;
    private array $storageConfig;

    public function __construct(?string $serviceName = null, ?array $configOverrides = null)
    {
        $this->blacklistConfig = Config::get('jwt.blacklist', [
            'enabled' => false,
            'store' => Config::get('cache.default'),
            'prefix' => 'jwt:blacklist:',
        ]);

        $this->serviceName = $serviceName ?? Config::get('jwt.default_service', 'lab');
        $this->serviceConfig = $this->resolveServiceConfig($this->serviceName, $configOverrides ?? []);
        $this->storageConfig = array_merge([
            'persist_short_tokens' => true,
            'persist_long_tokens' => true,
            'persist_blacklist' => true,
            'hash_algo' => 'sha256',
        ], Config::get('jwt.storage', []));

        JWT::$leeway = Config::get('jwt.leeway', 0);
    }

    public function forService(string $serviceName, array $overrides = []): self
    {
        $clone = clone $this;
        $clone->serviceName = $serviceName;
        $clone->serviceConfig = $this->resolveServiceConfig($serviceName, $overrides);

        return $clone;
    }

    public function generateToken(Authenticatable|array $subject, array $claims = [], array $headers = [], array $options = []): array
    {
        $tokenType = $options['token_type'] ?? 'short';
        $context = $options['context'] ?? $this->serviceName;
        $guard = $options['guard'] ?? null;

        if ($tokenType === 'long' && ! isset($claims['ttl'])) {
            $claims['ttl'] = Arr::get($this->serviceConfig, 'refresh_ttl', $this->serviceConfig['ttl'] ?? 60);
        }

        $claims = array_merge([
            'token_type' => $tokenType,
            'context' => $context,
        ], $claims);

        if ($guard) {
            $claims['guard'] = $guard;
        }

        $payload = $this->buildClaims($subject, $claims);
        $tokenHeaders = $this->buildHeaders($headers);

        $token = JWT::encode(
            $payload,
            $this->serviceConfig['secret_key'],
            $this->serviceConfig['algorithm'],
            $tokenHeaders['kid'] ?? null,
            $tokenHeaders
        );

        $envelope = [
            'token' => $token,
            'payload' => $payload,
            'header' => $tokenHeaders,
            'expires_at' => Carbon::createFromTimestamp($payload['exp'])->toIso8601String(),
            'service' => $this->serviceName,
            'type' => $tokenType,
            'context' => $context,
            'guard' => $guard,
        ];

        $this->persistIssuedToken($envelope, $subject, $options);

        return $envelope;
    }

    public function issueTokenPair(
        Authenticatable|array $subject,
        array $claims = [],
        array $headers = [],
        array $options = []
    ): array {
        $short = $this->generateToken($subject, $claims, $headers, array_merge($options, [
            'token_type' => 'short',
        ]));

        $longClaims = array_merge($claims, [
            'ttl' => Arr::get($this->serviceConfig, 'refresh_ttl', $this->serviceConfig['refresh_ttl'] ?? 60),
        ]);

        $long = $this->generateToken($subject, $longClaims, $headers, array_merge($options, [
            'token_type' => 'long',
            'linked_jti' => $short['payload']['jti'],
            'family' => $options['family'] ?? $short['payload']['jti'],
        ]));

        return [
            'short' => $short,
            'long' => $long,
        ];
    }

    public function decodeToken(string $token, bool $validateExpiration = true, bool $skipBlacklistCheck = false): array
    {
        $decoded = JWT::decode(
            $token,
            new Key($this->serviceConfig['secret_key'], $this->serviceConfig['algorithm'])
        );

        $payload = $this->toArray($decoded);

        if (! $skipBlacklistCheck) {
            $this->assertNotBlacklisted($token, $payload);
        }

        if ($validateExpiration) {
            $this->assertNotExpired($payload);
        }

        return $payload;
    }

    public function validateToken(string $token): array
    {
        try {
            $payload = $this->decodeToken($token);

            return [
                'valid' => true,
                'payload' => $payload,
                'expires_at' => Carbon::createFromTimestamp($payload['exp'])->toIso8601String(),
            ];
        } catch (\Throwable $exception) {
            return [
                'valid' => false,
                'reason' => $exception->getMessage(),
            ];
        }
    }

    public function refreshToken(string $token, array $claims = [], array $headers = []): array
    {
        $payload = $this->decodeToken($token, validateExpiration: false);
        $this->assertWithinRefreshWindow($payload);

        $subject = $payload['user'] ?? ['sub' => $payload['sub'] ?? null];
        $carryOver = Arr::except(
            $payload,
            ['iss', 'aud', 'iat', 'nbf', 'exp', 'jti', 'context', 'user']
        );

        return $this->generateToken(
            $subject,
            array_merge($carryOver, $claims),
            $headers,
            [
                'context' => $payload['context'] ?? $this->serviceName,
                'token_type' => $claims['token_type'] ?? 'short',
                'linked_jti' => $payload['jti'] ?? null,
            ]
        );
    }

    public function invalidateToken(string $token, ?string $reason = null): void
    {
        $payload = $this->decodeToken($token, validateExpiration: false, skipBlacklistCheck: true);
        $tokenType = $payload['token_type'] ?? 'short';

        $this->markTokenRevoked($payload['jti'] ?? null, $tokenType, $reason);
        $this->storeBlacklistEntry($token, $payload, $reason);

        if ($this->blacklistConfig['enabled'] ?? false) {
            $seconds = max(1, ($payload['exp'] ?? now()->timestamp) - now()->timestamp);
            $this->cacheStore()->put($this->blacklistKey($token), true, $seconds);
        }
    }

    public function isBlacklisted(string $token, array $payload = []): bool
    {
        $cacheEnabled = $this->blacklistConfig['enabled'] ?? false;

        if ($cacheEnabled && (bool) $this->cacheStore()->get($this->blacklistKey($token), false)) {
            return true;
        }

        if (! $this->shouldPersistBlacklist()) {
            return false;
        }

        $hash = $this->hashToken($token);
        $tokenType = $payload['token_type'] ?? 'short';

        return JwtTokenBlacklist::query()
            ->where('token_type', $tokenType)
            ->where(function ($query) use ($hash, $payload) {
                $query->where('token_hash', $hash);

                if (! empty($payload['jti'])) {
                    $query->orWhere('jti', $payload['jti']);
                }
            })
            ->exists();
    }

    public function getServiceName(): string
    {
        return $this->serviceName;
    }

    /**
     * Extract JWT token from HTTP request (Authorization header)
     *
     * @param Request $request
     * @return string|null
     */
    public function extractTokenFromRequest(Request $request): ?string
    {
        $authorization = $request->header('Authorization');

        if (!$authorization) {
            return null;
        }

        // Handle "Bearer {token}" format
        if (preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
            return trim($matches[1]);
        }

        // If no Bearer prefix, assume the whole header is the token
        return trim($authorization);
    }

    /**
     * Extract roles array from JWT payload
     *
     * @param Request $request
     * @return array
     */
    public function extractRolesFromJwt(Request $request): array
    {
        $payload = $this->getJwtPayload($request);
        return $payload['roles'] ?? [];
    }

    /**
     * Get user info from JWT payload (id, email, roles, guard, context)
     *
     * @param Request $request
     * @return array|null Returns null if JWT is missing or invalid
     */
    public function getJwtUserInfo(Request $request): ?array
    {
        $payload = $this->getJwtPayload($request);

        if (!$payload) {
            return null;
        }

        $userInfo = $payload['user'] ?? [];
        $userId = $payload['sub'] ?? $userInfo['id'] ?? null;
        $userEmail = $userInfo['email'] ?? null;

        return [
            'id' => $userId,
            'email' => $userEmail,
            'roles' => $payload['roles'] ?? [],
            'guard' => $payload['guard'] ?? null,
            'context' => $payload['context'] ?? null,
            'sub' => $payload['sub'] ?? null,
        ];
    }

    /**
     * Get JWT payload from request
     *
     * @param Request $request
     * @return array|null Returns null if JWT is missing or invalid
     */
    public function getJwtPayload(Request $request): ?array
    {
        $token = $this->extractTokenFromRequest($request);

        if (!$token) {
            return null;
        }

        try {
            return $this->decodeToken($token);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function resolveServiceConfig(string $serviceName, array $overrides = []): array
    {
        $services = Config::get('jwt.services', []);
        $config = $services[$serviceName] ?? ($serviceName === 'lab' ? Config::get('lab.jwt') : null);

        if (!$config) {
            throw new InvalidArgumentException("JWT service [{$serviceName}] is not configured.");
        }

        return array_replace_recursive($config, $overrides);
    }

    private function buildClaims(Authenticatable|array $subject, array $customClaims): array
    {
        $now = Carbon::now();
        $ttl = (int) ($customClaims['ttl'] ?? $this->serviceConfig['ttl'] ?? 60);
        unset($customClaims['ttl']);
        $context = $customClaims['context'] ?? $this->serviceName;
        unset($customClaims['context']);

        $baseClaims = [
            'iss' => Arr::get($this->serviceConfig, 'default_claims.iss', Config::get('app.url')),
            'aud' => Arr::get($this->serviceConfig, 'default_claims.aud', Config::get('app.url')),
            'iat' => $now->timestamp,
            'nbf' => $now->timestamp,
            'exp' => $now->copy()->addMinutes(max(1, $ttl))->timestamp,
            'jti' => (string) Str::uuid(),
            'sub' => $this->extractSubjectId($subject),
            'context' => $context,
        ];

        if (($this->serviceConfig['include_user_payload'] ?? true) && ($normalized = $this->normalizeSubject($subject))) {
            $baseClaims['user'] = $normalized;
        }

        // Include roles in JWT payload if subject is Authenticatable and has roles
        if ($subject instanceof Authenticatable) {
            $roles = $this->extractRolesFromSubject($subject);
            if (!empty($roles)) {
                $baseClaims['roles'] = $roles;
            }
        }

        return array_merge($baseClaims, $customClaims);
    }

    private function buildHeaders(array $headers): array
    {
        $default = array_merge(
            [
                'alg' => $this->serviceConfig['algorithm'],
                'typ' => $this->serviceConfig['type'] ?? 'JWT',
            ],
            $this->serviceConfig['header'] ?? []
        );

        return array_merge($default, $headers);
    }

    private function normalizeSubject(Authenticatable|array $subject): array
    {
        if ($subject instanceof Authenticatable) {
            if ($subject instanceof Arrayable) {
                return $subject->toArray();
            }

            return ['id' => $subject->getAuthIdentifier()];
        }

        return $subject;
    }

    private function extractSubjectId(Authenticatable|array $subject): string
    {
        if ($subject instanceof Authenticatable) {
            return (string) $subject->getAuthIdentifier();
        }

        if (isset($subject['sub'])) {
            return (string) $subject['sub'];
        }

        if (isset($subject['id'])) {
            return (string) $subject['id'];
        }

        return (string) Str::uuid();
    }

    private function extractRolesFromSubject(Authenticatable $subject): array
    {
        // Check if subject has the HasRoles trait (Spatie Permission)
        if (!method_exists($subject, 'getRoleNames')) {
            return [];
        }

        try {
            // Get all role names as an array
            // Note: getRoleNames() is provided by Spatie\Permission\Traits\HasRoles
            // @phpstan-ignore-next-line
            // @psalm-suppress UndefinedMethod
            $roles = $subject->getRoleNames()->toArray();
            return $roles;
        } catch (\Throwable $e) {
            // If roles cannot be retrieved, return empty array
            return [];
        }
    }

    private function persistIssuedToken(array $tokenEnvelope, Authenticatable|array $subject, array $options = []): void
    {
        $payload = $tokenEnvelope['payload'] ?? [];
        $tokenType = $payload['token_type'] ?? 'short';

        if (! $this->shouldPersistToken($tokenType)) {
            return;
        }

        $subjectAttributes = $this->extractSubjectAttributes($subject);
        $issuedAt = Carbon::createFromTimestamp($payload['iat'] ?? now()->timestamp);
        $expiresAt = Carbon::createFromTimestamp($payload['exp'] ?? now()->timestamp);

        $data = [
            'jti' => $payload['jti'] ?? (string) Str::uuid(),
            'token_hash' => $this->hashToken($tokenEnvelope['token']),
            'service' => $tokenEnvelope['service'],
            'context' => $payload['context'] ?? $tokenEnvelope['service'],
            'guard' => $payload['guard'] ?? ($options['guard'] ?? null),
            'subject_type' => $subjectAttributes['type'],
            'subject_id' => $subjectAttributes['id'],
            'subject_connection' => $subjectAttributes['connection'],
            'subject_snapshot' => $subjectAttributes['snapshot'],
            'claims' => $payload,
            'abilities' => $payload['abilities'] ?? ($options['abilities'] ?? null),
            'issued_at' => $issuedAt,
            'expires_at' => $expiresAt,
            'meta' => $options['meta'] ?? null,
        ];

        if ($tokenType === 'long') {
            $data['linked_short_jti'] = $options['linked_jti'] ?? null;
            $data['family'] = $options['family'] ?? null;

            JwtLongToken::query()->updateOrCreate(
                ['jti' => $data['jti']],
                $data
            );
        } else {
            JwtShortToken::query()->updateOrCreate(
                ['jti' => $data['jti']],
                $data
            );
        }
    }

    private function extractSubjectAttributes(Authenticatable|array $subject): array
    {
        $type = null;
        $id = null;
        $connection = null;
        $snapshot = null;

        if ($subject instanceof EloquentModel) {
            $type = $subject::class;
            $id = $subject->getKey();
            $connection = $subject->getConnectionName();
            $snapshot = $subject instanceof Arrayable ? $subject->toArray() : ['id' => $id];
        } elseif ($subject instanceof Authenticatable) {
            $type = $subject::class;
            $id = $subject->getAuthIdentifier();
            $snapshot = ['id' => $id];
        } elseif (is_array($subject)) {
            $snapshot = $subject;
            $type = $subject['subject_type'] ?? ($subject['model'] ?? null);
            $id = $subject['subject_id'] ?? ($subject['id'] ?? null);
            $connection = $subject['subject_connection'] ?? null;
        }

        return [
            'type' => $type,
            'id' => $id,
            'connection' => $connection,
            'snapshot' => $snapshot,
        ];
    }

    private function markTokenRevoked(?string $jti, string $tokenType, ?string $reason = null): void
    {
        if (! $jti) {
            return;
        }

        $modelClass = $tokenType === 'long' ? JwtLongToken::class : JwtShortToken::class;

        if (! class_exists($modelClass)) {
            return;
        }

        $modelClass::where('jti', $jti)->update([
            'revoked_at' => now(),
            'revoked_reason' => $reason,
        ]);
    }

    private function storeBlacklistEntry(string $token, array $payload, ?string $reason = null): void
    {
        if (! $this->shouldPersistBlacklist()) {
            return;
        }

        $tokenType = $payload['token_type'] ?? 'short';
        $tokenHash = $this->hashToken($token);
        $subjectColumns = $this->resolveSubjectFromTokenStorage($payload['jti'] ?? null, $tokenType);

        JwtTokenBlacklist::updateOrCreate(
            [
                'token_type' => $tokenType,
                'jti' => $payload['jti'] ?? $tokenHash,
            ],
            [
                'token_hash' => $tokenHash,
                'service' => $payload['context'] ?? $this->serviceName,
                'context' => $payload['context'] ?? $this->serviceName,
                'guard' => $payload['guard'] ?? null,
                'subject_type' => $subjectColumns['type'],
                'subject_id' => $subjectColumns['id'],
                'subject_connection' => $subjectColumns['connection'],
                'reason' => $reason,
                'blacklisted_at' => now(),
                'expires_at' => isset($payload['exp']) ? Carbon::createFromTimestamp($payload['exp']) : null,
                'meta' => Arr::except($payload, ['user']),
            ]
        );
    }

    private function resolveSubjectFromTokenStorage(?string $jti, string $tokenType): array
    {
        $record = $this->findTokenRecordByJti($jti, $tokenType);

        if ($record instanceof EloquentModel) {
            return [
                'type' => $record->subject_type,
                'id' => $record->subject_id,
                'connection' => $record->subject_connection,
            ];
        }

        return [
            'type' => null,
            'id' => null,
            'connection' => null,
        ];
    }

    private function findTokenRecordByJti(?string $jti, string $tokenType): ?EloquentModel
    {
        if (! $jti) {
            return null;
        }

        $modelClass = $tokenType === 'long' ? JwtLongToken::class : JwtShortToken::class;

        if (! class_exists($modelClass)) {
            return null;
        }

        return $modelClass::where('jti', $jti)->first();
    }

    private function shouldPersistToken(string $tokenType): bool
    {
        return match ($tokenType) {
            'long' => (bool) ($this->storageConfig['persist_long_tokens'] ?? false),
            default => (bool) ($this->storageConfig['persist_short_tokens'] ?? false),
        };
    }

    private function shouldPersistBlacklist(): bool
    {
        return (bool) ($this->storageConfig['persist_blacklist'] ?? false);
    }

    private function hashToken(string $token): string
    {
        $algo = $this->storageConfig['hash_algo'] ?? 'sha256';

        return hash($algo, $token);
    }

    private function assertNotBlacklisted(string $token, array $payload = []): void
    {
        if ($this->isBlacklisted($token, $payload)) {
            throw new InvalidArgumentException('Token has been invalidated.');
        }
    }

    private function assertNotExpired(array $payload): void
    {
        if ($this->isExpired($payload)) {
            throw new InvalidArgumentException('Token has expired.');
        }
    }

    private function isExpired(array $payload): bool
    {
        return isset($payload['exp']) && Carbon::createFromTimestamp($payload['exp'])->isPast();
    }

    private function assertWithinRefreshWindow(array $payload): void
    {
        $refreshTtl = $this->serviceConfig['refresh_ttl'] ?? null;

        if ($refreshTtl === null) {
            throw new InvalidArgumentException('Refresh is not enabled for this JWT service.');
        }

        $issuedAt = Carbon::createFromTimestamp($payload['iat'] ?? now()->timestamp);

        if ($issuedAt->addMinutes($refreshTtl)->isPast()) {
            throw new InvalidArgumentException('Refresh window has expired.');
        }
    }

    private function toArray(mixed $data): array
    {
        return json_decode(json_encode($data, JSON_PARTIAL_OUTPUT_ON_ERROR), true) ?? [];
    }

    private function blacklistKey(string $token): string
    {
        $prefix = $this->blacklistConfig['prefix'] ?? 'jwt:blacklist:';

        return $prefix . hash('sha256', $token);
    }

    private function cacheStore()
    {
        $storeName = $this->blacklistConfig['store'] ?? Config::get('cache.default');

        return Cache::store($storeName);
    }
}

