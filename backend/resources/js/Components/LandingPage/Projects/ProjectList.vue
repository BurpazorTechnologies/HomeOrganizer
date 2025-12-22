<script setup lang="ts">
import ProjectCard from './ProjectCard.vue';
import { Project } from "@/Types/LandingPage/Projects/Project";
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getTechStyle } from '@/Models/TechStackTag';

const props = withDefaults(defineProps<{
    projects?: Project[];
    showAllBtn?: boolean;
    allProjectsUrl?: string;
}>(), {
    showAllBtn: true,
    projects: () => [
        {
            title: 'Cafe24 Experts',
            description: `A custom platform for managing freelance jobs, applications, and the admin back office.<br><br>
                      The system includes a Client Portal, Experts Portal, and an Admin Management Dashboard.`,
            technologies: [
                { name: 'Laravel', ...getTechStyle('Laravel') },
                { name: 'Vue', ...getTechStyle('Vue') },
                { name: 'Redis', ...getTechStyle('Redis') },
                { name: 'MySQL', ...getTechStyle('MySQL') },
            ],
            githubUrl: '#',
            detailsUrl: '#',
            projectImage: '/assets/img/landing_page/projects/cafe24experts.png'
        },
        {
            title: 'Auctiontale',
            description: `An online auction platform featuring Auctioneer, Buyer, and Seller Portals, along with an Admin Dashboard.<br><br>
                      Integrated with Stripe for payment processing.`,
            technologies: [
                { name: 'Laravel', ...getTechStyle('Laravel') },
                { name: 'Vue', ...getTechStyle('Vue') },
            ],
            githubUrl: '#',
            detailsUrl: '#',
            projectImage: '/assets/img/landing_page/projects/auctiontale.png'
        },
        {
            title: 'Kumu PH',
            description: `The largest streaming platform in the Philippines. Developed mobile APIs for payments, live streaming, tracking, and more.<br><br>
                      Contributed to the migration from a monolithic architecture to microservices.`,
            technologies: [
                { name: 'Laravel', ...getTechStyle('Laravel') },
                { name: 'Vue', ...getTechStyle('Vue') },
                { name: 'Yii2', ...getTechStyle('Yii2') },
                { name: 'Tailwind', ...getTechStyle('Tailwind') },
            ],
            githubUrl: '#',
            detailsUrl: '#',
            projectImage: '/assets/img/landing_page/projects/kumuph.png'
        },
        {
            title: 'Online Gym Class',
            description: 'A booking system for gym classes, with calendar integration, waitlists, and attendance tracking.',
            technologies: [
                { name: 'Laravel', ...getTechStyle('Laravel') },
                { name: 'Vue', ...getTechStyle('Vue') },
            ],
            githubUrl: '#',
            detailsUrl: '#',
            projectImage: '/assets/img/landing_page/projects/sample_site_default.png'
        },
        {
            title: 'Ambassador Programs',
            description: `A rewards system for healthcare education providers.<br><br>
                      Includes an Admin Back Office and Client Portal for managing activities and redeeming rewards.<br><br>
                      Features advanced analytics and reporting tools.`,
            technologies: [
                { name: 'Laravel', ...getTechStyle('Laravel') },
                { name: 'Vue', ...getTechStyle('Vue') },
                { name: 'Redis', ...getTechStyle('Redis') },
            ],
            githubUrl: '#',
            detailsUrl: '#',
            projectImage: '/assets/img/landing_page/projects/ambassador.png'
        },
        {
            title: 'Automated Lead Marketing',
            description: `Developed multi-tenant authentication and authorization.<br><br>
                      Enhanced the UI/UX by introducing a dark mode feature.<br><br>
                      Extended automated testing to improve the CI/CD pipeline.`,
            technologies: [
                { name: 'Laravel', ...getTechStyle('Laravel') },
                { name: 'Vue', ...getTechStyle('Vue') },
                { name: 'Redis', ...getTechStyle('Redis') },
            ],
            githubUrl: '#',
            detailsUrl: '#',
            projectImage: '/assets/img/landing_page/projects/leads_marketing.png'
        }
    ]

});


const currentPage = ref(0);

const isMobile = ref(window.innerWidth < 640);
const isLarge = ref(window.innerWidth >= 1024);
const is2XL = ref(window.innerWidth >= 1536);

const itemsPerPage = computed(() => {
    if (isMobile.value) return 3;
    if (is2XL.value) return 4;
    if (isLarge.value) return 3;
    return 4;
});

const totalPages = computed(() => Math.ceil(props.projects.length / itemsPerPage.value));

const currentProjects = computed(() => {
    const start = currentPage.value * itemsPerPage.value;
    return props.projects.slice(start, start + itemsPerPage.value);
});

const isCarousel = computed(() => props.projects.length > itemsPerPage.value);

const nextPage = () => {
    if (currentPage.value < totalPages.value - 1) {
        currentPage.value++;
    } else {
        currentPage.value = 0;
    }
};

const prevPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--;
    } else {
        currentPage.value = totalPages.value - 1;
    }
};

const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
    isLarge.value = window.innerWidth >= 1024;
    is2XL.value = window.innerWidth >= 1536;
    currentPage.value = 0;
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<template>
    <div class="relative">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 lg:gap-4">
            <ProjectCard v-for="(project, index) in currentProjects" :key="index" :title="project.title"
                :description="project.description" :technologies="project.technologies" :githubUrl="project.githubUrl"
                :detailsUrl="project.detailsUrl" :projectImage="project.projectImage">
            </ProjectCard>
        </div>

        <!-- Carousel Navigation -->
        <div v-if="isCarousel" class="flex justify-center items-center mt-4 space-x-4">
            <button @click="prevPage" class="p-2 bg-transparent text-primary hover:bg-primary-focus transition-colors"
                aria-label="Previous projects">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <div class="flex space-x-2">
                <button v-for="page in totalPages" :key="page" @click="currentPage = page - 1"
                    class="w-3 h-3 rounded-full transition-colors"
                    :class="currentPage === page - 1 ? 'bg-primary' : 'bg-gray-300'"
                    :aria-label="`Go to page ${page}`"></button>
            </div>

            <button @click="nextPage" class="p-2 bg-transparent text-primary hover:bg-primary-focus transition-colors"
                aria-label="Next projects">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
</template>
