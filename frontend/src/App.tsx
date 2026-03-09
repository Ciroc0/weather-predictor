import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { HomePage } from "@/pages/HomePage";
import { PerformancePage } from "@/pages/PerformancePage";
import { RainPage } from "@/pages/RainPage";
import { TemperaturePage } from "@/pages/TemperaturePage";
import { WindPage } from "@/pages/WindPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="temperatur" element={<TemperaturePage />} />
              <Route path="vind" element={<WindPage />} />
              <Route path="regn" element={<RainPage />} />
              <Route path="performance" element={<PerformancePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
