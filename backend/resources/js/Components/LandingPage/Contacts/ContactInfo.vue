<script setup lang="ts">
import SocialIcon from '@/Components/LandingPage/Contacts/SocialIcon.vue';
import ContactDetailItem from '@/Components/LandingPage/Contacts/ContactDetailItem.vue';
import {ContactDetail} from '@/Types/LandingPage/Contacts/ContactDetail';
import {SocialLink} from '@/Types/LandingPage/Contacts/SocialLink';

const title = "Let's work together";
const description = "I'm currently available for freelance work or full-time opportunities. If you're looking for a developer who can bring your ideas to life, let's connect!";

const contactDetails: ContactDetail[] = [
    {
        favicon: "fa-solid fa-envelope",
        value: "winzorjmpaelmo@gmail.com"
    },
    {
        favicon: "fa-solid fa-location-dot",
        value: "Philippines"
    }
];

const socialLinks: SocialLink[] = [
    {
        name: "GitHub",
        url: "https://github.com/II-Zor-II",
        favicon: "fa-brands fa-github",
    },
    {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/winzor-paelmo/",
        favicon: "fa-brands fa-linkedin",
    }
];
</script>

<template>
    <div>
        <h3 class="h3 text-primary-light mb-4">{{ title }}</h3>
        <p class="font-jetbrains-mono body text-surface-content my-6">
            {{ description }}
        </p>

        <div class="space-y-4">
            <ContactDetailItem
                v-for="(detail, index) in contactDetails"
                :key="index"
                :favicon="detail.favicon"
                :value="detail.value"
            />
        </div>

        <div class="flex space-x-4 my-8">
            <SocialIcon
                v-for="(link, index) in socialLinks"
                :key="index"
                :favicon="link.favicon"
                :url="link.url"
                :name="link.name"
            />
        </div>
    </div>
</template>
