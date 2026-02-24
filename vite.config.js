import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8080', // API Gateway
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '/api') // Actually, gateway uses /api prefix? No, services have context path /api/students...
                // Gateway listens on 8080.
                // Student Service: /api/students (via gateway usually rewritten or routed)
                // If Gateway routes /api/students -> student-service/api/students, then OK.
                // My Gateway config uses discovery locator which follows service ID. e.g. /student-service/api/students
                // But application properties say "locator enabled".
                // Default route is /SERVICE-ID/**
                // I should configure rewrite in gateway or just use /student-service/api/...
            }
        }
    }
})
