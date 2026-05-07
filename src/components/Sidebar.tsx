import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Server, LogOut, Car } from 'lucide-react';
export function Sidebar() {
  const navItems = [{
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Tableau de bord'
  }, {
    to: '/clients',
    icon: Users,
    label: 'Gestion Clients'
  }, {
    to: '/subscriptions',
    icon: Package,
    label: 'Packs'
  }, {
    to: '/equipments',
    icon: Server,
    label: 'Équipements'
  }];
  return <aside className="w-60 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <Car size={18} />
        </div>
        <span className="font-semibold text-base text-white">FleetAdmin</span>
      </div>

      <div className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3">
          Menu
        </div>
        {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({
        isActive
      }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <item.icon size={16} />
            {item.label}
          </NavLink>)}
      </div>

      <div className="p-3 border-t border-slate-800">
        <NavLink to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors w-full">
          <LogOut size={16} />
          Déconnexion
        </NavLink>
      </div>
    </aside>;
}