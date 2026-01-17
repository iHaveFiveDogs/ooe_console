//vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/services': {
                target: 'http://192.168.101.7:8000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,  // 保留 /services
            },
            '/engine': {
                target: 'http://192.168.101.7:8000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path, // 保留 /engine
            },
            '/admin': {
                target: 'http://192.168.101.7:8000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path, // 保留 /admin
            },
        },
    },
})
