import { Route, Switch } from 'wouter';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, InvitePage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ReportViewPage } from './pages/ReportViewPage';
import { AdminDashboard } from './pages/AdminDashboard';

export function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/invite/:token" component={InvitePage} />
      <Route path="/dashboard/:id" component={ReportViewPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/amar-stats" component={AdminDashboard} />
      <Route component={LandingPage} />
    </Switch>
  );
}
