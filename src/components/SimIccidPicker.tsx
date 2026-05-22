import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check, X, Plus } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import type { SimCard, SimOffer } from '../state/FleetStore';

export const SIM_OPERATORS = ['Télécom', 'Orange', 'Ooredoo'] as const;

export type SimCreateContext = {
  clientName: string;
  reseller: string;
};

/** Nom d'offre automatique : puce clients "Nom Client" */
export function clientSimOfferName(clientName: string): string {
  return `puce clients "${clientName}"`;
}

export function isClientSimOfferName(offerName: string): boolean {
  return /^puce clients ".+"$/.test(offerName);
}

export function simHasClientSimOffer(
  sim: SimCard,
  offerById: Map<number, SimOffer>,
  clientName?: string
): boolean {
  if (sim.offerId == null) return false;
  const offer = offerById.get(sim.offerId);
  if (!offer || !isClientSimOfferName(offer.name)) return false;
  if (clientName) return offer.name === clientSimOfferName(clientName);
  return true;
}

export function ensureClientSimOffer(
  clientName: string,
  operator: string,
  simOffers: SimOffer[],
  setSimOffers: React.Dispatch<React.SetStateAction<SimOffer[]>>
): number {
  const name = clientSimOfferName(clientName);
  const existing = simOffers.find((o) => o.name === name);
  if (existing) {
    if (existing.operator !== operator) {
      setSimOffers((prev) =>
        prev.map((o) => (o.id === existing.id ? { ...o, operator } : o))
      );
    }
    return existing.id;
  }
  const nextId = simOffers.length ? Math.max(...simOffers.map((o) => o.id)) + 1 : 1;
  const next: SimOffer = {
    id: nextId,
    name,
    description: `Offre puce dédiée au client ${clientName}.`,
    pricePerSim: 0,
    operator
  };
  setSimOffers((prev) => [...prev, next]);
  return nextId;
}

