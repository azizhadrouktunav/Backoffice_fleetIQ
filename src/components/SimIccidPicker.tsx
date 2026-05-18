import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import type { SimCard, SimOffer } from '../state/FleetStore';

type SimIccidPickerProps = {
  label?: string;
  optional?: boolean;
  availableSims: SimCard[];
  selectedSimId: number | null;
  onSelectSimId: (id: number | null) => void;
  simOfferById: Map<number, SimOffer>;
  emptyMessage?: string;
  labelClassName?: string;
};

function SimIccidPreview({
  sim,
  offer,
  onClear
}: {
  sim: SimCard;
  offer?: SimOffer;
  onClear?: () => void;
}) {
  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm relative">
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          title="Retirer la puce"
        >
          <X size={14} />
        </button>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            N° de série puce (ICCID)
          </div>
          <div className="font-semibold text-slate-900 break-all mt-0.5">{sim.iccid || '—'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Carte SIM</div>
          <div className="font-semibold text-slate-900 mt-0.5">{sim.phoneNumber || '—'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">N° d'appel puce</div>
          <div className="font-semibold text-slate-900 mt-0.5">{sim.phoneNumber || '—'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Opérateur</div>
          <div className="font-semibold text-slate-900 mt-0.5">{offer?.operator || '—'}</div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Offre puce</div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {offer
              ? `${offer.name}${offer.operator ? ` - ${offer.operator}` : ''} — ${offer.pricePerSim.toFixed(2)} TND / puce`
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimIccidPicker({
  label = 'N° de série puce (ICCID)',
  optional = false,
  availableSims,
  selectedSimId,
  onSelectSimId,
  simOfferById,
  emptyMessage = 'Aucune puce disponible.',
  labelClassName = 'block text-xs font-medium text-slate-600 mb-1'
}: SimIccidPickerProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSim = useMemo(() => {
    if (selectedSimId == null) return undefined;
    return availableSims.find((s) => s.id === selectedSimId);
  }, [availableSims, selectedSimId]);

  const filteredSims = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableSims;
    return availableSims.filter(
      (s) =>
        s.iccid.toLowerCase().includes(q) ||
        (s.phoneNumber && s.phoneNumber.toLowerCase().includes(q))
    );
  }, [availableSims, search]);

  useEffect(() => {
    if (selectedSim) {
      setSearch(selectedSim.iccid);
    }
  }, [selectedSim?.id, selectedSim?.iccid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (sim: SimCard) => {
    onSelectSimId(sim.id);
    setSearch(sim.iccid);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectSimId(null);
    setSearch('');
    setIsOpen(false);
  };

  const offer = selectedSim?.offerId != null ? simOfferById.get(selectedSim.offerId) : undefined;

  return (
    <div ref={containerRef}>
      <label className={labelClassName}>
        {label}
        {optional && (
          <span className="text-[11px] text-slate-500 font-normal ml-1">— optionnel</span>
        )}
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            if (selectedSimId != null && value !== selectedSim?.iccid) {
              onSelectSimId(null);
            }
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un ICCID…"
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div className="mt-2 max-h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-md z-10">
          {availableSims.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400">{emptyMessage}</div>
          ) : filteredSims.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              Aucun ICCID ne correspond à la recherche.
            </div>
          ) : (
            filteredSims.map((sim) => (
              <button
                key={sim.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(sim)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                  selectedSimId === sim.id
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium break-all font-mono text-xs">{sim.iccid}</span>
                {selectedSimId === sim.id && <Check size={14} className="text-blue-600 shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}

      {selectedSim && <SimIccidPreview sim={selectedSim} offer={offer} onClear={handleClear} />}
    </div>
  );
}
