import {Technology} from "@/Types/LandingPage/Projects/Technology";

export interface Project {
    title: string;
    description: string;
    technologies: Technology[];
    githubUrl?: string;
    detailsUrl?: string;
    projectImage?: string;
}
