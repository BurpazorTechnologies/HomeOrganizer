<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { JwtConfig } from '@/Types/Utility/RBAC/jwt/Types';

const props = defineProps<{
    jwtToken: string | null;
    jwtConfig: JwtConfig;
}>();

const emit = defineEmits<{
    (e: 'token-updated', token: string): void;
}>();

// JWT Token (editable for testing tampering)
const jwtTokenInput = ref<string>('');
const jwtTokenTextarea = ref<HTMLTextAreaElement | null>(null);

const autoResizeTextarea = (): void => {
    if (jwtTokenTextarea.value) {
        jwtTokenTextarea.value.style.height = 'auto';
        jwtTokenTextarea.value.style.height = jwtTokenTextarea.value.scrollHeight + 'px';
    }
};

// JWT Storage helpers
const getJwtToken = (): string | null => {
    return jwtTokenInput.value || sessionStorage.getItem('jwt_token');
};

const setJwtToken = (token: string): void => {
    sessionStorage.setItem('jwt_token', token);
    jwtTokenInput.value = token;
    emit('token-updated', token);
};

// JWT Secret Key (editable for testing)
const jwtSecretKey = ref(props.jwtConfig.secret_key);
const jwtAlgorithm = ref(props.jwtConfig.algorithm);

// JWT Decryption
const decryptedJwt = ref<any>(null);
const showDecrypted = ref(false);
const decryptError = ref<string | null>(null);
const signatureValid = ref<boolean | null>(null);

const decryptJwt = async (): Promise<void> => {
    const token = getJwtToken();
    if (!token || !token.trim()) {
        alert('Please enter a JWT token');
        return;
    }

    decryptError.value = null;
    decryptedJwt.value = null;
    showDecrypted.value = false;
    signatureValid.value = null;

    try {
        // First, decode the payload (doesn't need key - JWT payload is just base64 encoded, NOT encrypted)
        const decoded = jwtDecode(token);
        decryptedJwt.value = decoded;
        showDecrypted.value = true;
        
        // Then verify signature on backend if key is provided
        if (jwtSecretKey.value) {
            try {
                await axios.post('/api/utility/rbac/jwt/verify-signature', {
                    token: token,
                    secret_key: jwtSecretKey.value,
                    algorithm: jwtAlgorithm.value,
                });
                signatureValid.value = true;
                decryptError.value = null;
            } catch (verifyError: any) {
                signatureValid.value = false;
                if (axios.isAxiosError(verifyError) && verifyError.response?.status === 422) {
                    decryptError.value = 'Signature verification failed - the secret key does not match. The payload above is decoded (anyone can decode it), but the signature is invalid.';
                } else {
                    decryptError.value = 'Failed to verify signature: ' + (verifyError?.response?.data?.message || verifyError?.message || 'Unknown error');
                }
            }
        } else {
            signatureValid.value = null;
        }
    } catch (error) {
        decryptError.value = 'Failed to decode JWT: ' + (error instanceof Error ? error.message : 'Unknown error');
        showDecrypted.value = false;
        signatureValid.value = null;
    }
};

// Watch for token input changes and emit updates
const handleTokenInput = (): void => {
    autoResizeTextarea();
    const token = jwtTokenInput.value || sessionStorage.getItem('jwt_token');
    if (token) {
        emit('token-updated', token);
    }
};

// Store JWT token from props on mount
onMounted(() => {
    if (props.jwtToken) {
        setJwtToken(props.jwtToken);
    } else {
        const stored = sessionStorage.getItem('jwt_token');
        if (stored) {
            jwtTokenInput.value = stored;
        }
    }
    setTimeout(() => {
        autoResizeTextarea();
    }, 100);
});

// Expose getJwtToken for parent component
defineExpose({
    getJwtToken,
});
</script>

<template>
    <section class="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-semibold text-white">JWT Token</h2>
                <p class="text-sm text-slate-400">
                    JWT token (editable for testing tampering). Click "Decrypt JWT" to view decoded payload and verify signature.
                </p>
            </div>
        </div>

        <div class="space-y-4">
            <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div class="mb-2 text-xs uppercase tracking-wide text-slate-500">JWT Token</div>
                <textarea
                    ref="jwtTokenTextarea"
                    v-model="jwtTokenInput"
                    @input="handleTokenInput"
                    placeholder="Enter or paste JWT token here"
                    class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-300 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none overflow-hidden"
                ></textarea>
                <p class="mt-2 text-xs text-slate-500">
                    Editable for testing tampering. Modify the token and verify signature to test security.
                </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div class="mb-2 text-xs uppercase tracking-wide text-slate-500">JWT Secret Key</div>
                    <input
                        v-model="jwtSecretKey"
                        type="text"
                        placeholder="Enter JWT secret key"
                        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-300 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p class="mt-2 text-xs text-slate-500">
                        Editable for testing malformed keys. Default: {{ props.jwtConfig.secret_key }}
                    </p>
                </div>
                <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div class="mb-2 text-xs uppercase tracking-wide text-slate-500">Algorithm</div>
                    <div class="font-mono text-sm text-slate-300">
                        {{ props.jwtConfig.algorithm }}
                    </div>
                </div>
            </div>

            <button
                @click="decryptJwt"
                class="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
                Decrypt JWT
            </button>

            <div v-if="signatureValid === true" class="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
                <div class="mb-2 text-xs uppercase tracking-wide text-green-400">Signature Status</div>
                <div class="text-sm text-green-300">✓ Signature is valid - JWT is authentic</div>
            </div>

            <div v-if="decryptError" class="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
                <div class="mb-2 text-xs uppercase tracking-wide text-red-400">Signature Verification Failed</div>
                <div class="text-sm text-red-300">{{ decryptError }}</div>
                <div class="mt-2 text-xs text-red-400/80">
                    Note: JWT payload is base64-encoded (not encrypted), so anyone can decode it. The signature proves authenticity.
                </div>
            </div>

            <div v-if="showDecrypted && decryptedJwt" class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div class="mb-2 flex items-center justify-between">
                    <div class="text-xs uppercase tracking-wide text-slate-500">Decoded JWT Payload</div>
                    <div v-if="signatureValid === null" class="text-xs text-amber-400">
                        ⚠ Decoded without verification (no key provided)
                    </div>
                </div>
                <div class="mb-2 text-xs text-slate-400">
                    This payload is base64-encoded, not encrypted. Anyone can decode it without the secret key.
                </div>
                <pre class="overflow-x-auto text-xs text-slate-300">{{ JSON.stringify(decryptedJwt, null, 2) }}</pre>
            </div>
        </div>
    </section>
</template>

