import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import type { BackofficeRole } from '../utils/backofficePermissions';

interface LayoutProps {
  role: BackofficeRole;
  onLogout: () => void;
}

export function Layout({ role, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar role={role} onLogout={onLogout} />
      <main className="flex-1 ml-60 p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
