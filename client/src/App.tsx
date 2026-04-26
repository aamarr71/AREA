import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Login from "./pages/Login";
import Invite from "./pages/Invite";
import Dashboard from "./pages/Dashboard";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

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

/**
 * Routes that don't require auth. Everything else redirects to /login when
 * no session is present.
 */
function isPublicPath(path: string): boolean {
  return path === "/login" || path.startsWith("/invite/");
}

function Router() {
  const [location] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  // Wait for the auth check before deciding what to render.
  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Lädt…
      </div>
    );
  }

  const me = meQuery.data;

  // Not logged in → only public routes are reachable.
  if (!me && !isPublicPath(location)) {
    return <Redirect to="/login" />;
  }

  // Logged in but on /login → bounce to home.
  if (me && location === "/login") {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/invite/:token" component={Invite} />
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/amar-stats" component={AdminDashboard} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [maintenance, setMaintenance] = useState(false);

  // Global maintenance check on mount
  useEffect(() => {
    fetch("/api/trpc/health?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D")
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
