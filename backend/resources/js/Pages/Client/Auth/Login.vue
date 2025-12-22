<script setup lang="ts">
import axios from 'axios';
import {onMounted, watch} from "vue";
import {Head, useForm, router} from '@inertiajs/vue3';
import Swal from 'sweetalert2';
import ClientGuestLayout from '@/Layouts/Guest/ClientGuestLayout.vue';
import Checkbox from '@/Components/_Shared/Input/Checkbox.vue';
import TextInput from '@/Components/_Shared/Input/TextInput.vue';
import InputLabel from '@/Components/_Shared/Input/InputLabel.vue';
import InputError from '@/Components/_Shared/Input/InputError.vue';
import PrimaryButton from '@/Components/_Shared/Buttons/PrimaryButton.vue';

const props = defineProps({
    status: {
        type: String,
    },
    errors: {
        type: Object,
        default: () => ({}),
    },
    adminOauthAttempt: {
        type: Boolean,
        default: false,
    },
});

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

// Check for `admin account` login errors using Inertia's error handling
type InertiaErrorBag = Record<string, string | string[]> | undefined;

const checkForAdminError = (errors?: InertiaErrorBag): void => {
    console.log('Checking for admin error:', errors);
    if (errors && errors.email) {
        const emailError = Array.isArray(errors.email) ? errors.email[0] : errors.email;
        console.log('Email error message:', emailError);
        
        if (emailError && (
            emailError.includes('admin user') || 
            emailError.includes('admin login portal') ||
            emailError.includes('registered as an admin')
        )) {
            console.log('Admin error detected, showing SweetAlert');
            showAdminErrorAlert();
        }
    }
};

// Show SweetAlert for `admin account` login error
const showAdminErrorAlert = () => {
    Swal.fire({
        title: 'Access Denied',
        text: 'This email is registered as an admin user. Please use the admin login portal instead.',
        icon: 'warning',
        confirmButtonText: 'Go to Admin Login',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        theme: 'dark',
        customClass: {
            popup: 'swal-admin-login-error-popup'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = route('admin.login');
        }
    });
};

// Check if email is `admin account` via API
const checkEmailRole = async (email: string): Promise<void> => {
    if (!email || !email.includes('@')) return;
    
    try {
        const response = await axios.post('/api/check-email-role', {
            email: email
        });
        
        if (response.data.is_admin) {
            console.log('Admin email detected via API:', email);
            showAdminErrorAlert();
        }
    } catch (error) {
        console.error('Error checking email role:', error);
    }
};

onMounted(async () => {
    try {
        await axios.get('/sanctum/csrf-cookie', {withCredentials: true});
        console.log('CSRF token initialized');
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
    }
    
    // Check for existing errors on page load
    console.log('Props errors on mount:', props.errors);
    checkForAdminError(props.errors);
});

// Watch for changes in props.errors (Inertia validation errors)
watch(() => props.errors, (newErrors) => {
    console.log('Props errors changed:', newErrors);
    checkForAdminError(newErrors);
}, { deep: true, immediate: true });

// Handle email input blur event to check if it's an admin
const handleEmailBlur = () => {
    if (form.email) {
        console.log('Email input blurred, checking role:', form.email);
        checkEmailRole(form.email);
    }
};

// Watch for admin OAuth attempt flag
watch(() => props.adminOauthAttempt, (isAdminOauthAttempt) => {
    if (isAdminOauthAttempt) {
        console.log('Admin OAuth attempt detected, showing SweetAlert');
        showAdminErrorAlert();
    }
}, { immediate: true });

const submit = async (): Promise<void> => {
    console.log('Form submitting with data:', form.data());
    form.post(route('client.login.store'), {
        onFinish: () => {
            console.log('Form finished, resetting password');
            form.reset('password');
        },
        onSuccess: () => {
            console.log('Login successful');
        },
        onError: (errors) => {
            console.log('Login error:', errors);
            console.log('Form errors:', form.errors);
        }
    });
};

const handleGoogleLogin = (): void => {
    window.location.href = route('client.auth.google.redirect');
};

const goToRegister = (): void => {
    router.visit(route('client.register'));
};
</script>

<template>
    <ClientGuestLayout>
        <Head title="Log in"/>

        <div v-if="status" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ status }}
        </div>

        <form @submit.prevent="submit">
            <div>
                <InputLabel for="email" value="Email"/>

                <TextInput
                    id="email"
                    type="email"
                    class="mt-1 block w-full border-solid border-1 border-primary"
                    v-model="form.email"
                    @blur="handleEmailBlur"
                    required
                    autofocus
                    autocomplete="username"
                />

                <InputError class="" :message="errors.email || form.errors.email"/>
            </div>

            <div class="mt-4">
                <InputLabel for="password" value="Password"/>
                <TextInput
                    id="password"
                    type="password"
                    class="mt-1 block w-full border-solid border-1 border-primary"
                    v-model="form.password"
                    required
                    autocomplete="current-password"
                />

                <InputError class="" :message="errors.password || form.errors.password"/>
            </div>

           <div class="flex">
               <div class="text-primary-content">
                   <label class="">
                       <Checkbox name="remember" v-model:checked="form.remember"/>
                       <span class="">Remember me</span>
                   </label>
               </div>
               <div class="ml-auto text-primary-content">
                   <a href="/client/forgot-password" class="text-primary-content">Forgot Password</a>
               </div>
           </div>

            <div class="my-4 gap-4 flex">
                <PrimaryButton type="submit" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Log in
                </PrimaryButton>
                <PrimaryButton
                    type="button"
                    class="text-primary-content py-2 px-6 rounded-xl border-primary border-1"
                    @click="goToRegister"
                >
                    Register
                </PrimaryButton>
            </div>
            <div class="my-4 gap-4 flex flex-col">
                <PrimaryButton 
                    type="button"
                    @click="handleGoogleLogin"
                    class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With Google
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With Facebook
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With Apple
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With Github
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With Microsoft
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With Reddit
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With X
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With LinkedIn
                </PrimaryButton>
                <PrimaryButton type="button" class="text-primary-content py-2 px-6 rounded-xl border-primary border-1">
                    Continue With TikTok
                </PrimaryButton>
            </div>
        </form>
    </ClientGuestLayout>
</template>
