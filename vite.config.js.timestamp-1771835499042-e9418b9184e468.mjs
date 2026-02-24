// vite.config.js
import { defineConfig } from "file:///C:/Users/Dilini%20Udawaththa/OneDrive/Desktop/capstone/NexusEnroll/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Dilini%20Udawaththa/OneDrive/Desktop/capstone/NexusEnroll/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        // API Gateway
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api")
        // Actually, gateway uses /api prefix? No, services have context path /api/students...
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
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEaWxpbmkgVWRhd2F0aHRoYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGNhcHN0b25lXFxcXE5leHVzRW5yb2xsXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEaWxpbmkgVWRhd2F0aHRoYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGNhcHN0b25lXFxcXE5leHVzRW5yb2xsXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9EaWxpbmklMjBVZGF3YXRodGhhL09uZURyaXZlL0Rlc2t0b3AvY2Fwc3RvbmUvTmV4dXNFbnJvbGwvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgICBwcm94eToge1xyXG4gICAgICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCcsIC8vIEFQSSBHYXRld2F5XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJy9hcGknKSAvLyBBY3R1YWxseSwgZ2F0ZXdheSB1c2VzIC9hcGkgcHJlZml4PyBObywgc2VydmljZXMgaGF2ZSBjb250ZXh0IHBhdGggL2FwaS9zdHVkZW50cy4uLlxyXG4gICAgICAgICAgICAgICAgLy8gR2F0ZXdheSBsaXN0ZW5zIG9uIDgwODAuXHJcbiAgICAgICAgICAgICAgICAvLyBTdHVkZW50IFNlcnZpY2U6IC9hcGkvc3R1ZGVudHMgKHZpYSBnYXRld2F5IHVzdWFsbHkgcmV3cml0dGVuIG9yIHJvdXRlZClcclxuICAgICAgICAgICAgICAgIC8vIElmIEdhdGV3YXkgcm91dGVzIC9hcGkvc3R1ZGVudHMgLT4gc3R1ZGVudC1zZXJ2aWNlL2FwaS9zdHVkZW50cywgdGhlbiBPSy5cclxuICAgICAgICAgICAgICAgIC8vIE15IEdhdGV3YXkgY29uZmlnIHVzZXMgZGlzY292ZXJ5IGxvY2F0b3Igd2hpY2ggZm9sbG93cyBzZXJ2aWNlIElELiBlLmcuIC9zdHVkZW50LXNlcnZpY2UvYXBpL3N0dWRlbnRzXHJcbiAgICAgICAgICAgICAgICAvLyBCdXQgYXBwbGljYXRpb24gcHJvcGVydGllcyBzYXkgXCJsb2NhdG9yIGVuYWJsZWRcIi5cclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgcm91dGUgaXMgL1NFUlZJQ0UtSUQvKipcclxuICAgICAgICAgICAgICAgIC8vIEkgc2hvdWxkIGNvbmZpZ3VyZSByZXdyaXRlIGluIGdhdGV3YXkgb3IganVzdCB1c2UgL3N0dWRlbnQtc2VydmljZS9hcGkvLi4uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1osU0FBUyxvQkFBb0I7QUFDNWIsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDSCxRQUFRO0FBQUEsUUFDSixRQUFRO0FBQUE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxVQUFVLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFRcEQ7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
