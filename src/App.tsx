import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { EquipmentsPage } from './pages/EquipmentsPage';
import { SimsPage } from './pages/SimsPage';
import { LoginPage, BackofficeRole, LoginContext } from './pages/LoginPage';
import { useFleetStore } from './state/FleetStore';

export function App() {
  const { setCurrentUserRole, setCurrentUserName } = useFleetStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<BackofficeRole | null>(null);

  const handleLogin = (ctx: LoginContext) => {
    setCurrentRole(ctx.role);
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
    try {
      sessionStorage.removeItem('backoffice_role');
    } catch {
      // ignore
    }
  };

  if (!isAuthenticated || !currentRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Build allowed routes based on role
  const canAccess = (route: 'dashboard' | 'clients' | 'subscriptions' | 'equipments' | 'sims') => {
    switch (currentRole) {
      case 'admin_tunav':
        return true;
      case 'revendeur':
        return route !== 'subscriptions';
      case 'sav_tunav':
        return route === 'dashboard' || route === 'equipments' || route === 'sims';
      case 'finance_tunav':
        return route === 'dashboard' || route === 'clients' || route === 'subscriptions';
      default:
        return false;
    }
  };

  const defaultRoute =
    currentRole === 'sav_tunav'
      ? '/equipments'
      : currentRole === 'finance_tunav'
      ? '/subscriptions'
      : '/dashboard';

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