type SimIccidPickerProps = {
  label?: string;
  optional?: boolean;
  availableSims: SimCard[];
  selectedSimId: number | null;
  onSelectSimId: (id: number | null) => void;
  simOfferById: Map<number, SimOffer>;
  simOffers?: SimOffer[];
  emptyMessage?: string;
  labelClassName?: string;
  allowCreate?: boolean;
  createContext?: SimCreateContext;
  setSimCards?: React.Dispatch<React.SetStateAction<SimCard[]>>;
  setSimOffers?: React.Dispatch<React.SetStateAction<SimOffer[]>>;
  allSimCards?: SimCard[];
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
  simOffers = [],
  emptyMessage = 'Aucune puce disponible.',
  labelClassName = 'block text-xs font-medium text-slate-600 mb-1',
  allowCreate = false,
  createContext,
  setSimCards,
  setSimOffers,
  allSimCards = []
}: SimIccidPickerProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createIccid, setCreateIccid] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createOperator, setCreateOperator] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canCreate = allowCreate && !!createContext && !!setSimCards && !!setSimOffers;

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

  const searchTrim = search.trim();
  const hasExactIccidMatch = useMemo(() => {
    if (!searchTrim) return false;
    const q = searchTrim.toLowerCase();
    return (
      availableSims.some((s) => s.iccid.toLowerCase() === q) ||
      allSimCards.some((s) => s.iccid.toLowerCase() === q)
    );
  }, [availableSims, allSimCards, searchTrim]);

  const showAddButton = canCreate && searchTrim.length > 0 && !hasExactIccidMatch && !isCreateOpen;

  const autoOfferName = createContext ? clientSimOfferName(createContext.clientName) : '';

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

  const openCreateForm = () => {
    if (!createContext) return;
    const clientOffer = simOffers.find((o) => o.name === clientSimOfferName(createContext.clientName));
    setCreateIccid(searchTrim);
    setCreatePhone('');
    setCreateOperator(clientOffer?.operator ?? SIM_OPERATORS[0]);
    setCreateError(null);
    setIsCreateOpen(true);
    setIsOpen(false);
  };

  const handleCreateSim = () => {
    if (!createContext || !setSimCards || !setSimOffers) return;
    const iccid = createIccid.trim();
    if (!iccid) {
      setCreateError('Le numéro CCID (ICCID) est obligatoire.');
      return;
    }
    if (!createOperator.trim()) {
      setCreateError('Veuillez sélectionner un opérateur téléphonique.');
      return;
    }
    if (allSimCards.some((s) => s.iccid.toLowerCase() === iccid.toLowerCase())) {
      setCreateError('Ce numéro ICCID existe déjà.');
      return;
    }

    const offerId = ensureClientSimOffer(
      createContext.clientName,
      createOperator.trim(),
      simOffers,
      setSimOffers
    );

    const nextId = allSimCards.length ? Math.max(...allSimCards.map((s) => s.id)) + 1 : 1;
    const next: SimCard = {
      id: nextId,
      offerId,
      phoneNumber: createPhone.trim(),
      iccid,
      client: createContext.clientName,
      reseller: createContext.reseller
    };
    setSimCards((prev) => [next, ...prev]);
    onSelectSimId(nextId);
    setSearch(iccid);
    setIsCreateOpen(false);
    setCreateError(null);
  };

  const handleSelect = (sim: SimCard) => {
    onSelectSimId(sim.id);
    setSearch(sim.iccid);
    setIsOpen(false);
    setIsCreateOpen(false);
  };

  const handleClear = () => {
    onSelectSimId(null);
    setSearch('');
    setIsOpen(false);
    setIsCreateOpen(false);
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
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={14}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            if (selectedSimId != null && value !== selectedSim?.iccid) {
              onSelectSimId(null);
            }
            setIsCreateOpen(false);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un ICCID…"
          className={`w-full pl-9 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white ${
            showAddButton ? 'pr-10' : 'pr-4'
          }`}
          autoComplete="off"
        />
        {showAddButton && (
          <button
            type="button"
            onClick={openCreateForm}
            title={`Ajouter la puce ${searchTrim}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {isOpen && !isCreateOpen && (
        <div className="mt-2 max-h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-md z-10">
          {availableSims.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400">{emptyMessage}</div>
          ) : filteredSims.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              {canCreate && searchTrim ? (
                <span>
                  Aucun ICCID ne correspond.{' '}
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="text-emerald-700 font-medium hover:underline"
                  >
                    Ajouter « {searchTrim} »
                  </button>
                </span>
              ) : (
                'Aucun ICCID ne correspond à la recherche.'
              )}
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

      {isCreateOpen && createContext && (
        <div className="mt-3 border border-emerald-200 bg-emerald-50/40 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-slate-900">Ajouter une nouvelle puce</p>
          <p className="text-xs text-slate-600">
            Client&nbsp;: <strong>{createContext.clientName}</strong>
          </p>
          <p className="text-xs text-slate-600 bg-white/80 border border-slate-200 rounded-lg px-3 py-2">
            Offre&nbsp;: <strong className="text-slate-900">{autoOfferName}</strong>
            <span className="text-slate-500"> (attribuée automatiquement)</span>
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Opérateur téléphonique <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={createOperator}
              onChange={setCreateOperator}
              options={[...SIM_OPERATORS]}
              placeholder="Sélectionner un opérateur…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Numéro CCID (ICCID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createIccid}
              onChange={(e) => setCreateIccid(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Numéro puce</label>
            <input
              type="text"
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="Ex: +216 71 12 34 56"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">Optionnel.</p>
          </div>

          {createError && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-2 text-xs">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateError(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreateSim}
              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Ajouter la puce
            </button>
          </div>
        </div>
      )}

      {selectedSim && !isCreateOpen && (
        <SimIccidPreview sim={selectedSim} offer={offer} onClear={handleClear} />
      )}
    </div>
  );
}
