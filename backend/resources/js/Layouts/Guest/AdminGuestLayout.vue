<script setup>
import ApplicationLogo from '@/Components/_Shared/Logo/ApplicationLogo.vue';
import {Link} from '@inertiajs/vue3';
</script>

<template>
    <div class="bg-surface min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0">
        <div>
            <Link href="/laravel/public">
                <ApplicationLogo class="w-20 h-20"/>
            </Link>
            <p class="text-primary-light">
                Admin Login
            </p>
        </div>

        <div class="">
            <slot/>
        </div>
    </div>
</template>
