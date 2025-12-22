<script setup lang="ts">
import ContactForm from '@/Components/LandingPage/Contacts/ContactForm.vue';
import ContactInfo from '@/Components/LandingPage/Contacts/ContactInfo.vue';
import {ContactDetail} from '@/Types/LandingPage/Contacts/ContactDetail';
import {ContactFormData} from '@/Types/LandingPage/Contacts/ContactFormData';
import {SocialLink} from '@/Types/LandingPage/Contacts/SocialLink';

const title = "Get In Touch";

const contactInfoTitle = "Let's work together";

const description = `I'm currently available for freelance work or full-time opportunities.
If you're looking for a developer who can bring your ideas to life, let's connect!`;

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
        favicon: "fa-solid fa-circle-user",
    },
    {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/winzor-paelmo/",
        favicon: "fa-solid fa-circle-user",
    }
];

const handleSubmitSuccess = (formData: ContactFormData) => {
    console.log('Form submitted successfully:', formData);
};

const handleSubmitError = (error: any) => {
    console.error('Error submitting form:', error);
};
</script>

<template>
    <section id="contact" class="font-roboto container bg-surface py-12">
        <div class="container mx-auto px-4">
            <h2 class="h2 text-primary-variant-light text-center my-12">{{ title }}</h2>

            <div class="flex flex-col md:flex-row">
                <div class="md:w-1/2 md:pr-8 mb-8 md:mb-0">
                    <ContactInfo
                        :title="contactInfoTitle"
                        :description="description"
                        :contactDetails="contactDetails"
                        :socialLinks="socialLinks"
                    />
                </div>

                <div class="md:w-1/2">
                    <ContactForm
                        @submit-success="handleSubmitSuccess"
                        @submit-error="handleSubmitError"
                    />
                </div>
            </div>
        </div>
    </section>
</template>
