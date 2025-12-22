<script setup lang="ts">
import type {Skill} from "@/Types/LandingPage/Skills/Skill";

withDefaults(defineProps<{
    title: string;
    bgColor?: string;
    iconSrc: string;
    titleColor?: string;
    skills: Skill[];
}>(), {
    bgColor: 'bg-primary-variant',
    titleColor: 'text-primary-variant'
});

const getProficiencyClass = (proficiency: number) => {
    const width = Math.round((proficiency / 12) * 100);
    return `w-[${width}%]`;
};
</script>

<template>
    <div class="bg-surface-light rounded-xl p-6 shadow-lg transition-shadow">
        <div class="w-16 h-16 rounded-lg flex items-center justify-center mb-6">
            <img :src="iconSrc" alt="Skill icon" class="w-auto h-auto" />
        </div>
        <h3 class="h3 my-4 min-h-[3rem] flex items-center" :class="titleColor">{{ title }}</h3>
        <div class="space-y-3">
            <div v-for="(skill, index) in skills" :key="index">
                <p class="body text-surface-content mb-1">{{ skill.name }}</p>
                <div class="h-2 bg-neutral-light rounded-full">
                    <div
                        class="h-2 rounded-full"
                        :class="bgColor"
                        :style="{ width: `${Math.round((skill.proficiency / 12) * 100)}%` }"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>
