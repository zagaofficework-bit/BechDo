import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './features/common/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';  // ← add this
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   
      gcTime: 1000 * 60 * 10,      
      refetchOnWindowFocus: false,  
    },
  },
});

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);