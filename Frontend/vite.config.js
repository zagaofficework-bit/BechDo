import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — rarely change, browser cache mein rehte hain
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-stripe": ["@stripe/stripe-js", "@stripe/react-stripe-js"],
          "vendor-socket": ["socket.io-client"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": ["react-hot-toast", "react-icons", "react-helmet-async"],
          // Feature chunks
          "feature-admin": ["./src/features/Admin/pages/Admindashboard.jsx"],
          "feature-seller": [
            "./src/features/SellerDashboard/Sellerdashboard.jsx",
            "./src/features/SellerDashboard/AddProduct.jsx",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false, // production mein off
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // console.log production mein hata do
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
  },
});
