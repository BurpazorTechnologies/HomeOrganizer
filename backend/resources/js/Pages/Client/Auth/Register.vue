<script setup lang="ts">
import axios from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { Head, useForm } from '@inertiajs/vue3';

import ClientGuestLayout from '@/Layouts/Guest/ClientGuestLayout.vue';
import InputLabel from '@/Components/_Shared/Input/InputLabel.vue';
import InputError from '@/Components/_Shared/Input/InputError.vue';
import TextInput from '@/Components/_Shared/Input/TextInput.vue';
import PrimaryButton from '@/Components/_Shared/Buttons/PrimaryButton.vue';

type RegisterFormFields = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

type RegisterField = keyof RegisterFormFields;
type RegisterErrors = Partial<Record<RegisterField, string | string[]>>;

const props = withDefaults(
    defineProps<{
        errors?: RegisterErrors;
    }>(),
    {
        errors: () => ({}),
    }
);

const form = useForm<RegisterFormFields>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const clientLoginUrl = route('client.login');

const emailTouched = ref(false);
const rawEmailError = ref('');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (): boolean => {
    if (!form.email) {
        rawEmailError.value = 'Email is required.';
        return false;
    }

    if (!emailRegex.test(form.email)) {
        rawEmailError.value = 'Enter a valid email address.';
        return false;
    }

    rawEmailError.value = '';
    return true;
};

const handleEmailBlur = () => {
    emailTouched.value = true;
    validateEmail();
};

watch(
    () => form.email,
    () => {
        if (emailTouched.value) {
            validateEmail();
        }
    }
);

const formatServerError = (field: RegisterField): string => {
    const formError = form.errors[field];
    if (formError) {
        return formError;
    }

    const propError = props.errors?.[field];
    if (!propError) {
        return '';
    }

    return Array.isArray(propError) ? propError[0] : propError;
};

const emailError = computed(() => {
    return formatServerError('email') || (emailTouched.value ? rawEmailError.value : '');
});

onMounted(async () => {
    try {
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
    }
});

const submit = (): void => {
    emailTouched.value = true;

    if (!validateEmail()) {
        return;
    }

    form.post(route('client.register.store'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>

<template>
    <ClientGuestLayout>
        <Head title="Register"/>

        <form class="space-y-4" @submit.prevent="submit">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <InputLabel for="first_name" value="First Name"/>
                    <TextInput
                        id="first_name"
                        v-model="form.first_name"
                        type="text"
                        class="mt-1 block w-full border-solid border-1 border-primary"
                        required
                        autocomplete="given-name"
                    />
                    <InputError :message="formatServerError('first_name')"/>
                </div>

                <div>
                    <InputLabel for="last_name" value="Last Name"/>
                    <TextInput
                        id="last_name"
                        v-model="form.last_name"
                        type="text"
                        class="mt-1 block w-full border-solid border-1 border-primary"
                        required
                        autocomplete="family-name"
                    />
                    <InputError :message="formatServerError('last_name')"/>
                </div>
            </div>

            <div>
                <InputLabel for="email" value="Email"/>
                <TextInput
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="mt-1 block w-full border-solid border-1 border-primary"
                    required
                    autocomplete="email"
                    @blur="handleEmailBlur"
                />
                <InputError :message="emailError"/>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <InputLabel for="password" value="Password"/>
                    <TextInput
                        id="password"
                        v-model="form.password"
                        type="password"
                        class="mt-1 block w-full border-solid border-1 border-primary"
                        required
                        autocomplete="new-password"
                    />
                    <InputError :message="formatServerError('password')"/>
                </div>

                <div>
                    <InputLabel for="password_confirmation" value="Confirm Password"/>
                    <TextInput
                        id="password_confirmation"
                        v-model="form.password_confirmation"
                        type="password"
                        class="mt-1 block w-full border-solid border-1 border-primary"
                        required
                        autocomplete="new-password"
                    />
                    <InputError :message="formatServerError('password_confirmation')"/>
                </div>
            </div>

            <div class="space-y-2">
                <PrimaryButton
                    type="submit"
                    class="w-full text-center text-primary-content py-2 px-6 rounded-xl border-primary border-1"
                    :disabled="form.processing"
                >
                    <span v-if="form.processing">Creating Account...</span>
                        <span v-else>Register</span>
                </PrimaryButton>
                <p class="text-center text-primary-content">
                    Already have an account?
                    <a :href="clientLoginUrl" class="text-primary underline">Log in</a>
                </p>
            </div>
        </form>
    </ClientGuestLayout>
</template>
