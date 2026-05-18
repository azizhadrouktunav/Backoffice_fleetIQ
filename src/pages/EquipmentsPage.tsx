import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  Eye,
  XCircle,
  Plus,
  ArrowLeftRight,
  Boxes,
  Undo2,
  Store,
  Cpu,
  Hash,
  Wifi,
  Server as ServerIcon,
  Calendar,
  MapPin,
  Gauge,
  Activity,
  Fuel,
  Thermometer,
  Navigation,
  User as UserIcon,
  Car as CarIcon,
  Trash2,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EquipmentsUnifiedTable } from '../components/EquipmentsUnifiedTable';
import { SimIccidPicker } from '../components/SimIccidPicker';
import { EquipmentType, useFleetStore } from '../state/FleetStore';
import { getVisibleEquipments, isStockClientName } from '../utils/fleetVisibility';
import {
  MapContainer as MapContainerBase,
  TileLayer as TileLayerBase,
  Marker as MarkerBase,
  Popup
} from 'react-leaflet';
// @ts-expect-error - leaflet has no bundled types in this project (same usage as ClientsPage)
import L from 'leaflet';

// Cast to any to bypass missing @types/leaflet declarations
const MapContainer = MapContainerBase as any;
const TileLayer = TileLayerBase as any;
const Marker = MarkerBase as any;

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Donnée mock par défaut pour les équipements qui n'ont pas encore communiqué
const DEFAULT_POSITION = {
  dateLocal: '18/04/2025 00:48:50',
  latitude: 48.8566,
  longitude: 2.3522,
  vitesse: 16,
  etat: 'Connectée',
  niveauCarburant: 33,
  totalCarburant: 5122.44,
  rpm: 960,
  temperatureMoteur: 80,
  kilometrage: 64085.301
};

