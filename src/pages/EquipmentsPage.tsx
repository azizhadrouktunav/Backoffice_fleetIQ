import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  Eye,
  Settings,
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
  Car as CarIcon
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { EquipmentType, useFleetStore } from '../state/FleetStore';
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
  const { currentUserRole, currentUserName, clients, setClients, equipments, setEquipments, packs } = useFleetStore();
  const packById = useMemo(() => new Map(packs.map((p) => [p.id, p])), [packs]);
  const isTunavUser = currentUserRole === 'Tunav';

  const [activeTab, setActiveTab] = useState<'clients' | 'stock' | 'resellers'>('clients');

  const [isResellerEquipmentsOpen, setIsResellerEquipmentsOpen] = useState(false);
  const [resellerToView, setResellerToView] = useState<(typeof clients)[number] | null>(null);

  const [isClientEquipmentsOpen, setIsClientEquipmentsOpen] = useState(false);
  const [clientToView, setClientToView] = useState<(typeof clients)[number] | null>(null);

  const [equipmentToEdit, setEquipmentToEdit] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isEditPackModalOpen, setIsEditPackModalOpen] = useState(false);
  const [equipmentToEditPack, setEquipmentToEditPack] = useState<any | null>(null);
  const [selectedEquipmentPackId, setSelectedEquipmentPackId] = useState<number | null>(null);

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

  const [isAssignClientOpen, setIsAssignClientOpen] = useState(false);
  const [stockToAssign, setStockToAssign] = useState<any | null>(null);
  const [assignClientName, setAssignClientName] = useState<string>('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const [isAssignResellerOpen, setIsAssignResellerOpen] = useState(false);
  const [assignResellerName, setAssignResellerName] = useState<string>('');

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    serial: '',
    sim: '',
    simCallNumber: '',
    iccid: '',
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

  const totalInstalled = useMemo(() => equipments.filter((e) => e.isInstalled).length, [equipments]);
  const totalNotInstalled = useMemo(() => equipments.filter((e) => !e.isInstalled).length, [equipments]);

  // Resellers attached to Tunav (used by the "Affectation Revendeur" tab)
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

  // Per-reseller stats based on equipments where reseller === r.name
  const resellerStatsByName = useMemo(() => {
    const m = new Map<string, { total: number; inStock: number; assigned: number; installed: number }>();
    for (const e of equipments) {
      if (!e.reseller || e.reseller === 'Tunav') continue;
      const cur = m.get(e.reseller) ?? { total: 0, inStock: 0, assigned: 0, installed: 0 };
      cur.total += 1;
      if (e.client === `${e.reseller}_Stock`) cur.inStock += 1;
      else cur.assigned += 1;
      if (e.isInstalled) cur.installed += 1;
      m.set(e.reseller, cur);
    }
    return m;
  }, [equipments]);

  const resellerEquipments = useMemo(() => {
    if (!resellerToView) return [];
    return equipments.filter((e) => e.reseller === resellerToView.name);
  }, [equipments, resellerToView]);

  const openResellerEquipments = (r: (typeof clients)[number]) => {
    setResellerToView(r);
    setIsResellerEquipmentsOpen(true);
  };

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

  const openClientEquipments = (c: (typeof clients)[number]) => {
    setClientToView(c);
    setIsClientEquipmentsOpen(true);
  };

  const clientEquipments = useMemo(() => {
    if (!clientToView) return [];
    return equipments.filter((e) => e.client === clientToView.name);
  }, [equipments, clientToView]);

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

  const openEditEquipment = (eq: any) => {
    setEquipmentToEdit({ ...eq });
    setIsEditModalOpen(true);
  };

  const saveEditEquipment = () => {
    if (!equipmentToEdit) return;
    setEquipments((prev) => prev.map((e) => (e.id === equipmentToEdit.id ? { ...e, ...equipmentToEdit } : e)));
    setIsEditModalOpen(false);
  };

  const openEditEquipmentPack = (eq: any) => {
    if (!clientToView) return;
    const client = clients.find((c) => c.name === clientToView.name);
    if (!client || !client.packs || client.packs.length === 0) return;
    setEquipmentToEditPack(eq);
    setSelectedEquipmentPackId(typeof eq.packId === 'number' ? eq.packId : client.packs[0].packId);
    setIsEditPackModalOpen(true);
  };

  const saveEquipmentPack = () => {
    if (!equipmentToEditPack) return;
    if (selectedEquipmentPackId == null) return;
    setEquipments((prev) =>
      prev.map((e) => (e.id === equipmentToEditPack.id ? { ...e, packId: selectedEquipmentPackId } : e))
    );
    setIsEditPackModalOpen(false);
  };

  const openAssignToClient = (eq: any) => {
    setStockToAssign(eq);
    setAssignClientName('');
    setAssignError(null);
    setIsAssignClientOpen(true);
  };

  const confirmAssignToClient = () => {
    if (!stockToAssign) return;
    const c = clients.find((x) => x.name === assignClientName);
    if (!c) return;
    const limit = c.vehicleLimit;
    const installed = installedCountByClient.get(c.name) ?? 0;
    if (typeof limit === 'number' && installed >= limit) {
      setAssignError(`Limite atteinte: ${installed}/${limit}.`);
      return;
    }
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === stockToAssign.id
          ? {
              ...e,
              client: c.name,
              reseller: c.reseller,
              car: 'Unassigned',
              packId: e.packId ?? c.packs?.[0]?.packId
            }
          : e
      )
    );
    setIsAssignClientOpen(false);
  };

  const openAssignToReseller = (eq: any) => {
    setStockToAssign(eq);
    setAssignResellerName('');
    setAssignError(null);
    setIsAssignResellerOpen(true);
  };

  const confirmAssignToReseller = () => {
    if (!stockToAssign) return;
    if (currentUserRole !== 'Tunav') return;
    const r = clients.find((x) => x.type === 'Revendeur' && x.name === assignResellerName);
    if (!r) return;
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === stockToAssign.id
          ? { ...e, reseller: r.name, client: `${r.name}_Stock`, car: 'Unassigned', isInstalled: false }
          : e
      )
    );
    setIsAssignResellerOpen(false);
  };

  const openAddStock = () => {
    setNewStock({
      serial: '',
      sim: '',
      simCallNumber: '',
      iccid: '',
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
        sim: newStock.sim.trim(),
        simCallNumber: newStock.simCallNumber.trim(),
        iccid: newStock.iccid.trim(),
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Gestion des Équipements</h1>
        {activeTab === 'stock' && currentUserRole === 'Tunav' && (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-medium">
            Stock {currentUserRole === 'Tunav' ? 'Tunav' : currentUserName}
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stockEquipments.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-medium">Installés</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">{totalInstalled}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-medium">Non installés</div>
          <div className="text-2xl font-semibold text-amber-600 mt-1">{totalNotInstalled}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex gap-2">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'clients' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-white'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeftRight size={16} /> Affectation Clients
            </span>
          </button>
          {isTunavUser && (
            <button
              onClick={() => setActiveTab('resellers')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'resellers' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Store size={16} /> Affectation Revendeur
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'stock' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-white'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Boxes size={16} /> Stock équipements
            </span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'clients' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Installation</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {(() => {
                  // Règle d’affichage:
                  // - On n’affiche QUE les clients simples du user courant
                  //   (les revendeurs sont gérés dans l’onglet "Affectation Revendeur")
                  const visibleClients = clients
                    .filter((c) => !c.name.endsWith('_Stock') && c.name !== 'Tunav')
                    .filter((c) => c.reseller === currentUserName)
                    .filter((c) => c.type === 'Simple')
                    .sort((a, b) => a.name.localeCompare(b.name));

                  const rows: React.ReactNode[] = [];

                  for (const c of visibleClients) {
                    const installed = installedCountByClient.get(c.name) ?? 0;
                    const total = equipments.filter((e) => e.client === c.name).length;
                    rows.push(
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{c.name}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {`${installed}/${total}`}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openClientEquipments(c)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Voir équipements"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          )}

          {activeTab === 'stock' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                  <th className="p-4 font-medium">N° série</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">SIM</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {stockEquipments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{e.serial}</td>
                    <td className="p-4 text-slate-700">{e.type}</td>
                    <td className="p-4 text-slate-600">{e.sim}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAssignToClient(e)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Affecter client
                        </button>
                        {currentUserRole === 'Tunav' && (
                          <button
                            onClick={() => openAssignToReseller(e)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Affecter revendeur
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {stockEquipments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Aucun équipement en stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'resellers' && isTunavUser && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                  <th className="p-4 font-medium">Revendeur</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Total équipements</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {resellersList.map((r) => {
                  const stats = resellerStatsByName.get(r.name) ?? {
                    total: 0,
                    inStock: 0,
                    assigned: 0,
                    installed: 0
                  };
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-500">
                          Stock: <span className="font-medium">{r.name}_Stock</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-900 text-sm">{r.email}</div>
                        <div className="text-slate-500 text-xs">{r.tel}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {stats.total}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openResellerEquipments(r)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Voir les équipements affectés à ce revendeur"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {resellersList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Aucun revendeur rattaché à Tunav.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

      {/* Equipments list modal */}
      <Modal
        isOpen={isClientEquipmentsOpen}
        onClose={() => setIsClientEquipmentsOpen(false)}
        title={`Équipements — ${clientToView?.name ?? ''}`}
        size="xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                <th className="p-4 font-medium">Type équipement</th>
                <th className="p-4 font-medium">Pack</th>
                <th className="p-4 font-medium">Matricule</th>
                <th className="p-4 font-medium">Carte SIM</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {clientEquipments.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{eq.type}</div>
                    <div className="text-xs text-slate-500">{eq.serial}</div>
                  </td>
                  <td className="p-4">
                    {(() => {
                      const pack = typeof eq.packId === 'number' ? packById.get(eq.packId) : undefined;
                      return pack ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {pack.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      );
                    })()}
                  </td>
                  <td className="p-4 text-slate-700">{eq.car}</td>
                  <td className="p-4 text-slate-700">{eq.sim}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                        eq.isInstalled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {eq.isInstalled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {eq.isInstalled ? 'Installé' : 'Non installé'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditEquipment(eq)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openEditEquipmentPack(eq)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Modifier le pack sélectionné"
                        disabled={!clientToView || (clientToView?.packs?.length ?? 0) === 0}
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEquipmentToView(eq);
                          setShowPositionMap(false);
                          setIsDetailsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Voir détailler"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => cancelAssignmentToTunavStock(eq.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="Annuler l’affectation (retour stock Tunav)"
                      >
                        <Undo2 size={16} />
                      </button>
                      {!eq.isInstalled && (
                        <button
                          onClick={() => openInstallModal(eq)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Installer équipement"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {clientEquipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun équipement pour ce client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Edit pack selection for equipment */}
      <Modal
        isOpen={isEditPackModalOpen}
        onClose={() => setIsEditPackModalOpen(false)}
        title={`Pack — ${equipmentToEditPack?.serial ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Choisissez le pack de cet équipement. Un équipement appartient à <strong>un seul</strong> pack.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pack</label>
            <select
              value={selectedEquipmentPackId ?? ''}
              onChange={(e) => setSelectedEquipmentPackId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">Sélectionner…</option>
              {['FleetIQ Secure', 'FleetIQ Pro', 'FleetIQ Mechanic', 'FleetIQ Vision'].map((packName) => {
                const p = packs.find((x) => x.name === packName);
                if (!p) return null;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsEditPackModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={saveEquipmentPack}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              disabled={selectedEquipmentPackId == null}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Reseller equipments list modal (TUNAV only) */}
      <Modal
        isOpen={isResellerEquipmentsOpen}
        onClose={() => setIsResellerEquipmentsOpen(false)}
        title={`Équipements affectés — ${resellerToView?.name ?? ''}`}
        size="xl"
      >
        {resellerToView && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const stats = resellerStatsByName.get(resellerToView.name) ?? {
                  total: 0,
                  inStock: 0,
                  assigned: 0,
                  installed: 0
                };
                return (
                  <>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="text-[11px] text-blue-700 font-medium uppercase tracking-wide">
                        En stock revendeur
                      </div>
                      <div className="text-xl font-semibold text-blue-700 mt-0.5">{stats.inStock}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <div className="text-[11px] text-emerald-700 font-medium uppercase tracking-wide">
                        Affectés à ses clients
                      </div>
                      <div className="text-xl font-semibold text-emerald-700 mt-0.5">{stats.assigned}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="text-[11px] text-slate-600 font-medium uppercase tracking-wide">Total</div>
                      <div className="text-xl font-semibold text-slate-900 mt-0.5">{stats.total}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                    <th className="p-3 font-medium">N° série</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">SIM</th>
                    <th className="p-3 font-medium">Affectation</th>
                    <th className="p-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {resellerEquipments.map((eq) => {
                    const isInResellerStock = eq.client === `${resellerToView.name}_Stock`;
                    return (
                      <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-900">{eq.serial}</td>
                        <td className="p-3 text-slate-700">{eq.type}</td>
                        <td className="p-3 text-slate-600">{eq.sim}</td>
                        <td className="p-3">
                          {isInResellerStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              <Boxes size={12} /> Stock revendeur
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <ArrowLeftRight size={12} /> {eq.client}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                              eq.isInstalled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {eq.isInstalled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {eq.isInstalled ? 'Installé' : 'Non installé'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {resellerEquipments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Aucun équipement affecté à ce revendeur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-slate-500 italic">
              Conformément à votre politique, les clients de ce revendeur ne sont pas listés ici.
            </div>
          </div>
        )}
      </Modal>

      {/* Edit equipment popup */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier l'équipement" size="lg">
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de série</label>
                <input
                  value={equipmentToEdit?.serial ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, serial: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Carte SIM</label>
                <input
                  value={equipmentToEdit?.sim ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, sim: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° d'appel puce</label>
                <input
                  value={equipmentToEdit?.simCallNumber ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, simCallNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° de série puce (ICCID)</label>
                <input
                  value={equipmentToEdit?.iccid ?? ''}
                  onChange={(e) => setEquipmentToEdit((p: any) => ({ ...p, iccid: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

      {/* Assign stock to client */}
      <Modal isOpen={isAssignClientOpen} onClose={() => setIsAssignClientOpen(false)} title="Affectation Clients" size="md">
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Équipement: <strong>{stockToAssign?.serial}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
            <select
              value={assignClientName}
              onChange={(e) => setAssignClientName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Sélectionner…</option>
              {clients
                .filter((c) => !c.name.endsWith('_Stock'))
                .filter((c) => c.name !== 'Tunav')
                .filter((c) => c.type !== 'Revendeur')
                .filter((c) => c.reseller === currentUserName)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          {assignError && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{assignError}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAssignClientOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmAssignToClient}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              disabled={!assignClientName}
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign stock to reseller */}
      <Modal
        isOpen={isAssignResellerOpen}
        onClose={() => setIsAssignResellerOpen(false)}
        title="Affectation Revendeur"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Équipement: <strong>{stockToAssign?.serial}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Revendeur</label>
            <select
              value={assignResellerName}
              onChange={(e) => setAssignResellerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Sélectionner…</option>
              {clients
                .filter((c) => c.type === 'Revendeur')
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAssignResellerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmAssignToReseller}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              disabled={!assignResellerName}
            >
              Confirmer
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de série</label>
                <input
                  value={newStock.serial}
                  onChange={(e) => setNewStock((p) => ({ ...p, serial: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Carte SIM</label>
                <input
                  value={newStock.sim}
                  onChange={(e) => setNewStock((p) => ({ ...p, sim: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° d'appel puce</label>
                <input
                  value={newStock.simCallNumber}
                  onChange={(e) => setNewStock((p) => ({ ...p, simCallNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° de série puce (ICCID)</label>
                <input
                  value={newStock.iccid}
                  onChange={(e) => setNewStock((p) => ({ ...p, iccid: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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