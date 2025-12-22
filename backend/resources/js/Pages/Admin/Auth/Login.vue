<script setup lang="ts">
import axios from 'axios';
import {onMounted} from "vue";
import {Head, useForm} from '@inertiajs/vue3';
import AdminGuestLayout from '@/Layouts/Guest/AdminGuestLayout.vue';
import Checkbox from '@/Components/_Shared/Input/Checkbox.vue';
import TextInput from '@/Components/_Shared/Input/TextInput.vue';
import InputLabel from '@/Components/_Shared/Input/InputLabel.vue';
import InputError from '@/Components/_Shared/Input/InputError.vue';
import PrimaryButton from '@/Components/_Shared/Buttons/PrimaryButton.vue';

defineProps({
    status: {
        type: String,
    },
});

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

onMounted(async () => {
    try {
        await axios.get('/sanctum/csrf-cookie', {withCredentials: true});
        console.log('CSRF token initialized');
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
    }
});

const submit = async (): Promise<void> => {
    form.post(route('admin.login.store'), {
        onFinish: () => form.reset('password'),
        onSuccess: () => {
            axios.get('/sanctum/csrf-cookie', {withCredentials: true});
        }
    });
};
</script>

<template>
    <AdminGuestLayout>
        <Head title="Log in"/>

        <div v-if="status" class="">
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
                    required
                    autofocus
                    autocomplete="username"
                />

                <InputError class="" :message="form.errors.email"/>
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

                <InputError class="" :message="form.errors.password"/>
            </div>

            <div class="text-primary-content">
                <label class="">
                    <Checkbox name="remember" v-model:checked="form.remember"/>
                    <span class="">Remember me</span>
                </label>
            </div>

            <div class="4">
                <PrimaryButton class="text-primary-content">
                    Log in
                </PrimaryButton>
            </div>
        </form>
    </AdminGuestLayout>
</template>
