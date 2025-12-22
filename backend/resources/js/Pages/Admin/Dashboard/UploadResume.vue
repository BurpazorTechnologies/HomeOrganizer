<script setup lang="ts">
import {ref, computed} from 'vue';
import ResumeManagerService from "@/Services/Portfolio/ResumeManagerService";

const file = ref<File | null>(null);
const fileError = ref<string | null>(null);
const isUploading = ref(false);
const uploadSuccess = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const allowedFileTypes = [
    'application/pdf',
];


const validateFile = (selectedFile: File): boolean => {
    // Reset previous errors
    fileError.value = null;

    // Validate file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
        fileError.value = 'Only PDF and Word documents are allowed';
        return false;
    }

    // Validate file size (10MB max)
    const mbSize = 10;
    const maxByteSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxByteSize) {
        fileError.value = `File size must be less than ${mbSize}MB`;
        return false;
    }

    return true;
};

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
        const selectedFile = input.files[0];

        if (validateFile(selectedFile)) {
            file.value = selectedFile;
        } else {
            // Clear the file input if validation fails
            if (fileInput.value) {
                fileInput.value.value = '';
            }
            file.value = null;
        }
    }
};

const uploadResume = async () => {
    if (!file.value) {
        fileError.value = 'Please select a file';
        return;
    }

    try {
        isUploading.value = true;
        await ResumeManagerService.uploadResume(file.value);
        uploadSuccess.value = true;
        setTimeout(() => {
            resetForm();
        }, 3000); // 3 seconds
    } catch (error: any) {
        if (error.response?.data?.errors?.resume) {
            fileError.value = error.response.data.errors.resume[0];
        } else {
            fileError.value = 'Upload failed. Please try again.';
        }
    } finally {
        isUploading.value = false;
    }
};

const resetForm = () => {
    file.value = null;
    fileError.value = null;
    uploadSuccess.value = false;
    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

const triggerFileInput = () => {
    if (fileInput.value) {
        fileInput.value.click();
    }
};

const fileName = computed(() => {
    if (!file.value) return '';
    return file.value.name;
});

const fileSize = computed(() => {
    if (!file.value) return '';
    const bytes = file.value.size;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
});
</script>

<template>
    <div class="p-10 max-w-lg mx-auto">
        <!-- Hidden file input -->
        <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".pdf"
            @change="handleFileChange"
        />

        <!-- Upload area -->
        <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-focus transition-colors"
            :class="{ 'border-red-500': fileError, 'border-green-500': uploadSuccess }"
            @click="triggerFileInput">
            <!-- File not selected state -->
            <div v-if="!file" class="space-y-4">
                <div class="text-primary">
                    <i class="text-5xl fa fa-file-arrow-up"></i>
                </div>
                <h6 class="h6">Drag & drop your resume/CV here</h6>
                <p class="body">- or -</p>
                <button class="btn-primary">
                    Browse Files
                </button>
                <p class="footer text-secondary-light mt-3">Supported formats: PDF, DOC, DOCX (max 5MB)</p>
            </div>

            <!-- File selected state -->
            <div v-else class="space-y-3">
                <div class="text-4xl text-primary-focus">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <p class="body text-primary-content">{{ fileName }}</p>
                <small class="small text-primary-content">{{ fileSize }}</small>
                <div class="flex justify-center space-x-3">
                    <button @click.stop="resetForm"
                            class="btn-primary-outline body hover:bg-primary-dark transition-colors">
                        Remove
                    </button>
                    <button
                        @click.stop="uploadResume"
                        class="btn-primary hover:bg-primary-focus transition-colors"
                        :disabled="isUploading">
                        {{ isUploading ? 'Uploading...' : 'Upload Now' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Error message -->
        <div v-if="fileError" class="mt-3 text-sm text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {{ fileError }}
        </div>

        <!-- Success message -->
        <div v-if="uploadSuccess" class="mt-3 text-sm text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Resume uploaded successfully!
        </div>
    </div>
</template>

<style scoped>
.hidden {
    display: none;
}
</style>