export function EquipmentsPage() {
  const {
    currentUserRole,
    currentUserName,
    clients,
    setClients,
    equipments,
    setEquipments,
    packs,
    simCards,
    setSimCards,
    simOffers
  } = useFleetStore();
  const packById = useMemo(() => new Map(packs.map((p) => [p.id, p])), [packs]);
  const simOfferById = useMemo(() => new Map(simOffers.map((o) => [o.id, o])), [simOffers]);
  const isTunavUser = currentUserRole === 'Tunav';

  type EquipmentStatusFilter = 'all' | 'installed' | 'not_installed' | 'stock';
  const [filterEquipmentType, setFilterEquipmentType] = useState<string>('all');
  const [filterClientReseller, setFilterClientReseller] = useState<string>('all');
  const [filterPack, setFilterPack] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatusFilter>('all');

  const [equipmentToDelete, setEquipmentToDelete] = useState<any | null>(null);
  const [assignMode, setAssignMode] = useState<'client' | 'reseller'>('client');

  const [equipmentToEdit, setEquipmentToEdit] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSimId, setEditSimId] = useState<number | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [equipmentToView, setEquipmentToView] = useState<any | null>(null);
  const [showPositionMap, setShowPositionMap] = useState(false);

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [equipmentToInstall, setEquipmentToInstall] = useState<any | null>(null);
  const [installPlate, setInstallPlate] = useState<string>('');
  const [installError, setInstallError] = useState<string | null>(null);

  const vehiclePlateSuggestions = useMemo(() => {
    const clientName = equipmentToInstall?.client;
    if (!clientName) return [];
    const plates = new Set<string>();
    for (const e of equipments) {
      if (e.client !== clientName) continue;
      const plate = typeof e.car === 'string' ? e.car.trim() : '';
      if (!plate || plate === 'Unassigned') continue;
      plates.add(plate);
    }
    return Array.from(plates).sort((a, b) => a.localeCompare(b));
  }, [equipments, equipmentToInstall]);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [stockToAssign, setStockToAssign] = useState<any | null>(null);
  const [assignClientName, setAssignClientName] = useState<string>('');
  const [assignResellerName, setAssignResellerName] = useState<string>('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSimId, setAssignSimId] = useState<number | null>(null);

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    serial: '',
    server: '',
    port: '',
    firstSendDate: '',
    contractDate: '',
    type: 'FMC130',
    equipmentType: 'ETX' as EquipmentType,
    supportsCan: false
  });

  const equipmentTypes = useMemo(
    () =>
      [
        'ETX',
        'MiniTrace',
        'MedWatch',
        'ETBLE',
        'ET8',
        'ET6',
        'EasyCAN',
        'ET8+CAN',
        'ET6+CAN',
        'Dashcam'
      ] as EquipmentType[],
    []
  );

  const [isQuotasOpen, setIsQuotasOpen] = useState(false);
  const [clientToQuota] = useState<(typeof clients)[number] | null>(null);
  const [quotaEquipmentLimits, setQuotaEquipmentLimits] = useState<Record<string, number>>({});
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const installedCountByClient = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of equipments) {
      if (!e.isInstalled) continue;
      m.set(e.client, (m.get(e.client) ?? 0) + 1);
    }
    return m;
  }, [equipments]);

  const stockClientName = useMemo(
    () => (currentUserRole === 'Tunav' ? 'Tunav_Stock' : `${currentUserName}_Stock`),
    [currentUserRole, currentUserName]
  );
  const stockEquipments = useMemo(
    () => equipments.filter((e) => e.client === stockClientName),
    [equipments, stockClientName]
  );

  const isStockEquipment = (client: string) => client.endsWith('_Stock');

  const getEquipmentStatus = (eq: (typeof equipments)[number]): 'installed' | 'not_installed' | 'stock' => {
    if (isStockEquipment(eq.client)) return 'stock';
    if (eq.isInstalled) return 'installed';
    return 'not_installed';
  };

  const simByEquipmentId = useMemo(() => {
    const m = new Map<number, (typeof simCards)[number]>();
    for (const s of simCards) {
      if (s.equipmentId != null) m.set(s.equipmentId, s);
    }
    return m;
  }, [simCards]);

  const visibleEquipments = useMemo(
    () => getVisibleEquipments(equipments, currentUserRole, currentUserName),
    [equipments, currentUserRole, currentUserName]
  );

  const clientResellerFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const e of visibleEquipments) {
      if (isStockEquipment(e.client)) {
        names.add(e.client);
      } else {
        names.add(e.client);
        if (e.reseller && e.reseller !== 'Tunav') names.add(e.reseller);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [visibleEquipments]);

  const filteredEquipments = useMemo(() => {
    return visibleEquipments.filter((eq) => {
      if (filterEquipmentType !== 'all') {
        const t = eq.equipmentType ?? eq.type;
        if (t !== filterEquipmentType) return false;
      }
      if (filterClientReseller !== 'all') {
        const matchClient = eq.client === filterClientReseller;
        const matchReseller = eq.reseller === filterClientReseller;
        if (!matchClient && !matchReseller) return false;
      }
      if (filterPack !== 'all') {
        if (filterPack === 'none') {
          if (eq.packId != null) return false;
        } else if (String(eq.packId) !== filterPack) return false;
      }
      if (filterStatus !== 'all' && getEquipmentStatus(eq) !== filterStatus) return false;
      return true;
    });
  }, [visibleEquipments, filterEquipmentType, filterClientReseller, filterPack, filterStatus]);

  const stats = useMemo(() => {
    const total = visibleEquipments.length;
    let installed = 0;
    let notInstalled = 0;
    let stock = 0;
    for (const e of visibleEquipments) {
      const s = getEquipmentStatus(e);
      if (s === 'installed') installed += 1;
      else if (s === 'stock') stock += 1;
      else notInstalled += 1;
    }
    return { total, installed, notInstalled, stock };
  }, [visibleEquipments]);

  const resellersList = useMemo(
    () =>
      clients
        .filter(
          (c) =>
            c.type === 'Revendeur' &&
            c.name !== 'Tunav' &&
            !c.name.endsWith('_Stock') &&
            c.reseller === 'Tunav'
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clients]
  );

  const saveQuotas = () => {
    if (!clientToQuota) return;
    const limit = clientToQuota.vehicleLimit;
    const total = Object.values(quotaEquipmentLimits).reduce((acc, v) => acc + (Number(v) || 0), 0);
    if (typeof limit === 'number' && total > limit) {
      setQuotaError(`Le total (${total}) ne doit pas dépasser les véhicules autorisés (${limit}).`);
      return;
    }
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientToQuota.id) return c;
        const a = c.packs[0];
        if (!a) return c;
        return {
          ...c,
          packs: [
            {
              ...a,
              equipmentLimits: { ...a.equipmentLimits, ...(quotaEquipmentLimits as any) }
            }
          ]
        };
      })
    );
    setIsQuotasOpen(false);
  };

  const cancelAssignmentToTunavStock = (equipmentId: number) => {
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
              client: stockClientName,
              reseller: currentUserName,
              car: 'Unassigned',
              isInstalled: false
            }
          : e
      )
    );
  };

  const openInstallModal = (eq: any) => {
    const c = clients.find((x) => x.name === eq.client);
    if (!c) return;
    const limit = c.vehicleLimit;
    const installed = installedCountByClient.get(eq.client) ?? 0;
    if (typeof limit === 'number' && installed >= limit) {
      window.alert(`Limite atteinte: ${installed}/${limit}.`);
      return;
    }
    setEquipmentToInstall(eq);
    setInstallPlate(eq.car && eq.car !== 'Unassigned' ? eq.car : '');
    setInstallError(null);
    setIsInstallModalOpen(true);
  };

  const confirmInstall = () => {
    if (!equipmentToInstall) return;
    const plate = installPlate.trim();
    if (!plate) {
      setInstallError('Veuillez saisir une immatriculation.');
      return;
    }
    setEquipments((prev) =>
      prev.map((e) => (e.id === equipmentToInstall.id ? { ...e, isInstalled: true, car: plate } : e))
    );
    setIsInstallModalOpen(false);
  };

  const uninstallEquipment = (eq: (typeof equipments)[number]) => {
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === eq.id ? { ...e, isInstalled: false, car: 'Unassigned' } : e
      )
    );
  };

  const confirmDeleteEquipment = () => {
    if (!equipmentToDelete) return;
    setEquipments((prev) => prev.filter((e) => e.id !== equipmentToDelete.id));
    setSimCards((prev) =>
      prev.map((s) => (s.equipmentId === equipmentToDelete.id ? { ...s, equipmentId: undefined } : s))
    );
    setEquipmentToDelete(null);
  };

  const editAvailableSims = useMemo(() => {
    if (!equipmentToEdit) return [];
    const eq = equipmentToEdit;
    const stock = isStockClientName(eq.client);
    return simCards.filter((s) => {
      if (s.equipmentId === eq.id) return true;
      if (s.equipmentId != null) return false;
      if (stock) {
        return s.client === eq.client || s.reseller === eq.reseller;
      }
      return s.client === eq.client;
    });
  }, [simCards, equipmentToEdit]);

  const openEditEquipment = (eq: any) => {
    const client = clients.find((c) => c.name === eq.client && !c.name.endsWith('_Stock'));
    const defaultPackId =
      typeof eq.packId === 'number'
        ? eq.packId
        : client?.packs?.[0]?.packId ?? packs[0]?.id ?? null;
    const currentSim =
      simCards.find((s) => s.equipmentId === eq.id) ??
      simCards.find((s) => s.iccid && s.iccid === eq.iccid);
    setEditSimId(currentSim?.id ?? null);
    setEquipmentToEdit({ ...eq, packId: defaultPackId ?? eq.packId });
    setIsEditModalOpen(true);
  };

  const saveEditEquipment = () => {
    if (!equipmentToEdit) return;
    const eqId = equipmentToEdit.id;
    const selectedSim = editSimId != null ? simCards.find((s) => s.id === editSimId) : undefined;
    const updatedEq = {
      ...equipmentToEdit,
      ...(selectedSim
        ? {
            sim: selectedSim.phoneNumber,
            simCallNumber: selectedSim.phoneNumber,
            iccid: selectedSim.iccid
          }
        : { sim: '', simCallNumber: '', iccid: '' })
    };
    setEquipments((prev) => prev.map((e) => (e.id === eqId ? updatedEq : e)));
    setSimCards((prev) =>
      prev.map((s) => {
        if (s.equipmentId === eqId && s.id !== editSimId) {
          return { ...s, equipmentId: undefined };
        }
        if (editSimId != null && s.id === editSimId) {
          return {
            ...s,
            equipmentId: eqId,
            client: equipmentToEdit.client,
            reseller: equipmentToEdit.reseller
          };
        }
        return s;
      })
    );
    setIsEditModalOpen(false);
  };

  const openAssign = (eq: any) => {
    setStockToAssign(eq);
    setAssignMode('client');
    setAssignClientName('');
    setAssignResellerName('');
    setAssignError(null);
    setAssignSimId(null);
    setIsAssignOpen(true);
  };

  const canAssignToReseller =
    isTunavUser && stockToAssign != null && isStockEquipment(stockToAssign.client);

  const confirmAssign = () => {
    if (!stockToAssign) return;

    if (assignMode === 'client') {
      const c = clients.find((x) => x.name === assignClientName);
      if (!c) return;
      const limit = c.vehicleLimit;
      const installed = installedCountByClient.get(c.name) ?? 0;
      if (typeof limit === 'number' && installed >= limit) {
        setAssignError(`Limite atteinte: ${installed}/${limit}.`);
        return;
      }
      const selectedSim = assignSimId != null ? simCards.find((s) => s.id === assignSimId) : undefined;
      setEquipments((prev) =>
        prev.map((e) =>
          e.id === stockToAssign.id
            ? {
                ...e,
                client: c.name,
                reseller: c.reseller,
                car: 'Unassigned',
                isInstalled: false,
                packId: e.packId ?? c.packs?.[0]?.packId,
                ...(selectedSim
                  ? {
                      sim: selectedSim.phoneNumber,
                      simCallNumber: selectedSim.phoneNumber,
                      iccid: selectedSim.iccid
                    }
                  : {})
              }
            : e
        )
      );
      if (selectedSim) {
        setSimCards((prev) =>
          prev.map((s) =>
            s.id === selectedSim.id
              ? { ...s, equipmentId: stockToAssign.id, client: c.name, reseller: c.reseller }
              : s
          )
        );
      }
    } else {
      if (!isTunavUser) return;
      const r = clients.find((x) => x.type === 'Revendeur' && x.name === assignResellerName);
      if (!r) return;
      const selectedSim = assignSimId != null ? simCards.find((s) => s.id === assignSimId) : undefined;
      setEquipments((prev) =>
        prev.map((e) =>
          e.id === stockToAssign.id
            ? {
                ...e,
                reseller: r.name,
                client: `${r.name}_Stock`,
                car: 'Unassigned',
                isInstalled: false,
                ...(selectedSim
                  ? {
                      sim: selectedSim.phoneNumber,
                      simCallNumber: selectedSim.phoneNumber,
                      iccid: selectedSim.iccid
                    }
                  : {})
              }
            : e
        )
      );
      if (selectedSim) {
        setSimCards((prev) =>
          prev.map((s) =>
            s.id === selectedSim.id
              ? { ...s, equipmentId: stockToAssign.id, client: `${r.name}_Stock`, reseller: r.name }
              : s
          )
        );
      }
    }
    setIsAssignOpen(false);
  };

  const openAddStock = () => {
    setNewStock({
      serial: '',
      server: '',
      port: '',
      firstSendDate: '',
      contractDate: '',
      type: 'FMC130',
      equipmentType: 'ETX',
      supportsCan: false
    });
    setIsAddStockOpen(true);
  };

  const confirmAddStock = () => {
    const serial = newStock.serial.trim();
    if (!serial) return;
    const nextId = Math.max(0, ...equipments.map((e) => e.id)) + 1;
    setEquipments((prev) => [
      {
        id: nextId,
        serial,
        equipmentType: newStock.equipmentType,
        supportsCan: newStock.supportsCan,
        packId: undefined,
        type: newStock.type,
        sim: '',
        simCallNumber: '',
        iccid: '',
        server: newStock.server.trim(),
        port: newStock.port.trim(),
        firstSendDate: newStock.firstSendDate,
        contractDate: newStock.contractDate,
        client: stockClientName,
        reseller: currentUserName,
        car: 'Unassigned',
        isInstalled: false,
        lastPosition: null
      },
      ...prev
    ]);
    setIsAddStockOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Gestion des Équipements</h1>
          <p className="text-sm text-slate-500 mt-1">Vue unifiée des équipements, affectations et stock.</p>
        </div>
        {isTunavUser && (
          <button
            onClick={openAddStock}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Ajouter un équipement
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total équipements" value={stats.total.toString()} subtitle="Dans votre périmètre" icon={Cpu} />
        <StatCard
          title="Installés"
          value={stats.installed.toString()}
          trend={`${stats.total ? Math.round((stats.installed / stats.total) * 100) : 0}%`}
          trendUp
          subtitle="En service"
          icon={CheckCircle2}
        />
        <StatCard
          title="Non installés"
          value={stats.notInstalled.toString()}
          trendUp={false}
          subtitle="Affectés non installés"
          icon={XCircle}
          color="red"
        />
        <StatCard title="Stock Tunav" value={stats.stock.toString()} subtitle="En stock" icon={Boxes} />
      </div>

      <EquipmentsUnifiedTable
        rows={filteredEquipments}
        equipmentTypes={equipmentTypes}
        packs={packs}
        clients={clients}
        simOfferById={simOfferById}
        simByEquipmentId={simByEquipmentId}
        packById={packById}
        isTunavUser={isTunavUser}
        filterEquipmentType={filterEquipmentType}
        setFilterEquipmentType={setFilterEquipmentType}
        filterClientReseller={filterClientReseller}
        setFilterClientReseller={setFilterClientReseller}
        filterPack={filterPack}
        setFilterPack={setFilterPack}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        clientResellerFilterOptions={clientResellerFilterOptions}
        getEquipmentStatus={getEquipmentStatus}
        isStockEquipment={isStockEquipment}
        onEdit={openEditEquipment}
        onDelete={setEquipmentToDelete}
        onViewDetails={(eq) => {
          setEquipmentToView(eq);
          setShowPositionMap(false);
          setIsDetailsModalOpen(true);
        }}
        onAssign={openAssign}
        onReturnToStock={(eq) => cancelAssignmentToTunavStock(eq.id)}
      />

      {/* Quotas modal (placeholder write path) */}
      <Modal
        isOpen={isQuotasOpen}
        onClose={() => setIsQuotasOpen(false)}
        title={`Quotas — ${clientToQuota?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
            Véhicules autorisés: <strong>{clientToQuota?.vehicleLimit === null ? '∞' : (clientToQuota?.vehicleLimit ?? 0)}</strong>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="text-sm font-medium text-slate-900">Équipements autorisés (par type)</div>
            <div className="mt-3 space-y-2">
              {Object.keys(quotaEquipmentLimits).length === 0 && (
                <div className="text-xs text-slate-400 italic">Aucun type pour ce pack.</div>
              )}
              {Object.entries(quotaEquipmentLimits).map(([t, v]) => (
                <div key={t} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-700">{t}</div>
                  <input
                    type="number"
                    min={0}
                    value={v ?? 0}
                    onChange={(e) =>
                      setQuotaEquipmentLimits((prev) => ({ ...prev, [t]: Math.max(0, Number(e.target.value)) }))
                    }
                    className="w-28 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          {quotaError && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{quotaError}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsQuotasOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={saveQuotas}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit equipment popup */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditSimId(null);
        }}
        title="Modifier l'équipement"
        size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              Informations Équipement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type d’équipement</label>
                <select
                  value={(equipmentToEdit?.equipmentType ?? 'ETX') as EquipmentType}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, equipmentType: e.target.value as EquipmentType }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bus CAN</label>
                <select
                  value={equipmentToEdit?.supportsCan ? 'yes' : 'no'}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, supportsCan: e.target.value === 'yes' }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de série (IMEI)</label>
                <input
                  value={equipmentToEdit?.serial ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, serial: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Pack</label>
                <select
                  value={equipmentToEdit?.packId ?? ''}
                  onChange={(e) =>
                    setEquipmentToEdit((p: any) => ({
                      ...p,
                      packId: e.target.value ? Number(e.target.value) : undefined
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">— Aucun pack —</option>
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <SimIccidPicker
                  availableSims={editAvailableSims}
                  selectedSimId={editSimId}
                  onSelectSimId={setEditSimId}
                  simOfferById={simOfferById}
                  emptyMessage="Aucune puce disponible pour cet équipement."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">Connexion Serveur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Serveur</label>
                <input
                  value={equipmentToEdit?.server ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, server: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Port</label>
                <input
                  value={equipmentToEdit?.port ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, port: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date du premier envoi</label>
                <input
                  type="date"
                  value={equipmentToEdit?.firstSendDate ?? ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date contractuelle adoptée</label>
                <input
                  type="date"
                  value={equipmentToEdit?.contractDate ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, contractDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={saveEditEquipment}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Install equipment popup */}
      <Modal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        title={`Installer — ${equipmentToInstall?.serial ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation (Matricule)</label>
            <input
              value={installPlate}
              onChange={(e) => setInstallPlate(e.target.value)}
              list="vehicle-plates"
              placeholder="Ex: AB-123-CD"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <datalist id="vehicle-plates">
              {vehiclePlateSuggestions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div className="mt-1 text-xs text-slate-500">
              Recherchez dans la liste ou saisissez une nouvelle matricule si elle n’existe pas.
            </div>
          </div>
          {installError && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{installError}</div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmInstall}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Installer
            </button>
          </div>
        </div>
      </Modal>

      {/* Equipment details popup */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setShowPositionMap(false);
        }}
        title="Détails de l'équipement"
        size="lg"
      >
        {equipmentToView ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{equipmentToView.serial}</h3>
                  <p className="text-sm text-slate-500">{equipmentToView.type}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                  equipmentToView.isInstalled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {equipmentToView.isInstalled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {equipmentToView.isInstalled ? 'Installé' : 'Non installé'}
              </span>
            </div>

            {/* Equipment details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Cpu size={16} className="text-blue-500" />
                Détails de l'équipement
              </h4>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> N° de série
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.serial}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Cpu size={14} /> Type
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.type}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Wifi size={14} /> N° SIM
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.sim || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Wifi size={14} /> N° d'appel puce
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {equipmentToView.simCallNumber || '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> ICCID
                  </div>
                  <div className="text-sm font-medium text-slate-900 break-all">
                    {equipmentToView.iccid || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <ServerIcon size={14} /> Serveur
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.server || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> Port
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.port || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Date premier envoi
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {equipmentToView.firstSendDate
                      ? new Date(equipmentToView.firstSendDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Date contractuelle
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {equipmentToView.contractDate
                      ? new Date(equipmentToView.contractDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Client details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-500" />
                Détails du Client
              </h4>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <UserIcon size={14} /> Client
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.client || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Store size={14} /> Revendeur
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {equipmentToView.reseller || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <CarIcon size={14} /> Véhicule
                  </div>
                  <div className="text-sm font-medium text-slate-900">{equipmentToView.car || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Statut installation
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {equipmentToView.isInstalled ? 'Installé' : 'Non installé'}
                  </div>
                </div>
              </div>
            </div>

            {/* Map + Position details */}
            {showPositionMap && (() => {
              const lp = equipmentToView.lastPosition ?? DEFAULT_POSITION;
              const isConnected = lp.etat === 'Connectée';
              return (
                <>
                  <div className="border border-slate-200 rounded-lg overflow-hidden h-[250px] relative z-0">
                    <MapContainer
                      center={[lp.latitude, lp.longitude]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[lp.latitude, lp.longitude]} icon={customMarkerIcon}>
                        <Popup>
                          <div className="text-xs leading-relaxed">
                            <strong>Dernière position:</strong>
                            <br />
                            Date Local={lp.dateLocal}
                            <br />
                            Vitesse= {lp.vitesse}km/h
                            <br />
                            État={' '}
                            <span style={{ color: isConnected ? '#16a34a' : '#dc2626' }}>{lp.etat}</span>
                            <br />
                            Niveau de carburant={lp.niveauCarburant}%
                            <br />
                            Total de carburant={lp.totalCarburant}
                            <br />
                            RPM={lp.rpm}
                            <br />
                            Température Moteur={lp.temperatureMoteur}°C
                            <br />
                            Kilométrage={lp.kilometrage}km
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                      <Navigation size={16} className="text-blue-500" />
                      Dernière position
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Calendar size={12} /> Date Local
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.dateLocal}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <MapPin size={12} /> Latitude
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.latitude}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <MapPin size={12} /> Longitude
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.longitude}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Gauge size={12} /> Vitesse
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.vitesse} km/h</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Activity size={12} /> État
                        </div>
                        <div
                          className={`text-sm font-semibold flex items-center gap-1.5 ${
                            isConnected ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isConnected ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {lp.etat}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Fuel size={12} /> Niveau de carburant
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.niveauCarburant}%</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Fuel size={12} /> Total de carburant
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.totalCarburant}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Activity size={12} /> RPM
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.rpm}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Thermometer size={12} /> Température Moteur
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{lp.temperatureMoteur}°C</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                          <Navigation size={12} /> Kilométrage
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {lp.kilometrage.toLocaleString('fr-FR')} km
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Footer actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPositionMap(!showPositionMap)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  showPositionMap
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MapPin size={16} />
                {showPositionMap ? 'Masquer la position' : 'Voir position'}
              </button>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setShowPositionMap(false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">—</div>
        )}
      </Modal>

      {/* Affectation client ou revendeur */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Affectation"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Équipement: <strong>{stockToAssign?.serial}</strong>
          </div>
          {canAssignToReseller && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type d&apos;affectation</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode('client');
                    setAssignResellerName('');
                    setAssignSimId(null);
                    setAssignError(null);
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    assignMode === 'client'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode('reseller');
                    setAssignClientName('');
                    setAssignSimId(null);
                    setAssignError(null);
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    assignMode === 'reseller'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Revendeur
                </button>
              </div>
            </div>
          )}
          {assignMode === 'client' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <select
                value={assignClientName}
                onChange={(e) => {
                  setAssignClientName(e.target.value);
                  setAssignSimId(null);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Sélectionner…</option>
                {clients
                  .filter((c) => !c.name.endsWith('_Stock'))
                  .filter((c) => c.name !== 'Tunav')
                  .filter((c) => c.type === 'Simple')
                  .filter((c) =>
                    currentUserRole === 'Tunav'
                      ? c.reseller === 'Tunav'
                      : c.reseller === currentUserName
                  )
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Revendeur</label>
              <select
                value={assignResellerName}
                onChange={(e) => {
                  setAssignResellerName(e.target.value);
                  setAssignSimId(null);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Sélectionner…</option>
                {resellersList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {((assignMode === 'client' && assignClientName) ||
            (assignMode === 'reseller' && assignResellerName)) &&
            (() => {
            const clientSims =
              assignMode === 'client'
                ? simCards.filter((s) => s.client === assignClientName && s.equipmentId == null)
                : (() => {
                    const stockName = `${assignResellerName}_Stock`;
                    return simCards.filter(
                      (s) =>
                        s.equipmentId == null &&
                        (s.client === stockName || s.reseller === assignResellerName)
                    );
                  })();
            return (
              <div>
                {clientSims.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
                    Aucune puce disponible{assignMode === 'client' ? ' pour ce client' : ' pour ce revendeur'}. Ajoutez-en depuis « Gestion des puces ».
                  </div>
                ) : (
                  <SimIccidPicker
                    optional
                    labelClassName="block text-sm font-medium text-slate-700 mb-1"
                    availableSims={clientSims}
                    selectedSimId={assignSimId}
                    onSelectSimId={setAssignSimId}
                    simOfferById={simOfferById}
                    emptyMessage="Aucune puce disponible."
                  />
                )}
              </div>
            );
          })()}

          {assignError && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{assignError}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAssignOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmAssign}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              disabled={assignMode === 'client' ? !assignClientName : !assignResellerName}
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* Supprimer équipement */}
      <Modal
        isOpen={equipmentToDelete !== null}
        onClose={() => setEquipmentToDelete(null)}
        title="Supprimer l'équipement"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>
              Supprimer définitivement l'équipement <strong>{equipmentToDelete?.serial}</strong> ?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setEquipmentToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmDeleteEquipment}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Add stock equipment */}
      <Modal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} title="Stock équipements" size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              Informations Équipement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type d’équipement</label>
                <select
                  value={newStock.equipmentType}
                  onChange={(e) => setNewStock((p) => ({ ...p, equipmentType: e.target.value as EquipmentType }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bus CAN</label>
                <select
                  value={newStock.supportsCan ? 'yes' : 'no'}
                  onChange={(e) => setNewStock((p) => ({ ...p, supportsCan: e.target.value === 'yes' }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de série (IMEI)</label>
                <input
                  value={newStock.serial}
                  onChange={(e) => setNewStock((p) => ({ ...p, serial: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              La puce SIM sera associée lors de l'affectation à un client ou à un revendeur depuis le tableau.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">Connexion Serveur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Serveur</label>
                <input
                  value={newStock.server}
                  onChange={(e) => setNewStock((p) => ({ ...p, server: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Port</label>
                <input
                  value={newStock.port}
                  onChange={(e) => setNewStock((p) => ({ ...p, port: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date du premier envoi</label>
                <input
                  type="date"
                  value={newStock.firstSendDate}
                  onChange={(e) => setNewStock((p) => ({ ...p, firstSendDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date contractuelle adoptée</label>
                <input
                  type="date"
                  value={newStock.contractDate}
                  onChange={(e) => setNewStock((p) => ({ ...p, contractDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAddStockOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmAddStock}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Ajouter
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}