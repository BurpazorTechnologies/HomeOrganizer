<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';

import ClientGuestLayout from '@/Layouts/Guest/ClientGuestLayout.vue';
import PrimaryButton from '@/Components/_Shared/Buttons/PrimaryButton.vue';

const props = defineProps<{
    status?: string | null;
}>();

const resendForm = useForm({});
const logoutForm = useForm({});

const resendVerification = (): void => {
    resendForm.post(route('client.verification.send'));
};

const logout = (): void => {
    logoutForm.post(route('client.logout'));
};
</script>

<template>
    <ClientGuestLayout>
        <Head title="Verify Email"/>

        <div class="space-y-6">
            <div>
                <h1 class="text-2xl font-semibold text-primary-content mb-2">Verify your email</h1>
                <p class="text-primary-content">
                    Thanks for signing up! Before getting started, please confirm your email address by clicking
                    on the link we just sent you. If you didn’t receive the email, you can request another one below.
                </p>
            </div>

            <div v-if="props.status === 'verification-link-sent'" class="p-4 bg-green-100 border border-green-400 text-green-800 rounded">
                A new verification link has been sent to the email address you provided during registration.
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton
                    type="button"
                    class="w-full sm:w-auto text-primary-content py-2 px-6 rounded-xl border-primary border-1"
                    :disabled="resendForm.processing"
                    @click="resendVerification"
                >
                    <span v-if="resendForm.processing">Sending...</span>
                    <span v-else>Resend Verification Email</span>
                </PrimaryButton>

                <PrimaryButton
                    type="button"
                    class="w-full sm:w-auto text-primary-content py-2 px-6 rounded-xl border-primary border-1"
                    :disabled="logoutForm.processing"
                    @click="logout"
                >
                    <span v-if="logoutForm.processing">Logging out...</span>
                    <span v-else>Log Out</span>
                </PrimaryButton>
            </div>
        </div>
    </ClientGuestLayout>
</template>
