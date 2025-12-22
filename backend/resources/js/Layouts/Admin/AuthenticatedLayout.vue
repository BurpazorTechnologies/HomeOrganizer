<script setup>
import {ref} from 'vue';
import {Link} from '@inertiajs/vue3';
import Sidebar from '@/Components/_Shared/Sections/Sidebar.vue';
import Dropdown from '@/Components/_Shared/Menu/Dropdown.vue';
import SearchBar from '@/Components/_Shared/Input/SearchBar.vue';
import DropdownLink from '@/Components/_Shared/Menu/DropdownLink.vue';
import ApplicationLogo from '@/Components/_Shared/Logo/ApplicationLogo.vue';


const showingNavigationDropdown = ref(false);
</script>

<template>
    <div class="h-screen flex bg-neutral text-neutral-content">
        <!-- Sidebar -->
        <Sidebar
            :userName="$page.props.auth.user.user_information.first_name"
            :links="[
                { text: 'Dashboard', href: '/admin/dashboard', icon: 'fa-solid fa-table-columns', active: true },
            ]"
            class="fixed h-full w-[15%]"
        />

        <!-- Main Content Area -->
        <div class="ml-[15%] w-[85%] overflow-y-auto">
            <!-- Navigation -->
            <nav class="bg-neutral border-b border-primary-dark">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex">
                            <!-- Logo -->
                            <div class="shrink-0 flex items-center">
                                <Link :href="route('admin.dashboard')">
                                    <ApplicationLogo
                                        class="block h-9 w-auto fill-current text-gray-800"
                                    />
                                </Link>
                            </div>
                        </div>
                        <div class="px-2 flex items-center">
                            <SearchBar/>
                        </div>
                        <div class="hidden sm:flex sm:items-center sm:ms-6">
                            <!-- Settings Dropdown -->
                            <div class="ms-3 relative">
                                <Dropdown align="right" width="48">
                                    <template #trigger>
                                        <span class="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                class="inline-flex items-center px-3 py-2 border
                                                border-transparent text-sm leading-4 font-medium
                                                rounded-md bg-primary-dark focus:outline-none transition
                                                ease-in-out duration-150">
                                                {{ $page.props.auth.user.user_information.full_name }}
                                                <svg
                                                    class="ms-2 -me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor">
                                                    <path
                                                        fill-rule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clip-rule="evenodd"/>
                                                </svg>
                                            </button>
                                        </span>
                                    </template>

                                    <template #content>
                                        <DropdownLink :href="route('admin.logout')" method="post" as="button">
                                            Log Out
                                        </DropdownLink>
                                    </template>
                                </Dropdown>
                            </div>
                        </div>

                        <!-- Hamburger -->
                        <div class="-me-2 flex items-center sm:hidden">
                            <button
                                @click="showingNavigationDropdown = !showingNavigationDropdown"
                                class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                            >
                                <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        :class="{
                                            hidden: showingNavigationDropdown,
                                            'inline-flex': !showingNavigationDropdown,
                                        }"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        :class="{
                                            hidden: !showingNavigationDropdown,
                                            'inline-flex': showingNavigationDropdown,
                                        }"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Page Heading -->
            <header class="shadow" v-if="$slots.header">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <slot name="header"/>
                </div>
            </header>

            <!-- Page Content -->
            <main class="flex-1 p-6">
                <slot/>
            </main>
        </div>
    </div>
</template>


