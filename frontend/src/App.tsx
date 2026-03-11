import "./App.css";

import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { PageState } from "@/components/PageState";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const HomePage = lazy(() => import("@/pages/HomePage").then((module) => ({ default: module.HomePage })));
const TemperaturePage = lazy(() =>
  import("@/pages/TemperaturePage").then((module) => ({ default: module.TemperaturePage })),
);
const WindPage = lazy(() => import("@/pages/WindPage").then((module) => ({ default: module.WindPage })));
const RainPage = lazy(() => import("@/pages/RainPage").then((module) => ({ default: module.RainPage })));
const PerformancePage = lazy(() =>
  import("@/pages/PerformancePage").then((module) => ({ default: module.PerformancePage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <PageState
      mode="loading"
      title="Indlæser side"
      description="Sideindhold og grafer klargøres nu."
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route
                index
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <HomePage />
                  </Suspense>
                }
              />
              <Route
                path="temperatur"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <TemperaturePage />
                  </Suspense>
                }
              />
              <Route
                path="vind"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <WindPage />
                  </Suspense>
                }
              />
              <Route
                path="regn"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <RainPage />
                  </Suspense>
                }
              />
              <Route
                path="performance"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PerformancePage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
