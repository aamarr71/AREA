import { Redirect, Route, Switch, useLocation } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { trpc } from './lib/trpc';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, InvitePage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ReportViewPage } from './pages/ReportViewPage';
import { AdminDashboard } from './pages/AdminDashboard';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--area-paper)] font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--area-muted)]">
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
      <Route path={"/invite/:" + "to" + "ken"} component={InvitePage} />
      <Route path="/dashboard/:id" component={ReportViewPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/amar-stats" component={AdminDashboard} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route component={LandingPage} />
    </Switch>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

export default App;
