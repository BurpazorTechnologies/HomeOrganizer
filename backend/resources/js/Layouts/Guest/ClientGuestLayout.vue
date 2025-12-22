<script setup>
import TopNav from "@/Components/Client/Auth/TopNav.vue";
</script>

<template>
    <div class="bg-surface p-md overflow-y-auto flex flex-col h-screen justify-between">
        <div class="w-100 z-20 w-full">
            <TopNav/>
        </div>
        <div class="flex items-center justify-center m-auto w-full">
            <div class="w-full bg-white-100 rounded-xl 2k:max-w-[84.75rem] desktop:max-w-[41rem] 2k:p-[14rem] desktop:p-[4rem] md-tablet:p-[3rem] py-[2rem] px-[1rem]
            sm-desktop:max-w-[32.75rem] md-tablet:max-w-[26.25rem] sm-tablet:max-w-[21rem] max-w-[17.5rem]">
                <slot />
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>
