<script setup lang="ts">
import {ref} from 'vue';
import FormInput from '@/Components/LandingPage/Contacts/FormInput.vue';
import FormTextArea from '@/Components/LandingPage/Contacts/FormTextArea.vue';
import {ContactFormData} from '@/Types/LandingPage/Contacts/ContactFormData';
import ContactFormService from '@/Services/Contact/ContactFormService';
import Loader from '@/Components/_Shared/Loaders/Loader.vue';
import Swal from 'sweetalert2';

const formData = ref<ContactFormData>({
    name: '',
    from: '',
    subject: '',
    message: ''
});

const isSubmitting = ref(false);

const emit = defineEmits<{
    'submit-success': [data: ContactFormData];
    'submit-error': [error: any];
}>();

const submitForm = async (e: Event) => {
    e.preventDefault();
    isSubmitting.value = true;

    try {
        await window.grecaptcha.enterprise.ready(async () => {
            try {
                const token = await window.grecaptcha.enterprise.execute(
                    window.contact.recaptchaSiteKey, 
                    { action: 'CONTACT' }
                );
                console.log('Google token:' + token);
                const response = await ContactFormService.submitContactForm(formData.value, token);
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: response.message,
                    customClass: {
                        popup: 'swal-contact-success-popup' 
                    },
                });

                emit('submit-success', formData.value);
                formData.value = {
                    name: '',
                    from: '',
                    subject: '',
                    message: '',
                };
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'There was an error sending your message. Please try again later.',
                    customClass: {
                        popup: 'swal-contact-error-popup' 
                    },
                });
                emit('submit-error', error);
            } finally {
                isSubmitting.value = false;
            }
        });
    } catch (error) {
        isSubmitting.value = false;
        await Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'There was an error with reCAPTCHA. Please try again later.',
            theme: 'dark'
        });
        emit('submit-error', error);
    }
};
</script>

<template>
    <form class="space-y-4" @submit="submitForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
                v-model="formData.name"
                label="Your Name"
                type="text"
                placeholder="Your Name"
                required
            />
            <FormInput
                v-model="formData.from"
                label="Email Address"
                type="email"
                placeholder="your.email@example.com"
                required
            />
        </div>

        <FormInput
            v-model="formData.subject"
            label="Subject"
            type="text"
            placeholder="Project Discussion"
        />

        <FormTextArea
            v-model="formData.message"
            label="Your Message"
            placeholder="Tell me about your project..."
            :rows="10"
            required
        />

        <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-primary-variant hover:bg-primary-variant-focus text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
            <Loader :show="isSubmitting" size="sm" color="white" class="mr-2" />
            <span>{{ isSubmitting ? 'Sending...' : 'Send Message' }}</span>
        </button>
    </form>
</template>
