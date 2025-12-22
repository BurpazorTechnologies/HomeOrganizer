import api, { initCsrf } from '@/Services/api';
import { ContactFormData } from '@/Types/LandingPage/Contacts/ContactFormData';

export default class ContactFormService {
    static async submitContactForm(formData: ContactFormData, recaptchaToken: string): Promise<any> {
        try {
            await initCsrf();

            const response = await api.post(
                route("api.v1.admin.contact.email"),
                {
                    ...formData,
                    recaptcha_token: recaptchaToken
                }
            );

            return response.data;
        } catch (error: any) {
            console.error("Contact Form Service Error:", error.response?.data?.message || error.message);
            throw error;
        }
    }
} 