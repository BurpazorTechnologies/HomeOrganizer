import forms from '@tailwindcss/forms';
import utilScrollbar from "./tailwind/util.scrollbar.js";
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.vue',
    ],
    plugins: [
        forms,
        utilScrollbar,
        typography
    ],
};
