//vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/services': {
                target: 'http://192.168.101.7:8010',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,  // 保留 /services
            },
            '/scene': {
                target: 'http://192.168.101.7:8010',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,  // 保留 /scene
            },
        },
    },
})
