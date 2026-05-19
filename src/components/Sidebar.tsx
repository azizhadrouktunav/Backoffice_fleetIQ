import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Server,
  LogOut,
  Car,
  Wrench,
  Store,
  ShieldCheck,
  Wallet,
  Smartphone
} from 'lucide-react';
import { BackofficeRole } from '../pages/LoginPage';
import { useFleetStore } from '../state/FleetStore';

interface SidebarProps {
  role: BackofficeRole;
  onLogout: () => void;
}

type NavItemKey = 'dashboard' | 'clients' | 'subscriptions' | 'equipments' | 'sims';

const NAV_ITEMS: { key: NavItemKey; to: string; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'dashboard', to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { key: 'clients', to: '/clients', icon: Users, label: 'Gestion Clients' },
  { key: 'subscriptions', to: '/subscriptions', icon: Package, label: 'Packs' },
  { key: 'sims', to: '/sims', icon: Smartphone, label: 'Gestion des puces' },
  { key: 'equipments', to: '/equipments', icon: Server, label: 'Équipements' }
];

const ALLOWED_BY_ROLE: Record<BackofficeRole, NavItemKey[]> = {
  admin_tunav: ['dashboard', 'clients', 'subscriptions', 'sims', 'equipments'],
  sav_tunav: ['dashboard', 'sims', 'equipments'],
  finance_tunav: ['dashboard', 'clients', 'subscriptions'],
  revendeur: ['dashboard', 'clients', 'sims', 'equipments']
};

const ROLE_META: Record<
  BackofficeRole,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }
> = {
  admin_tunav: { label: 'Admin TUNAV', icon: ShieldCheck, color: 'from-cyan-500 to-blue-600' },
  sav_tunav: { label: 'SAV TUNAV', icon: Wrench, color: 'from-emerald-500 to-teal-600' },
  revendeur: { label: 'Revendeur', icon: Store, color: 'from-amber-500 to-orange-600' },
  finance_tunav: { label: 'Service Financier', icon: Wallet, color: 'from-fuchsia-500 to-purple-600' }
};

export function Sidebar({ role, onLogout }: SidebarProps) {
  const { currentUserName } = useFleetStore();
  const roleMeta = ROLE_META[role];
  const RoleIcon = roleMeta.icon;
  const allowed = new Set(ALLOWED_BY_ROLE[role]);
  const navItems = NAV_ITEMS.filter((item) => allowed.has(item.key));

  const isReseller = role === 'revendeur';
  const subtitle = isReseller ? currentUserName : roleMeta.label;

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <Car size={18} />
        </div>
        <span className="font-semibold text-base text-white">FleetAdmin</span>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div
            className={`w-8 h-8 rounded-md bg-gradient-to-br ${roleMeta.color} flex items-center justify-center text-white flex-shrink-0`}>
            <RoleIcon size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Connecté</div>
            <div className="text-xs text-white font-medium truncate">{roleMeta.label}</div>
            {isReseller && (
              <div className="text-[10px] text-amber-300 font-medium truncate">{subtitle}</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }>
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors w-full">
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
