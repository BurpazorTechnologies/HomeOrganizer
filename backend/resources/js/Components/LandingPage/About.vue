<script setup lang="ts">
import Swal from "sweetalert2";
import CheckIcon from "@/Components/_Shared/Icons/CheckIcon.vue";
import ResumeManagerService from "@/Services/Portfolio/ResumeManagerService";
import YearsOfExperience from "@/Components/LandingPage/About/YearsOfExperience.vue";
import { useScrollTo } from "@/Composables/useScrollTo";
import SliderImage from "@/Components/LandingPage/About/SliderImage.vue";

const { scrollToElement } = useScrollTo();

const downloadResume = async () => {
    try {
        await ResumeManagerService.downloadResume();
        Swal.fire({
            toast: true,
            title: "CV file",
            text: "Downloaded Successfully!",
            icon: "success",
            theme: "dark"
        });
    } catch (error: any) {
        console.error(error);
        Swal.fire({
            toast: true,
            title: "Error",
            text: error.response?.data?.message || "Failed to download resume",
            icon: "error",
            theme: "dark"
        });
    }
};

const skills = {
    laravel: 'Laravel & Livewire Development',
    api: 'RESTful API & Mobile Backend Development',
    vue: 'Vue.js, Inertia & AlpineJS Integration',
    wordpress: 'WordPress & Custom Theme Development',
    yii2: 'Yii2 Legacy System Maintenance',
    database: 'Database Design, Optimization & Encryption',
    redis: 'Redis Optimization & Caching Strategies',
    devops: 'Docker, CI/CD (GitHub Actions, Jenkins)',
    aws: 'AWS, Heroku & Server Deployment',
    scraping: 'Web Scraping (Selenium, BeautifulSoup)',
    automation: 'Task & Workflow Automation',
    uiux: 'UI/UX via Tailwind, Bulma & Custom CSS'
};


const mobileSkills = {
    laravel: 'Laravel Development',
    api: 'API Development',
    vue: 'Vue.js & Inertia',
    database: 'Database Design',
    devops: 'DevOps & CI/CD',
    uiux: 'UI/UX Implementation'
};

const scrollToContact = () => {
    scrollToElement('contact');
};

</script>

<template>
    <section id="about" class="font-roboto container min-h-screen 2xl:!min-h-0 mx-auto bg-surface-light py-20">
        <div class="text-center">
            <h2 class="h2 text-complementary-light">About Me</h2>
            <div class="flex flex-col md:flex-row items-center">
                <div class="sm:w-3/5 my-10 md:mb-auto">
                    <div class="p-1 rounded-lg">
                        <div class="w-auto rounded-lg">
                            <SliderImage :before-image="'/assets/img/landing_page/about/dev_with_laptop.png'"
                                :after-image="'/assets/img/landing_page/about/dev_with_laptop_2.jpeg'"
                                :before-alt="'Original Ghiblified Dev with laptop'"
                                :after-alt="'Edited Ghiblified Dev with laptop'" />
                        </div>
                    </div>
                </div>

                <div class="md:w-3/5 md:pl-10 text-start md:my-10">
                    <h3 class="h3 text-primary-light">
                        Full Stack Developer
                        <YearsOfExperience />
                    </h3>

                    <p class="font-jetbrains-mono body text-surface-content leading-6 pt-4 pb-3">
                        I'm a senior full-stack engineer specializing in backend development with Laravel, Redis, and
                        MySQL.
                    </p>

                    <p class="font-jetbrains-mono body text-surface-content leading-6">
                        I've built and maintained systems for job platforms, online auctions, ambassador programs, and
                        mobile APIs—focusing on performance, security, and clean architecture.
                    </p>

                    <p class="font-jetbrains-mono body text-surface-content pt-6 pb-3">
                        I also work across the stack with Vue, InertiaJS, Docker, and AWS, integrating tools and
                        automating workflows to streamline development.
                    </p>

                    <p class="font-jetbrains-mono body text-surface-content">
                        I bring a practical, results-oriented mindset to every project, ensuring solutions are both
                        scalable and maintainable.
                    </p>
                </div>
            </div>
        </div>
        <div class="md:my-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:hidden gap-4 mb-8 text-surface-content py-4">
                <div v-for="(value, key) in mobileSkills" :key="key" class="flex items-center">
                    <CheckIcon />
                    <span>{{ value }}</span>
                </div>
            </div>

            <div class="hidden xl:grid grid-cols-3 gap-4 mb-8 text-surface-content py-4">
                <div v-for="(value, key) in skills" :key="key" class="flex items-center">
                    <CheckIcon />
                    <span>{{ value }}</span>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button @click.stop="downloadResume"
                    class="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                    <span class="p-2">
                        <i class="fa-solid fa-download"></i>
                    </span>
                    Download CV
                </button>
                <button @click.stop="scrollToContact"
                    class="border border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                    <span class="p-2">
                        <i class="fa-solid fa-comment-dots"></i>
                    </span>
                    Contact Me
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped></style>
