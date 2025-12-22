import type { Skill } from '@/Types/LandingPage/Skills/Skill';

export type SkillCategory = {
    title: string;
    iconSrc: string;
    bgColor: string;
    skills: Skill[];
};
