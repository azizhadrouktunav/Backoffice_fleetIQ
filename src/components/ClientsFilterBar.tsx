import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { PeriodFilter, PeriodKey } from './PeriodFilter';

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  expiryFilterEnabled: boolean;
  onExpiryFilterEnabledChange: (v: boolean) => void;
  periodFilter: PeriodKey;
  onPeriodChange: (v: PeriodKey) => void;
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (v: string) => void;
  onPeriodEndChange: (v: string) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
};

export function ClientsFilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  expiryFilterEnabled,
  onExpiryFilterEnabledChange,
  periodFilter,
  onPeriodChange,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  activeFilterCount,
  hasActiveFilters,
  onReset,
  filteredCount,
  totalCount
}: Props) {
  return (
    <div className="p-4 border-b border-slate-100 bg-slate-50/80 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <SlidersHorizontal size={16} className="text-slate-500" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 transition-colors">
            <X size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5">
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
            Recherche
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Nom, e-mail…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
            Type client
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
            <option value="">Tous les types</option>
            <option value="Simple">Simple</option>
            <option value="Revendeur">Revendeur</option>
          </select>
        </div>
        <div className="lg:col-span-4">
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
            <option value="">Tous les statuts</option>
            <option value="Active">Actif</option>
            <option value="Blocked">Bloqué</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={expiryFilterEnabled}
              onClick={() => onExpiryFilterEnabledChange(!expiryFilterEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                expiryFilterEnabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  expiryFilterEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar size={15} className="text-slate-400" />
              Filtrer par date d&apos;expiration
            </span>
          </label>
          {expiryFilterEnabled && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              <Filter size={11} />
              Filtre actif
            </span>
          )}
        </div>
        <AnimatePresence>
          {expiryFilterEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-slate-100">
                <PeriodFilter
                  value={periodFilter}
                  onChange={onPeriodChange}
                  startDate={periodStart}
                  endDate={periodEnd}
                  onStartDateChange={onPeriodStartChange}
                  onEndDateChange={onPeriodEndChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!expiryFilterEnabled && (
          <p className="mt-2 text-xs text-slate-400">
            Toutes les dates d&apos;expiration sont affichées. Activez le filtre pour restreindre la liste.
          </p>
        )}
      </div>

      <div className="text-xs text-slate-500">
        {filteredCount} client{filteredCount !== 1 ? 's' : ''} affiché
        {filteredCount !== totalCount ? ` sur ${totalCount}` : ''}
      </div>
    </div>
  );
}
