import { Route, Switch, Redirect, useLocation } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { trpc } from './lib/trpc';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, InvitePage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ReportViewPage } from './pages/ReportViewPage';
import { AdminDashboard } from './pages/AdminDashboard';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';

function MaintenanceScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-[420px] rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 shadow-hair">
        <p className="font-display text-[34px] leading-tight text-[var(--area-ink)]">AREA befindet sich in Wartung</p>
        <p className="mt-3 text-[14px] leading-6 text-[var(--area-muted)]">Bitte versuchen Sie es später erneut.</p>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
      Lädt...
    </main>
  );
}

function isPublicPath(path: string): boolean {
  return path === '/' || path === '/login' || path === '/impressum' || path === '/datenschutz' || path.startsWith('/invite/');
}

function Router() {
  const [location] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  if (meQuery.isLoading && !isPublicPath(location)) {
    return <LoadingScreen />;
  }

  const me = meQuery.data;

  if (!me && !isPublicPath(location)) {
    return <Redirect to="/login" />;
  }

  if (me && location === '/login') {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/invite/:token" component={InvitePage} />
      <Route path="/dashboard/:id" component={ReportViewPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/amar-stats" component={AdminDashboard} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/" component={LandingPage} />
      <Route component={LandingPage} />
    </Switch>
  );
}

export function App() {
  const maintenance = false;

  return (
    <ErrorBoundary>
      {maintenance ? <MaintenanceScreen /> : <Router />}
    </ErrorBoundary>
  );
}

export default App;
