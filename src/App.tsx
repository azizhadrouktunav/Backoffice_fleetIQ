import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { EquipmentsPage } from './pages/EquipmentsPage';
import { SimsPage } from './pages/SimsPage';
import { LoginPage, LoginContext } from './pages/LoginPage';
import { useFleetStore } from './state/FleetStore';
import {
  canAccessRoute,
  getDefaultRoute,
  type BackofficeRole,
  type BackofficeRouteKey
} from './utils/backofficePermissions';

export function App() {
  const { setCurrentUserRole, setCurrentUserName, setBackofficeRole } = useFleetStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<BackofficeRole | null>(null);

  const handleLogin = (ctx: LoginContext) => {
    setCurrentRole(ctx.role);
    setBackofficeRole(ctx.role);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('backoffice_role', ctx.role);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUserRole('Tunav');
    setCurrentUserName('Tunav');
    setBackofficeRole(null);
    try {
      sessionStorage.removeItem('backoffice_role');
    } catch {
      // ignore
    }
  };

  if (!isAuthenticated || !currentRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const canAccess = (route: BackofficeRouteKey) => canAccessRoute(currentRole, route);
  const defaultRoute = getDefaultRoute(currentRole);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />

        <Route element={<Layout role={currentRole} onLogout={handleLogout} />}>
          {canAccess('dashboard') && <Route path="/dashboard" element={<DashboardPage />} />}
          {canAccess('clients') && <Route path="/clients" element={<ClientsPage />} />}
          {canAccess('subscriptions') && <Route path="/subscriptions" element={<SubscriptionsPage />} />}
          {canAccess('equipments') && <Route path="/equipments" element={<EquipmentsPage />} />}
          {canAccess('sims') && <Route path="/sims" element={<SimsPage />} />}
        </Route>

        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Router>
  );
}
