import React, { useMemo, useState, Component } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Eye,
  Trash2,
  Server as ServerIcon,
  Wifi,
  Cpu,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Car,
  Calendar,
  Hash,
  Link2,
  MapPin,
  Gauge,
  Fuel,
  Thermometer,
  Activity,
  Navigation } from
'lucide-react';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { PeriodFilter, PeriodKey } from '../components/PeriodFilter';
import { SearchableSelect } from '../components/SearchableSelect';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
// Fix for default marker icon in react-leaflet
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
// --- Mock Data ---
const mockClients = [
'Tunav',
'Transport Express',
'Global Logistics',
'Livraison Rapide',
'Auto Fleet Pro'];

const mockResellers = ['Tunav', 'Global Logistics', 'Auto Fleet Pro'];
// Reseller -> clients mapping
const resellerClients: Record<string, string[]> = {
  Tunav: ['Tunav'],
  'Global Logistics': ['Transport Express', 'Livraison Rapide'],
  'Auto Fleet Pro': ['Transport Express', 'Auto Fleet Pro']
};
function assignPartyLabel(reseller: string, client: string) {
  return reseller === client ?
  `${client} (revendeur et client)` :
  `${client} · ${reseller}`;
}
const assignPartyLabels: string[] = [];
const assignPartyByLabel: Record<string, { reseller: string; client: string }> = {};
for (const [reseller, clients] of Object.entries(resellerClients)) {
  for (const client of clients) {
    const label = assignPartyLabel(reseller, client);
    assignPartyLabels.push(label);
    assignPartyByLabel[label] = { reseller, client };
  }
}
assignPartyLabels.sort((a, b) => a.localeCompare(b, 'fr'));
// Client -> vehicles mapping
const clientVehicles: Record<string, string[]> = {
  Tunav: [],
  'Transport Express': ['AB-123-CD', 'EF-456-GH'],
  'Global Logistics': ['IJ-789-KL'],
  'Livraison Rapide': ['MN-012-OP'],
  'Auto Fleet Pro': ['QR-345-ST']
};
const initialMockEquipments = [
{
  id: 1,
  serial: 'EQ-2024-001',
  type: 'FMB120',
  sim: '+33612345678',
  simCallNumber: '0612345678',
  iccid: '89330123456789012345',
  server: 'Srv-Paris-1',
  port: '5027',
  client: 'Transport Express',
  reseller: 'Auto Fleet Pro',
  car: 'AB-123-CD',
  isInstalled: true,
  firstSendDate: '2024-01-15',
  contractDate: '2024-01-01',
  lastPosition: {
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
  }
},
{
  id: 2,
  serial: 'EQ-2024-002',
  type: 'FMC130',
  sim: '+33687654321',
  simCallNumber: '0687654321',
  iccid: '89330987654321098765',
  server: 'Srv-Paris-1',
  port: '5027',
  client: 'Global Logistics',
  reseller: 'Global Logistics',
  car: 'Unassigned',
  isInstalled: false,
  firstSendDate: '',
  contractDate: '2024-02-01',
  lastPosition: {
    dateLocal: '15/04/2025 14:22:10',
    latitude: 48.8738,
    longitude: 2.295,
    vitesse: 0,
    etat: 'Déconnectée',
    niveauCarburant: 58,
    totalCarburant: 3200.12,
    rpm: 0,
    temperatureMoteur: 25,
    kilometrage: 42150.8
  }
},
{
  id: 3,
  serial: 'EQ-2024-003',
  type: 'FMB920',
  sim: '+33611223344',
  simCallNumber: '0611223344',
  iccid: '89330112233445566778',
  server: 'Srv-Lyon-1',
  port: '5028',
  client: 'Auto Fleet Pro',
  reseller: 'Auto Fleet Pro',
  car: 'EF-456-GH',
  isInstalled: true,
  firstSendDate: '2024-03-10',
  contractDate: '2024-03-01',
  lastPosition: {
    dateLocal: '17/04/2025 11:05:22',
    latitude: 43.6047,
    longitude: 1.4442,
    vitesse: 35,
    etat: 'Connectée',
    niveauCarburant: 60,
    totalCarburant: 7200.3,
    rpm: 1500,
    temperatureMoteur: 85,
    kilometrage: 78500.2
  }
},
{
  id: 4,
  serial: 'EQ-2024-004',
  type: 'FMB120',
  sim: '+33699887766',
  simCallNumber: '0699887766',
  iccid: '89330998877665544332',
  server: 'Srv-Lyon-1',
  port: '5028',
  client: 'Tunav',
  reseller: 'Tunav',
  car: 'Unassigned',
  isInstalled: false,
  firstSendDate: '',
  contractDate: '',
  lastPosition: null
},
{
  id: 5,
  serial: 'EQ-2024-005',
  type: 'FMC130',
  sim: '+33655443322',
  simCallNumber: '0655443322',
  iccid: '89330554433221100998',
  server: 'Srv-Paris-1',
  port: '5027',
  client: 'Livraison Rapide',
  reseller: 'Auto Fleet Pro',
  car: 'IJ-789-KL',
  isInstalled: true,
  firstSendDate: '2024-04-05',
  contractDate: '2024-04-01',
  lastPosition: {
    dateLocal: '17/04/2025 09:15:30',
    latitude: 45.764,
    longitude: 4.8357,
    vitesse: 45,
    etat: 'Connectée',
    niveauCarburant: 72,
    totalCarburant: 8450.55,
    rpm: 1800,
    temperatureMoteur: 92,
    kilometrage: 98230.15
  }
},
{
  id: 6,
  serial: 'EQ-2024-006',
  type: 'FMB920',
  sim: '+33622334455',
  simCallNumber: '0622334455',
  iccid: '89330223344556677889',
  server: 'Srv-Lyon-1',
  port: '5028',
  client: 'Transport Express',
  reseller: 'Global Logistics',
  car: 'Unassigned',
  isInstalled: true,
  firstSendDate: '2024-04-20',
  contractDate: '2024-04-15',
  lastPosition: {
    dateLocal: '16/04/2025 18:40:15',
    latitude: 43.2965,
    longitude: 5.3698,
    vitesse: 0,
    etat: 'Connectée',
    niveauCarburant: 80,
    totalCarburant: 4500.0,
    rpm: 0,
    temperatureMoteur: 30,
    kilometrage: 32100.5
  }
}];

