import React from 'react';
import { CalendarIcon } from 'lucide-react';

export type PeriodKey = 'today' | '7d' | '30d' | '3m' | 'custom';

interface PeriodFilterProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  /** inline = barre compacte (tableau de bord) ; block = pleine largeur (modales, filtres) */
  variant?: 'inline' | 'block';
}

const periods: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '3m', label: '3 mois' },
  { key: 'custom', label: 'Personnalisé' }
];

export function PeriodFilter({
  value,
  onChange,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  variant = 'block'
}: PeriodFilterProps) {
  const isInline = variant === 'inline';

  return (
    <div
      className={`flex flex-col gap-2 min-w-0 ${isInline ? 'w-fit shrink-0' : 'w-full'}`}
    >
      <div
        className={`inline-flex items-center bg-white border border-slate-200 rounded-lg shadow-sm ${
          isInline ? 'p-1 gap-0.5 flex-nowrap' : 'flex flex-wrap gap-1 p-1.5 w-full min-w-0'
        }`}
      >
        <CalendarIcon
          size={14}
          className={`text-slate-400 shrink-0 ${isInline ? 'ml-2 mr-0.5' : 'ml-1.5'}`}
        />
        {periods.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            className={`font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              isInline ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1.5 text-xs'
            } ${
              value === p.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div
          className={`flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 shadow-sm min-w-0 ${
            isInline ? 'w-fit' : 'w-full'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>
        </div>
      )}
    </div>
  );
}
