import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/Layout";

import Home from "@/pages/home";
import Scan from "@/pages/scan";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";

function ScrollToTop() {
  const [location] = useWouterLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function Router() {
  return (
    <Layout>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/scan" component={Scan} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Wake up backend (pre-warm) on load
  useEffect(() => {
    const raw = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
    // In dev, use the Vite proxy path; in production, hit the backend directly
    const healthUrl = raw ? `${raw.replace(/\/$/, "")}/api/health` : "/api/health";
    fetch(healthUrl).catch(() => {
      // Silently ignore wake-up errors
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