// --- Custom Split Stat Card Component ---
function SplitStatCard({
  title,
  val1,
  val2,
  label1,
  label2,
  icon: Icon,
  color1 = 'text-emerald-600',
  color2 = 'text-slate-500'
}: any) {
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 border-l-4 border-l-blue-500 shadow-sm transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wide">
          {title}
        </h3>
        {Icon &&
        <div className="p-2 rounded-lg bg-blue-50">
            <Icon className="text-blue-600" size={18} />
          </div>
        }
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex flex-col">
          <span className={`text-2xl font-semibold ${color1}`}>{val1}</span>
          <span className="text-[10px] uppercase font-medium text-slate-400">
            {label1}
          </span>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex flex-col">
          <span className={`text-2xl font-semibold ${color2}`}>{val2}</span>
          <span className="text-[10px] uppercase font-medium text-slate-400">
            {label2}
          </span>
        </div>
      </div>
    </div>);

}
export function EquipmentsPage() {
  const [equipments, setEquipments] = useState(initialMockEquipments);
  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  // Assignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [equipmentToAssign, setEquipmentToAssign] = useState<any>(null);
  const [assignParty, setAssignParty] = useState('');
  const [assignVehicle, setAssignVehicle] = useState('');
  // Stats filters
  const [statsPeriod, setStatsPeriod] = useState<PeriodKey>('30d');
  const [statsClient, setStatsClient] = useState('');
  const [statsReseller, setStatsReseller] = useState('');
  // Search & status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    '' | 'installed' | 'not_installed'>(
    '');
  const [vehicleFilter, setVehicleFilter] = useState<
    '' | 'assigned' | 'not_assigned'>(
    '');
  // Position map state
  const [showPositionMap, setShowPositionMap] = useState(false);
  // Handlers
  const openAddModal = () => {
    setSelectedEquipment(null);
    setIsAddEditModalOpen(true);
  };
  const openEditModal = (eq: any) => {
    setSelectedEquipment(eq);
    setIsAddEditModalOpen(true);
  };
  const openViewModal = (eq: any) => {
    setSelectedEquipment(eq);
    setShowPositionMap(false);
    setIsViewModalOpen(true);
  };
  const openDeleteModal = (eq: any) => {
    setSelectedEquipment(eq);
    setIsDeleteModalOpen(true);
  };
  const openAssignModal = (eq: any) => {
    setEquipmentToAssign(eq);
    const isDefaultTunav = eq.reseller === 'Tunav' && eq.client === 'Tunav';
    setAssignParty(isDefaultTunav ? '' : assignPartyLabel(eq.reseller, eq.client));
    setAssignVehicle(eq.car !== 'Unassigned' ? eq.car : '');
    setIsAssignModalOpen(true);
  };
  const handleAssign = () => {
    if (!equipmentToAssign) return;
    const pair = assignParty ?
    assignPartyByLabel[assignParty] :
    { reseller: 'Tunav', client: 'Tunav' };
    const reseller = pair?.reseller ?? 'Tunav';
    const client = pair?.client ?? 'Tunav';
    setEquipments((prev) =>
    prev.map((eq) =>
    eq.id === equipmentToAssign.id ?
    {
      ...eq,
      reseller,
      client,
      car: assignVehicle || 'Unassigned'
    } :
    eq
    )
    );
    setIsAssignModalOpen(false);
  };
  // Derived Stats
  const filteredStatsEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      const matchClient = statsClient ? eq.client === statsClient : true;
      const matchReseller = statsReseller ? eq.reseller === statsReseller : true;
      return matchClient && matchReseller;
    });
  }, [equipments, statsClient, statsReseller, statsPeriod]);
  const stats = useMemo(() => {
    const total = filteredStatsEquipments.length;
    const installed = filteredStatsEquipments.filter(
      (eq) => eq.isInstalled
    ).length;
    const notInstalled = total - installed;
    const assignedClient = filteredStatsEquipments.filter(
      (eq) => eq.client !== 'Tunav'
    ).length;
    const notAssignedClient = total - assignedClient;
    const assignedCar = filteredStatsEquipments.filter(
      (eq) => eq.car !== 'Unassigned'
    ).length;
    const notAssignedCar = total - assignedCar;
    return {
      total,
      installed,
      notInstalled,
      assignedClient,
      notAssignedClient,
      assignedCar,
      notAssignedCar
    };
  }, [filteredStatsEquipments]);
  // Derived Table Data — uses same filters as stats + search + status
  const filteredTableEquipments = useMemo(() => {
    return filteredStatsEquipments.filter((eq) => {
      const matchSearch =
      searchQuery === '' ||
      eq.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.sim.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
      statusFilter === '' ?
      true :
      statusFilter === 'installed' ?
      eq.isInstalled :
      !eq.isInstalled;
      const matchVehicle =
      vehicleFilter === '' ?
      true :
      vehicleFilter === 'assigned' ?
      eq.client !== 'Tunav' :
      eq.client === 'Tunav';
      return matchSearch && matchStatus && matchVehicle;
    });
  }, [filteredStatsEquipments, searchQuery, statusFilter, vehicleFilter]);
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Gestion des Équipements
        </h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          
          <Plus size={16} />
          Ajouter un équipement
        </button>
      </div>

      {/* --- STATS SECTION --- */}
      <section className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 shrink-0">
              <Cpu size={18} className="text-blue-600" />
              Filtres
            </div>
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14} />
              
              <input
                type="text"
                placeholder="Rechercher N° série, SIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
              
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter value={statsPeriod} onChange={setStatsPeriod} />
            <select
              value={statsClient}
              onChange={(e) => setStatsClient(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="">Tous les clients</option>
              {mockClients.map((c) =>
              <option key={c} value={c}>
                  {c}
                </option>
              )}
            </select>
            <select
              value={statsReseller}
              onChange={(e) => setStatsReseller(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="">Tous les revendeurs</option>
              {mockResellers.map((r) =>
              <option key={r} value={r}>
                  {r}
                </option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Équipements"
            value={stats.total.toString()}
            subtitle="Sur la période sélectionnée"
            icon={Cpu} />
          
          <SplitStatCard
            title="Installation"
            val1={stats.installed}
            label1="Installés"
            val2={stats.notInstalled}
            label2="Non installés"
            icon={CheckCircle2}
            color1="text-emerald-600"
            color2="text-amber-500" />
          
          <SplitStatCard
            title="Affectation Client"
            val1={stats.assignedClient}
            label1="Affectés"
            val2={stats.notAssignedClient}
            label2="Non affectés"
            icon={User}
            color1="text-blue-600"
            color2="text-slate-400" />
          
          <SplitStatCard
            title="Affectation Véhicule"
            val1={stats.assignedCar}
            label1="Affectés"
            val2={stats.notAssignedCar}
            label2="Non affectés"
            icon={Car}
            color1="text-indigo-600"
            color2="text-slate-400" />
          
        </div>
      </section>

      {/* --- TABLE SECTION --- */}
      <section className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {/* Status filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide shrink-0">
              Statut :
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === '' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                
                Tous
              </button>
              <button
                onClick={() => setStatusFilter('installed')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${statusFilter === 'installed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                
                <CheckCircle2 size={12} />
                Installé
              </button>
              <button
                onClick={() => setStatusFilter('not_installed')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${statusFilter === 'not_installed' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                
                <XCircle size={12} />
                Non installé
              </button>
            </div>
          </div>
          <div className="h-5 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide shrink-0">
              Client :
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVehicleFilter('')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${vehicleFilter === '' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                
                Tous
              </button>
              <button
                onClick={() => setVehicleFilter('assigned')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${vehicleFilter === 'assigned' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                
                <User size={12} />
                Assigné
              </button>
              <button
                onClick={() => setVehicleFilter('not_assigned')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${vehicleFilter === 'not_assigned' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                
                <XCircle size={12} />
                Non assigné
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                <th className="p-4 font-medium">N° Série / Type</th>
                <th className="p-4 font-medium">Revendeur</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Carte SIM</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filteredTableEquipments.length > 0 ?
              filteredTableEquipments.map((eq) =>
              <tr
                key={eq.id}
                className="hover:bg-slate-50 transition-colors">
                
                    <td className="p-4">
                      <div className="font-medium text-slate-900">
                        {eq.serial}
                      </div>
                      <div className="text-slate-500 text-xs">{eq.type}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-600">{eq.reseller}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-medium">
                        {eq.client}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Wifi size={14} className="text-slate-400" />
                        {eq.sim}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${eq.isInstalled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    
                        {eq.isInstalled ?
                    <CheckCircle2 size={12} /> :

                    <XCircle size={12} />
                    }
                        {eq.isInstalled ? 'Installé' : 'Non installé'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                      onClick={() => openAssignModal(eq)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                      title="Affecter">
                      
                          <Link2 size={16} />
                        </button>
                        <button
                      onClick={() => openViewModal(eq)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Voir les détails">
                      
                          <Eye size={16} />
                        </button>
                        <button
                      onClick={() => openEditModal(eq)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier">
                      
                          <Edit2 size={16} />
                        </button>
                        <button
                      onClick={() => openDeleteModal(eq)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Supprimer">
                      
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ) :

              <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun équipement trouvé avec ces filtres.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      {/* --- ADD/EDIT MODAL --- */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={
        selectedEquipment ? "Modifier l'équipement" : 'Ajouter un équipement'
        }
        size="lg">
        
        <form className="space-y-6">
          {/* Informations Équipement */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Cpu size={16} className="text-slate-400" />
              Informations Équipement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Type d'équipement
                </label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow">
                  <option>FMB120</option>
                  <option>FMC130</option>
                  <option>FMB920</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Numéro de série
                </label>
                <input
                  type="text"
                  defaultValue={selectedEquipment?.serial}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Statut installation
                </label>
                <select
                  defaultValue={
                  selectedEquipment?.isInstalled ? 'true' : 'false'
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow">
                  
                  <option value="true">Installé</option>
                  <option value="false">Non installé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Carte SIM */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Wifi size={16} className="text-slate-400" />
              Carte SIM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  N° d'appel puce
                </label>
                <input
                  type="text"
                  defaultValue={selectedEquipment?.simCallNumber}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  N° de série puce (ICCID)
                </label>
                <input
                  type="text"
                  defaultValue={selectedEquipment?.iccid}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
            </div>
          </div>

          {/* Connexion Serveur */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ServerIcon size={16} className="text-slate-400" />
              Connexion Serveur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Serveur
                </label>
                <input
                  type="text"
                  defaultValue={selectedEquipment?.server}
                  placeholder="Ex: Srv-Paris-1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  defaultValue={selectedEquipment?.port}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date du premier envoi
                </label>
                <input
                  type="date"
                  defaultValue={selectedEquipment?.firstSendDate}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date contractuelle adoptée
                </label>
                <input
                  type="date"
                  defaultValue={selectedEquipment?.contractDate}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer"></label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW DETAILS MODAL --- */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails de l'équipement"
        size="lg">
        
        {selectedEquipment &&
        <div className="space-y-6">
            {/* Header with serial and status */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedEquipment.serial}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedEquipment.type}
                  </p>
                </div>
              </div>
              <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${selectedEquipment.isInstalled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              
                {selectedEquipment.isInstalled ?
              <CheckCircle2 size={14} /> :

              <XCircle size={14} />
              }
                {selectedEquipment.isInstalled ? 'Installé' : 'Non installé'}
              </span>
            </div>

            {/* Section 1: Détails de l'équipement */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Cpu size={16} className="text-blue-500" />
                Détails de l'équipement
              </h4>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> N° de série
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.serial}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Cpu size={14} /> Type
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.type}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Wifi size={14} /> N° SIM
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.sim}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Wifi size={14} /> N° d'appel puce
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.simCallNumber}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> ICCID
                  </div>
                  <div className="text-sm font-medium text-slate-900 break-all">
                    {selectedEquipment.iccid}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <ServerIcon size={14} /> Serveur
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.server}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Hash size={14} /> Port
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.port}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Date premier envoi
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.firstSendDate ?
                  new Date(
                    selectedEquipment.firstSendDate
                  ).toLocaleDateString('fr-FR') :
                  '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Date contractuelle
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.contractDate ?
                  new Date(
                    selectedEquipment.contractDate
                  ).toLocaleDateString('fr-FR') :
                  '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Détails du Client */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <User size={16} className="text-indigo-500" />
                Détails du Client
              </h4>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <User size={14} /> Client
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.client}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Building2 size={14} /> Revendeur
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.reseller}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <Car size={14} /> Véhicule
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.car !== 'Unassigned' ?
                  selectedEquipment.car :

                  <span className="text-slate-400 italic">Non assigné</span>
                  }
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Statut installation
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedEquipment.isInstalled ?
                  'Installé' :
                  'Non installé'}
                  </div>
                </div>
              </div>
            </div>

            {/* Position Map */}
            {showPositionMap && selectedEquipment.lastPosition &&
          <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden h-[250px] relative z-0">
                <MapContainer
              center={[
              selectedEquipment.lastPosition.latitude,
              selectedEquipment.lastPosition.longitude]
              }
              zoom={13}
              scrollWheelZoom={false}
              style={{
                height: '100%',
                width: '100%'
              }}>
              
                  <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
                  <Marker
                position={[
                selectedEquipment.lastPosition.latitude,
                selectedEquipment.lastPosition.longitude]
                }
                icon={customMarkerIcon}>
                
                    <Popup>
                      <div className="text-xs leading-relaxed">
                        <strong>Dernière position:</strong>
                        <br />
                        Date Local={selectedEquipment.lastPosition.dateLocal}
                        <br />
                        Vitesse= {selectedEquipment.lastPosition.vitesse}km/h
                        <br />
                        État={' '}
                        <span
                      style={{
                        color:
                        selectedEquipment.lastPosition.etat ===
                        'Connectée' ?
                        '#16a34a' :
                        '#dc2626'
                      }}>
                      
                          {selectedEquipment.lastPosition.etat}
                        </span>
                        <br />
                        Niveau de carburant=
                        {selectedEquipment.lastPosition.niveauCarburant}%<br />
                        Total de carburant=
                        {selectedEquipment.lastPosition.totalCarburant}
                        <br />
                        RPM={selectedEquipment.lastPosition.rpm}
                        <br />
                        Température Moteur=
                        {selectedEquipment.lastPosition.temperatureMoteur}°C
                        <br />
                        Kilométrage={selectedEquipment.lastPosition.kilometrage}
                        km
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
          }

            {/* Position Details Info */}
            {showPositionMap && selectedEquipment.lastPosition &&
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                  <Navigation size={16} className="text-blue-500" />
                  Dernière position
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Calendar size={12} /> Date Local
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.dateLocal}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <MapPin size={12} /> Latitude
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.latitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <MapPin size={12} /> Longitude
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.longitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Gauge size={12} /> Vitesse
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.vitesse} km/h
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Activity size={12} /> État
                    </div>
                    <div
                  className={`text-sm font-semibold flex items-center gap-1.5 ${selectedEquipment.lastPosition.etat === 'Connectée' ? 'text-emerald-600' : 'text-red-600'}`}>
                  
                      <span
                    className={`w-2 h-2 rounded-full ${selectedEquipment.lastPosition.etat === 'Connectée' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  </span>
                      {selectedEquipment.lastPosition.etat}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Fuel size={12} /> Niveau de carburant
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.niveauCarburant}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Fuel size={12} /> Total de carburant
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.totalCarburant}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Activity size={12} /> RPM
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.rpm}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Thermometer size={12} /> Température Moteur
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.temperatureMoteur}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Navigation size={12} /> Kilométrage
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedEquipment.lastPosition.kilometrage.toLocaleString(
                    'fr-FR'
                  )}{' '}
                      km
                    </div>
                  </div>
                </div>
              </div>
          }

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              {selectedEquipment.lastPosition &&
            <button
              onClick={() => setShowPositionMap(!showPositionMap)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${showPositionMap ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
              
                  <MapPin size={16} />
                  {showPositionMap ? 'Masquer la position' : 'Voir position'}
                </button>
            }
              <button
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
                Fermer
              </button>
            </div>
          </div>
        }
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Supprimer l'équipement"
        size="md">
        
        <div className="space-y-6">
          <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm">
            Êtes-vous sûr de vouloir supprimer cet équipement{' '}
            <strong>{selectedEquipment?.serial}</strong> ? Cette action est
            irréversible.
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
              
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- ASSIGNMENT MODAL --- */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Affecter - ${equipmentToAssign?.serial}`}
        size="md">
        
        <div className="space-y-5">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <Link2 className="shrink-0 mt-0.5" size={16} />
            <p>
              Choisissez une ligne : <strong>client · revendeur</strong>, ou une
              entrée <strong>revendeur et client</strong> lorsque c’est la même
              structure.
            </p>
          </div>

          <SearchableSelect
            value={assignParty}
            onChange={setAssignParty}
            options={assignPartyLabels}
            placeholder="-- Revendeur / client --"
            label="Revendeur / client"
            icon={<Building2 size={14} />}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              onClick={handleAssign}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              
              Confirmer l'affectation
            </button>
          </div>
        </div>
      </Modal>
    </div>);

}