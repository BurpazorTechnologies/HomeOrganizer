import api, { initCsrf } from '@/Services/api';

export default class ResumeManagerService {
    static async uploadResume(file: File): Promise<any> {
        try {
            await initCsrf();

            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(
                route("api.v1.admin.portfolio.resume.upload"),
                formData
            );

            return response.data.data;
        } catch (error: any) {
            console.error("Resume Manager Service Error:", error.response?.data?.message || error.message);
            throw error;
        }
    }

    static async downloadResume(): Promise<void> {
        try {
            await initCsrf();

            const response = await api.get(route("api.v1.admin.portfolio.resume"), {
                responseType: 'blob'
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'winzor-paelmo-cv.pdf';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }

            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            return response.data;
        } catch (error: any) {
            console.error("Resume Manager Service Error:", error.response?.data?.message || error.message);
            throw error;
        }
    }
}
