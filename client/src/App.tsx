import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import { useState, useEffect } from "react";

function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center mx-auto">
          <span className="text-background text-xl font-bold">⚡</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">AREA befindet sich in Wartung</h1>
        <p className="text-sm text-muted-foreground">Bitte versuchen Sie es später erneut.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/amar-stats"} component={AdminDashboard} />
      <Route path={"/impressum"} component={Impressum} />
      <Route path={"/datenschutz"} component={Datenschutz} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [maintenance, setMaintenance] = useState(false);

  // Global maintenance check on mount
  useEffect(() => {
    fetch("/api/trpc/health?batch=1&input=%7B%7D")
      .then((res) => {
        if (res.status === 503) setMaintenance(true);
      })
      .catch(() => {
        // Network error — don't block UI
      });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {maintenance ? <MaintenanceScreen /> : <Router />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
