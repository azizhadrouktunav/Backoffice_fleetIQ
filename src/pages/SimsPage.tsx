import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Smartphone,
  Boxes,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  Hash,
  Tag,
  Package,
  Link2,
  Unlink,
  ArrowLeftRight,
  X
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { SearchableSelect } from '../components/SearchableSelect';
import {
  SimTableContextMenu,
  type SimRowContextMenuState
} from '../components/SimTableContextMenu';
import { SimCard, SimOffer, useFleetStore } from '../state/FleetStore';
import { useBackofficePermissions } from '../hooks/useBackofficePermissions';
import { clientSimOfferName, simHasClientSimOffer } from '../components/SimIccidPicker';
import {
  getAssignableSimTargets,
  getSimAssignmentClientName
} from '../utils/fleetAssignment';

type SimStatus = 'assigned_equipment' | 'assigned_client' | 'stock';

const STATUS_META: Record<SimStatus, { label: string; badge: string; dot: string }> = {
  assigned_equipment: {
    label: 'Affectée à un équipement',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  assigned_client: {
    label: 'Non affectée à un équipement',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  stock: {
    label: 'Stock',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  }
};

const OPERATORS = ['Télécom', 'Orange', 'Ooredoo'];

function getSimStatus(sim: SimCard): SimStatus {
  if (sim.equipmentId != null) return 'assigned_equipment';
  if (sim.client.endsWith('_Stock')) return 'stock';
  return 'assigned_client';
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function SimsPage() {
  const {
    currentUserRole,
    currentUserName,
    clients,
    equipments,
    simOffers,
    setSimOffers,
    simCards,
    setSimCards
  } = useFleetStore();
  const permissions = useBackofficePermissions();
  const canManageSims = permissions?.sims.canManage ?? false;

  const isTunavUser = currentUserRole === 'Tunav';

  const stockClientName = useMemo(
    () => (isTunavUser ? 'Tunav_Stock' : `${currentUserName}_Stock`),
    [isTunavUser, currentUserName]
  );

  // Clients visibles pour l'affectation (clients simples du périmètre courant)
  const assignableClients = useMemo(
    () => getAssignableSimTargets(clients, isTunavUser, currentUserName),
    [clients, isTunavUser, currentUserName]
  );

  const visibleSims = useMemo(() => {
    if (isTunavUser) return simCards;
    return simCards.filter((s) => s.reseller === currentUserName);
  }, [simCards, isTunavUser, currentUserName]);

  // --- Search / filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SimStatus>('all');
  const [offerFilter, setOfferFilter] = useState<number | 'all'>('all');
  const [clientOfferFilter, setClientOfferFilter] = useState('');

  const offerById = useMemo(() => new Map(simOffers.map((o) => [o.id, o])), [simOffers]);
  const equipmentById = useMemo(() => new Map(equipments.map((e) => [e.id, e])), [equipments]);

  const filteredSims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleSims.filter((sim) => {
      if (statusFilter !== 'all' && getSimStatus(sim) !== statusFilter) return false;
      if (offerFilter !== 'all' && sim.offerId !== offerFilter) return false;
      if (!q) return true;
      const offer = sim.offerId != null ? offerById.get(sim.offerId) : undefined;
      return (
        sim.phoneNumber.toLowerCase().includes(q) ||
        sim.iccid.toLowerCase().includes(q) ||
        (offer?.operator?.toLowerCase().includes(q) ?? false) ||
        sim.client.toLowerCase().includes(q)
      );
    });
  }, [visibleSims, searchQuery, statusFilter, offerFilter, offerById]);

  // --- Stats ---
  const totalSims = visibleSims.length;
  const inStockSims = visibleSims.filter((s) => getSimStatus(s) === 'stock').length;
  const assignedToEquipment = visibleSims.filter((s) => getSimStatus(s) === 'assigned_equipment').length;
  const assignedNoEquipment = visibleSims.filter((s) => getSimStatus(s) === 'assigned_client').length;

  const clientOfferFilterOptions = useMemo(
    () => assignableClients.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [assignableClients]
  );

  const clientOfferSimStats = useMemo(() => {
    const allClientOfferSims = visibleSims.filter((s) => simHasClientSimOffer(s, offerById));
    const filtered = clientOfferFilter
      ? allClientOfferSims.filter((s) => simHasClientSimOffer(s, offerById, clientOfferFilter))
      : allClientOfferSims;
    return {
      total: allClientOfferSims.length,
      filtered: filtered.length
    };
  }, [visibleSims, offerById, clientOfferFilter]);

  // Pour chaque offre, on calcule:
  //  - installed : nb d'équipements installés dont la puce SIM utilise cette offre
  //  - total    : nb total de puces visibles utilisant cette offre
  const offerStats = useMemo(() => {
    const m = new Map<number, { installed: number; total: number }>();
    for (const sim of visibleSims) {
      if (sim.offerId == null) continue;
      const cur = m.get(sim.offerId) ?? { installed: 0, total: 0 };
      cur.total += 1;
      if (sim.equipmentId != null) {
        const eq = equipmentById.get(sim.equipmentId);
        if (eq?.isInstalled) cur.installed += 1;
      }
      m.set(sim.offerId, cur);
    }
    return m;
  }, [visibleSims, equipmentById]);

  const totalInstalledAllOffers = useMemo(
    () => Array.from(offerStats.values()).reduce((a, b) => a + b.installed, 0),
    [offerStats]
  );
  const totalSimsAllOffers = useMemo(
    () => Array.from(offerStats.values()).reduce((a, b) => a + b.total, 0),
    [offerStats]
  );

  // --- Add/Edit SIM modal ---
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simEditingId, setSimEditingId] = useState<number | null>(null);
  const [simForm, setSimForm] = useState<{
    offerId: number | null;
    phoneNumber: string;
    iccid: string;
  }>({
    offerId: simOffers[0]?.id ?? null,
    phoneNumber: '',
    iccid: ''
  });
  const [simError, setSimError] = useState<string | null>(null);

  // --- Offer modal ---
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerEditingId, setOfferEditingId] = useState<number | null>(null);
  const [offerForm, setOfferForm] = useState<{
    name: string;
    description: string;
    operator: string;
    pricePerSim: number;
  }>({
    name: '',
    description: '',
    operator: '',
    pricePerSim: 0
  });
  const [offerError, setOfferError] = useState<string | null>(null);
  const [isOffersListOpen, setIsOffersListOpen] = useState(false);

  // --- Selection & assign-to-client ---
  const [selectedSimIds, setSelectedSimIds] = useState<Set<number>>(new Set());
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignSimIds, setAssignSimIds] = useState<number[]>([]);
  const [assignClientName, setAssignClientName] = useState<string>('');

  const isSimSelectable = (sim: SimCard) => getSimStatus(sim) !== 'assigned_equipment';

  const selectableFilteredSims = useMemo(
    () => filteredSims.filter(isSimSelectable),
    [filteredSims]
  );

  const allSelectableSelected =
    selectableFilteredSims.length > 0 &&
    selectableFilteredSims.every((s) => selectedSimIds.has(s.id));

  const someSelectableSelected = selectableFilteredSims.some((s) => selectedSimIds.has(s.id));

  const assignSimsPreview = useMemo(
    () => assignSimIds.map((id) => visibleSims.find((s) => s.id === id)).filter(Boolean) as SimCard[],
    [assignSimIds, visibleSims]
  );

  // --- Delete confirm modal ---
  const [simToDelete, setSimToDelete] = useState<SimCard | null>(null);

  const [contextMenu, setContextMenu] = useState<SimRowContextMenuState>(null);

  const openCreateSim = () => {
    setSimEditingId(null);
    setSimForm({
      offerId: simOffers[0]?.id ?? null,
      phoneNumber: '',
      iccid: ''
    });
    setSimError(null);
    setIsSimModalOpen(true);
  };

  const openEditSim = (sim: SimCard) => {
    setSimEditingId(sim.id);
    setSimForm({
      offerId: sim.offerId,
      phoneNumber: sim.phoneNumber,
      iccid: sim.iccid
    });
    setSimError(null);
    setIsSimModalOpen(true);
  };

  const validateSimForm = () => {
    if (simForm.offerId == null) return 'Veuillez sélectionner une offre puce.';
    const iccid = simForm.iccid.trim();
    if (!iccid) return 'Le numéro CCID (ICCID) est obligatoire.';
    return null;
  };

  const upsertSim = () => {
    const error = validateSimForm();
    if (error) {
      setSimError(error);
      return;
    }
    const phone = simForm.phoneNumber.trim();
    const iccid = simForm.iccid.trim();

    setSimCards((prev) => {
      if (simEditingId === null) {
        const nextId = prev.length ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
        const next: SimCard = {
          id: nextId,
          offerId: simForm.offerId,
          phoneNumber: phone,
          iccid,
          client: stockClientName,
          reseller: isTunavUser ? 'Tunav' : currentUserName
        };
        return [next, ...prev];
      }
      return prev.map((s) =>
        s.id === simEditingId
          ? {
              ...s,
              offerId: simForm.offerId,
              phoneNumber: phone,
              iccid
            }
          : s
      );
    });
    setIsSimModalOpen(false);
  };

  const openCreateOffer = () => {
    setOfferEditingId(null);
    setOfferForm({ name: '', description: '', operator: '', pricePerSim: 0 });
    setOfferError(null);
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer: SimOffer) => {
    setOfferEditingId(offer.id);
    setOfferForm({
      name: offer.name,
      description: offer.description,
      operator: offer.operator,
      pricePerSim: offer.pricePerSim
    });
    setOfferError(null);
    setIsOfferModalOpen(true);
  };

  const upsertOffer = () => {
    if (!offerForm.name.trim()) {
      setOfferError('Le nom de l’offre est obligatoire.');
      return;
    }
    if (!offerForm.operator.trim()) {
      setOfferError('L’opérateur téléphonique est obligatoire.');
      return;
    }
    if (!Number.isFinite(offerForm.pricePerSim) || offerForm.pricePerSim < 0) {
      setOfferError('Le prix par puce doit être un nombre positif.');
      return;
    }
    setSimOffers((prev) => {
      if (offerEditingId === null) {
        const nextId = prev.length ? Math.max(...prev.map((o) => o.id)) + 1 : 1;
        return [
          ...prev,
          {
            id: nextId,
            name: offerForm.name.trim(),
            description: offerForm.description.trim(),
            operator: offerForm.operator.trim(),
            pricePerSim: Number(offerForm.pricePerSim)
          }
        ];
      }
      return prev.map((o) =>
        o.id === offerEditingId
          ? {
              ...o,
              name: offerForm.name.trim(),
              description: offerForm.description.trim(),
              operator: offerForm.operator.trim(),
              pricePerSim: Number(offerForm.pricePerSim)
            }
          : o
      );
    });
    setIsOfferModalOpen(false);
  };

  const deleteOffer = (offerId: number) => {
    setSimOffers((prev) => prev.filter((o) => o.id !== offerId));
    setSimCards((prev) => prev.map((s) => (s.offerId === offerId ? { ...s, offerId: null } : s)));
  };

  const toggleSimSelection = (simId: number) => {
    setSelectedSimIds((prev) => {
      const next = new Set(prev);
      if (next.has(simId)) next.delete(simId);
      else next.add(simId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allSelectableSelected) {
      setSelectedSimIds((prev) => {
        const next = new Set(prev);
        for (const s of selectableFilteredSims) next.delete(s.id);
        return next;
      });
    } else {
      setSelectedSimIds((prev) => {
        const next = new Set(prev);
        for (const s of selectableFilteredSims) next.add(s.id);
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedSimIds(new Set());

  const closeAssignModal = () => {
    setIsAssignOpen(false);
    setAssignSimIds([]);
    setAssignClientName('');
  };

  const openAssignToClient = (sim: SimCard) => {
    setAssignSimIds([sim.id]);
    setAssignClientName(sim.client.endsWith('_Stock') ? '' : sim.client);
    setIsAssignOpen(true);
  };

  const openBulkAssignToClient = () => {
    const ids = Array.from(selectedSimIds);
    if (ids.length === 0) return;
    setAssignSimIds(ids);
    setAssignClientName('');
    setIsAssignOpen(true);
  };

  const getBulkAssignIdsForSim = (sim: SimCard) => {
    const ids = new Set(selectedSimIds);
    if (isSimSelectable(sim)) ids.add(sim.id);
    return Array.from(ids).filter((id) => {
      const s = visibleSims.find((x) => x.id === id);
      return s != null && isSimSelectable(s);
    });
  };

  const openBulkAssignFromContext = (sim: SimCard) => {
    const ids = getBulkAssignIdsForSim(sim);
    if (ids.length === 0) return;
    setSelectedSimIds(new Set(ids));
    setAssignSimIds(ids);
    setAssignClientName('');
    setIsAssignOpen(true);
  };

  const handleRowContextMenu = (e: React.MouseEvent, sim: SimCard) => {
    e.preventDefault();
    setContextMenu({ sim, x: e.clientX, y: e.clientY });
  };

  const confirmAssignToClient = () => {
    if (assignSimIds.length === 0 || !assignClientName) return;
    const client = clients.find((c) => c.name === assignClientName);
    if (!client) return;
    const idSet = new Set(assignSimIds);
    const targetClient = getSimAssignmentClientName(client);
    const targetReseller = client.type === 'Revendeur' ? client.name : client.reseller;
    setSimCards((prev) =>
      prev.map((s) =>
        idSet.has(s.id) ? { ...s, client: targetClient, reseller: targetReseller } : s
      )
    );
    closeAssignModal();
    clearSelection();
  };

  const unassignSim = (sim: SimCard) => {
    setSimCards((prev) =>
      prev.map((s) =>
        s.id === sim.id
          ? {
              ...s,
              client: isTunavUser ? 'Tunav_Stock' : `${currentUserName}_Stock`,
              reseller: isTunavUser ? 'Tunav' : currentUserName,
              equipmentId: undefined
            }
          : s
      )
    );
  };

  const confirmDeleteSim = () => {
    if (!simToDelete) return;
    setSimCards((prev) => prev.filter((s) => s.id !== simToDelete.id));
    setSimToDelete(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Gestion des Puces</h1>
          <p className="text-sm text-slate-500">
            Gérez les puces SIM, leurs offres tarifaires et leur affectation aux clients et équipements.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManageSims && (
          <>
          <button
            onClick={() => setIsOffersListOpen(true)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Tag size={16} />
            Offres puce
          </button>
          <button
            onClick={openCreateSim}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Ajouter une puce
          </button>
          </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total puces"
          value={totalSims.toString()}
          subtitle="Puces gérées"
          icon={Smartphone}
        />
        <StatCard
          title="Affectées à un équipement"
          value={assignedToEquipment.toString()}
          trend={`${totalSims ? Math.round((assignedToEquipment / totalSims) * 100) : 0}%`}
          trendUp={true}
          subtitle="Puces en service"
          icon={Wifi}
        />
        <StatCard
          title="Non affectées"
          value={assignedNoEquipment.toString()}
          trend={`${totalSims ? Math.round((assignedNoEquipment / totalSims) * 100) : 0}%`}
          trendUp={false}
          subtitle="Client défini, sans équipement"
          icon={Link2}
        />
        <StatCard
          title="En stock"
          value={inStockSims.toString()}
          trend={`${totalSims ? Math.round((inStockSims / totalSims) * 100) : 0}%`}
          trendUp={true}
          subtitle="Disponibles à l'affectation"
          icon={Boxes}
        />
      </div>

      {/* Stats par offre — équipements installés */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Équipements installés par offre
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nombre total d'équipements <strong>installés</strong> dont la puce SIM utilise chaque offre.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
            <Wifi size={12} />
            Total&nbsp;:&nbsp;
            <strong className="text-slate-900">
              {totalInstalledAllOffers} / {totalSimsAllOffers}
            </strong>
            <span className="text-slate-500">installés / puces</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">Puces offre puce clients</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {clientOfferFilter
                    ? clientSimOfferName(clientOfferFilter)
                    : 'Toutes les offres « puce clients »'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Tag size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                {clientOfferFilter
                  ? clientOfferSimStats.filtered
                  : clientOfferSimStats.total}
              </span>
              <span className="text-xs text-slate-500">
                puce
                {(clientOfferFilter ? clientOfferSimStats.filtered : clientOfferSimStats.total) > 1
                  ? 's'
                  : ''}
              </span>
              {clientOfferFilter && (
                <span className="text-xs text-slate-400">
                  ({clientOfferSimStats.total} au total)
                </span>
              )}
            </div>

            <div className="pt-1 border-t border-slate-100">
              <SearchableSelect
                label="Filtrer par client"
                value={clientOfferFilter}
                onChange={setClientOfferFilter}
                options={clientOfferFilterOptions}
                placeholder="Tous les clients"
              />
            </div>
          </div>

          {simOffers.map((offer) => {
              const stats = offerStats.get(offer.id) ?? { installed: 0, total: 0 };
              const { installed, total } = stats;
              const installRate = total ? Math.round((installed / total) * 100) : 0;
              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-blue-500 shadow-sm p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{offer.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                          <Wifi size={11} />
                          {offer.operator}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatPrice(offer.pricePerSim)} / puce</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Package size={18} />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-slate-900">
                      {installed}
                      <span className="text-slate-400 font-normal"> / {total}</span>
                    </span>
                    <span className="text-xs text-slate-500">installés / puces</span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${installRate}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{installRate}% installés</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferFilter(offer.id);
                          setStatusFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Voir les puces →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par numéro, ICCID, opérateur, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="assigned_equipment">Affectée à un équipement</option>
              <option value="assigned_client">Non affectée à un équipement</option>
              <option value="stock">Stock</option>
            </select>
            <select
              value={offerFilter === 'all' ? 'all' : String(offerFilter)}
              onChange={(e) => setOfferFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les offres</option>
              {simOffers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSimIds.size > 0 && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold">
                {selectedSimIds.size}
              </span>
              <span className="font-medium">
                puce{selectedSimIds.size > 1 ? 's' : ''} sélectionnée{selectedSimIds.size > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={14} />
                Tout désélectionner
              </button>
              <button
                type="button"
                onClick={openBulkAssignToClient}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <ArrowLeftRight size={14} />
                Affecter au client
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto" onContextMenu={(e) => e.preventDefault()}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelectableSelected && !allSelectableSelected;
                    }}
                    onChange={toggleSelectAllFiltered}
                    disabled={selectableFilteredSims.length === 0}
                    title="Tout sélectionner (puces affectables)"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4 font-medium">Numéro puce / CCID</th>
                <th className="p-4 font-medium">Opérateur</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Offre puce</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filteredSims.map((sim) => {
                const status = getSimStatus(sim);
                const offer = sim.offerId != null ? offerById.get(sim.offerId) : undefined;
                const equipment = sim.equipmentId != null ? equipmentById.get(sim.equipmentId) : undefined;
                const isStock = sim.client.endsWith('_Stock');
                const meta = STATUS_META[status];
                const selectable = isSimSelectable(sim);
                const isSelected = selectedSimIds.has(sim.id);

                return (
                  <tr
                    key={sim.id}
                    className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/60' : ''} ${contextMenu?.sim.id === sim.id ? 'ring-1 ring-inset ring-blue-300' : ''}`}
                    onContextMenu={(e) => handleRowContextMenu(e, sim)}
                  >
                    <td className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!selectable}
                        onChange={() => toggleSimSelection(sim.id)}
                        title={
                          selectable
                            ? 'Sélectionner pour affectation groupée'
                            : 'Non sélectionnable (affectée à un équipement)'
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        {sim.phoneNumber ? (
                          <span className="font-medium text-slate-900 inline-flex items-center gap-1.5">
                            <Smartphone size={14} className="text-slate-400" />
                            {sim.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Pas de numéro</span>
                        )}
                        {sim.iccid ? (
                          <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                            <Hash size={11} />
                            ICCID&nbsp;: {sim.iccid}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pas d'ICCID</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">{offer?.operator || '—'}</td>
                    <td className="p-4">
                      {isStock ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Boxes size={12} />
                          Stock&nbsp;
                          <span className="text-slate-400">({sim.reseller})</span>
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium">{sim.client}</span>
                          {equipment && (
                            <span className="text-[11px] text-slate-500">
                              Équipement&nbsp;: <strong>{equipment.serial}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {offer ? (
                        <div className="flex flex-col">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 self-start">
                            {offer.name}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">{formatPrice(offer.pricePerSim)} / puce</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Aucune offre</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border ${meta.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {canManageSims && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditSim(sim)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Modifier la puce"
                        >
                          <Edit2 size={16} />
                        </button>
                        {status !== 'assigned_equipment' && (
                          <button
                            onClick={() => openAssignToClient(sim)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Affecter à un client"
                          >
                            <ArrowLeftRight size={16} />
                          </button>
                        )}
                        {status === 'assigned_client' && (
                          <button
                            onClick={() => unassignSim(sim)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Retirer du client (retour au stock)"
                          >
                            <Unlink size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setSimToDelete(sim)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer la puce"
                          disabled={status === 'assigned_equipment'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredSims.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucune puce trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {contextMenu && (() => {
        const sim = contextMenu.sim;
        const status = getSimStatus(sim);
        const selectable = isSimSelectable(sim);
        const bulkIds = getBulkAssignIdsForSim(sim);
        return (
          <SimTableContextMenu
            menu={contextMenu}
            onClose={() => setContextMenu(null)}
            selectedCount={selectedSimIds.size}
            isRowSelected={selectedSimIds.has(sim.id)}
            isSelectable={selectable}
            canAssign={status !== 'assigned_equipment'}
            canUnassign={status === 'assigned_client'}
            canDelete={status !== 'assigned_equipment'}
            bulkAssignCount={bulkIds.length}
            onEdit={() => openEditSim(sim)}
            onAssign={() => openAssignToClient(sim)}
            onUnassign={() => unassignSim(sim)}
            onDelete={() => setSimToDelete(sim)}
            onToggleSelection={() => toggleSimSelection(sim.id)}
            onBulkAssign={() => openBulkAssignFromContext(sim)}
          />
        );
      })()}

      {/* --- ADD/EDIT SIM MODAL --- */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title={simEditingId === null ? 'Ajouter une puce' : 'Modifier la puce'}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>
              Le <strong>numéro CCID (ICCID)</strong> est obligatoire. L'opérateur téléphonique est défini au
              niveau de l'offre puce.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Package size={14} className="text-slate-500" />
              Offre puce <span className="text-red-500">*</span>
            </label>
            <select
              value={simForm.offerId ?? ''}
              onChange={(e) =>
                setSimForm((f) => ({ ...f, offerId: e.target.value ? Number(e.target.value) : null }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow bg-white"
            >
              <option value="">— Sélectionner une offre —</option>
              {simOffers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} — {o.operator} ({formatPrice(o.pricePerSim)})
                </option>
              ))}
            </select>
            {simForm.offerId != null && (() => {
              const selectedOffer = offerById.get(simForm.offerId);
              if (!selectedOffer) return null;
              return (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <Wifi size={11} />
                  Opérateur de l'offre&nbsp;: <strong className="text-slate-700">{selectedOffer.operator}</strong>
                </p>
              );
            })()}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash size={14} className="text-slate-500" />
              Numéro CCID (ICCID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={simForm.iccid}
              onChange={(e) => setSimForm((f) => ({ ...f, iccid: e.target.value }))}
              placeholder="Ex: 89330123456789012345"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Smartphone size={14} className="text-slate-500" />
              Numéro puce
            </label>
            <input
              type="text"
              value={simForm.phoneNumber}
              onChange={(e) => setSimForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              placeholder="Ex: +216 71 12 34 56"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
            <p className="text-[11px] text-slate-500 mt-1">Optionnel.</p>
          </div>

          {simError && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{simError}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsSimModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
            >
              <XCircle size={16} />
              Annuler
            </button>
            <button
              onClick={upsertSim}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {simEditingId === null ? 'Ajouter la puce' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- OFFER LIST MODAL --- */}
      <Modal
        isOpen={isOffersListOpen}
        onClose={() => setIsOffersListOpen(false)}
        title="Offres puce"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Créez et gérez les offres tarifaires applicables aux puces SIM.
            </p>
            <button
              onClick={openCreateOffer}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={14} />
              Nouvelle offre
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-50 overflow-hidden">
            {simOffers.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">Aucune offre. Créez-en une nouvelle.</div>
            )}
            {simOffers.map((offer) => {
              const usage = simCards.filter((s) => s.offerId === offer.id).length;
              return (
                <div key={offer.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {offer.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        <Wifi size={11} />
                        {offer.operator}
                      </span>
                      <span className="text-xs font-medium text-slate-600">{formatPrice(offer.pricePerSim)} / puce</span>
                      <span className="text-[11px] text-slate-500">
                        {usage} puce{usage > 1 ? 's' : ''} associée{usage > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1.5">{offer.description || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditOffer(offer)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier l'offre"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Supprimer l'offre"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* --- OFFER CREATE/EDIT MODAL --- */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={offerEditingId === null ? 'Créer une offre puce' : 'Modifier une offre puce'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'offre <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={offerForm.name}
              onChange={(e) => setOfferForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Data 5 Go + SMS"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={offerForm.description}
              onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez le contenu de l'offre…"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Wifi size={14} className="text-slate-500" />
              Opérateur téléphonique <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={offerForm.operator}
              onChange={(v) => setOfferForm((f) => ({ ...f, operator: v }))}
              options={OPERATORS}
              placeholder="Sélectionner un opérateur..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prix par puce (TND) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={offerForm.pricePerSim}
              onChange={(e) => setOfferForm((f) => ({ ...f, pricePerSim: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>

          {offerError && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{offerError}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsOfferModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={upsertOffer}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- ASSIGN-TO-CLIENT MODAL --- */}
      <Modal
        isOpen={isAssignOpen}
        onClose={closeAssignModal}
        title={
          assignSimIds.length > 1
            ? `Affecter ${assignSimIds.length} puces à un client`
            : 'Affecter la puce à un client'
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <ArrowLeftRight className="shrink-0 mt-0.5" size={16} />
            <p>
              {assignSimIds.length > 1
                ? `Sélectionnez le client auquel affecter les ${assignSimIds.length} puces. Elles sortiront du stock et pourront ensuite être associées à des équipements.`
                : 'Sélectionnez le client auquel affecter cette puce. La puce sortira du stock et pourra ensuite être associée à un équipement.'}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {assignSimsPreview.length > 1 ? 'Puces sélectionnées' : 'Puce sélectionnée'}
            </p>
            <ul className="max-h-40 overflow-y-auto divide-y divide-slate-200">
              {assignSimsPreview.map((sim) => {
                const offer = sim.offerId != null ? offerById.get(sim.offerId) : undefined;
                return (
                  <li key={sim.id} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-0.5">
                    {sim.phoneNumber ? (
                      <span className="font-medium text-slate-900">{sim.phoneNumber}</span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Pas de numéro</span>
                    )}
                    {sim.iccid && (
                      <span className="text-[11px] text-slate-500">
                        ICCID&nbsp;: <strong>{sim.iccid}</strong>
                      </span>
                    )}
                    {offer && (
                      <span className="text-[11px] text-slate-500">
                        {offer.name} · {offer.operator}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
            <SearchableSelect
              value={assignClientName}
              onChange={setAssignClientName}
              options={assignableClients.map((c) => c.name)}
              placeholder="Sélectionner un client..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={closeAssignModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmAssignToClient}
              disabled={!assignClientName}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {assignSimIds.length > 1 ? `Affecter ${assignSimIds.length} puces` : 'Affecter'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Modal
        isOpen={simToDelete !== null}
        onClose={() => setSimToDelete(null)}
        title="Supprimer la puce"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>
              Cette action est <strong>irréversible</strong>. La puce sera définitivement supprimée du système.
            </p>
          </div>

          {simToDelete && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm flex flex-col gap-1">
              {simToDelete.phoneNumber && (
                <div>
                  <span className="text-slate-500">Numéro puce&nbsp;:</span> <strong>{simToDelete.phoneNumber}</strong>
                </div>
              )}
              {simToDelete.iccid && (
                <div>
                  <span className="text-slate-500">ICCID&nbsp;:</span> <strong>{simToDelete.iccid}</strong>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setSimToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmDeleteSim}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
