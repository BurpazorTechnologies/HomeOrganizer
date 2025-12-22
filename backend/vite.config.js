import {defineConfig} from 'vite';
import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({mode}) => {
    const isLocal = mode === 'development';
    const appScssPath = path.resolve(__dirname, 'resources/css/app.scss');

    return {
        plugins: [
            tailwindcss(),
            laravel({
                input: ['resources/css/app.scss', 'resources/js/app.ts'],
                refresh: [
                    'resources/views/**/*',
                    'resources/css/**/*.scss',
                    'resources/js/**/*',
                    'routes/**',
                ],
            }),
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
            {
                name: 'scss-dependency-fix', // plugin to make scss files hot-reload
                configureServer(server) {
                    const scssWatchPaths = ['/components/', '/utilities/', '/blog/', '/vendor/'];
            
                    server.watcher.on('change', (filePath) => {
                        if (
                            scssWatchPaths.some(path => filePath.includes(path)) &&
                            filePath.endsWith('.scss')
                        ) {
                            const time = new Date();
                            fs.utimesSync(appScssPath, time, time);
                        }
                    });
                },
            }
            
        ],
        resolve: {
            alias: {
                '@': '/resources/js',
                '@css': '/resources/css',
            },
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            https: isLocal ? {
                key: fs.readFileSync('/etc/nginx/ssl/nginx-selfsigned.key'),
                cert: fs.readFileSync('/etc/nginx/ssl/nginx-selfsigned.crt'),
            } : false,
            cors: {
                origin: ['https://local.homeorganizer.xyz', 'http://local.homeorganizer.xyz'],
            },
            origin: 'https://localhost:5173',
        },
    };
});
