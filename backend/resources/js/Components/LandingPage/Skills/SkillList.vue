<script setup lang="ts">
import SkillCard from "@/Components/LandingPage/Skills/SkillCard.vue";

import type { SkillCategory } from '@/Types/LandingPage/Skills/SkillCategory';

const skillCategories: SkillCategory[] = [
    {
        title: 'Backend\nDevelopment',
        iconSrc: '/assets/img/landing_page/skills/backend.svg',
        bgColor: 'bg-primary-variant',
        skills: [
            { name: 'Laravel', proficiency: 11 },
            { name: 'PHP', proficiency: 11 },
            { name: 'MySQL', proficiency: 11 },
            { name: 'API Development', proficiency: 11 },
        ],
    },
    {
        title: 'Frontend\nDevelopment',
        iconSrc: '/assets/img/landing_page/skills/frontend.svg',
        bgColor: 'bg-primary-variant',
        skills: [
            { name: 'Vue.js', proficiency: 11 },
            { name: 'Tailwind CSS', proficiency: 11 },
            { name: 'JavaScript/ES6+', proficiency: 11 },
            { name: 'Responsive Design', proficiency: 10 },
        ],
    },
    {
        title: 'Development\nTools',
        iconSrc: '/assets/img/landing_page/skills/devops.svg',
        bgColor: 'bg-primary-variant',
        skills: [
            { name: 'Git/GitHub', proficiency: 11 },
            { name: 'Docker', proficiency: 10 },
            { name: 'CI/CD', proficiency: 10 },
            { name: 'Linux/Server Management', proficiency: 11 },
        ],
    },
    {
        title: 'Project\nManagement',
        iconSrc: '/assets/img/landing_page/skills/project-management.svg',
        bgColor: 'bg-primary-variant',
        skills: [
            { name: 'Jira', proficiency: 9 },
            { name: 'Trello', proficiency: 9 },
            { name: 'Slack', proficiency: 8 },
            { name: 'Notion', proficiency: 9 },
        ],
    }
];
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-8 my-10">
        <SkillCard v-for="(category, index) in skillCategories" :key="index" :title="category.title"
            :icon-src="category.iconSrc" :bgColor="category.bgColor" :skills="category.skills" />
    </div>
</template>
