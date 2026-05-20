import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Users,
  UserCheck,
  UserX,
  Car,
  Eye,
  Link2,
  CheckCircle2,
  XCircle,
  Trash2,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  MapPin,
  Clock,
  Key,
  Hash,
  Phone,
  Mail,
  Shield,
  Building2,
  Cpu,
  Wifi,
  Server as ServerIcon,
  Calendar,
  Download,
  Ban,
  Settings,
  Gauge,
  Fuel,
  Thermometer,
  Activity,
  Navigation } from
'lucide-react';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { PeriodKey } from '../components/PeriodFilter';
import { ClientsFilterBar } from '../components/ClientsFilterBar';
import { useFleetStore, type FleetClient, type FleetEquipment } from '../state/FleetStore';
import {
  getVisibleClients,
  getVisibleEquipments
} from '../utils/fleetVisibility';
import { motion, AnimatePresence } from 'framer-motion';
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

function getPeriodRange(
  period: PeriodKey,
  start: string,
  end: string
): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  let from = new Date(now);
  from.setHours(0, 0, 0, 0);
  switch (period) {
    case '7d':
      from.setDate(from.getDate() - 6);
      break;
    case '30d':
      from.setDate(from.getDate() - 29);
      break;
    case '3m':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'custom':
      if (start) from = new Date(start);
      if (end) {
        to.setTime(new Date(end).getTime());
        to.setHours(23, 59, 59, 999);
      }
      break;
    default:
      break;
  }
  return { from, to };
}

function isDateInRange(dateStr: string, from: Date, to: Date): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;
  return d >= from && d <= to;
}

function parseEquipmentLastConnection(eq: FleetEquipment): Date | null {
  const dateLocal = eq.lastPosition?.dateLocal;
  if (typeof dateLocal === 'string' && dateLocal.trim()) {
    const m = dateLocal.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
    }
    const parsed = new Date(dateLocal.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (eq.firstSendDate?.trim()) {
    const d = new Date(eq.firstSendDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function formatClientLastConnection(date: Date | null | undefined): string {
  if (!date) return <span className="text-slate-400 italic text-xs">—</span>;
  return (
    <span className="text-sm text-slate-700 tabular-nums">
      {date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </span>
  );
}

function enrichClientForModal(c: FleetClient) {
  const mock = mockClients.find((m) => m.id === c.id || m.name === c.name);
  if (mock) {
    return {
      ...mock,
      ...c,
      vehicleLimit: c.vehicleLimit ?? mock.vehicleLimit
    };
  }
  return {
    ...c,
    website: '',
    formula: '',
    abonnement: '',
    timezone: 'UTC+1',
    address: '',
    tel2: '',
    email2: '',
    accountLimit: 10,
    username: '',
    password: ''
  };
}

// --- Mock Data ---
const mockClients = [
{
  id: 1,
  name: 'Transport Express',
  type: 'Simple',
  reseller: 'Tunav',
  email: 'contact@texpress.fr',
  tel: '+33 1 23 45 67 89',
  expiry: '2026-12-31',
  status: 'Active',
  website: 'www.texpress.fr',
  formula: 'Premium',
  abonnement: 'FleetIQ Pro',
  timezone: 'UTC+1',
  address: '12 Rue de la Logistique, 75001 Paris, France',
  tel2: '+33 1 98 76 54 32',
  email2: 'support@texpress.fr',
  vehicleLimit: 50,
  accountLimit: 10,
  username: 'texpress_admin',
  password: '••••••••'
},
{
  id: 2,
  name: 'MyCom',
  type: 'Revendeur',
  reseller: 'Tunav',
  email: 'admin@mycom.tn',
  tel: '+216 70 00 00 01',
  expiry: '2026-12-31',
  status: 'Active',
  website: 'www.mycom.tn',
  formula: 'Enterprise',
  abonnement: 'FleetIQ Secure',
  timezone: 'UTC+1',
  address: '45 Avenue des Transports, 69002 Lyon, France',
  tel2: '+33 4 11 22 33 44',
  email2: 'tech@glogistics.com',
  vehicleLimit: -1,
  accountLimit: 25,
  username: 'glogistics_admin',
  password: '••••••••'
},
{
  id: 3,
  name: 'Livraison Rapide',
  type: 'Simple',
  reseller: 'MyCom',
  email: 'hello@lrapide.fr',
  tel: '+33 6 12 34 56 78',
  expiry: '2024-10-15',
  status: 'Blocked',
  website: 'www.lrapide.fr',
  formula: 'Standard',
  abonnement: 'FleetIQ Mechanics',
  timezone: 'UTC+1',
  address: '8 Boulevard de la Vitesse, 13001 Marseille, France',
  tel2: '',
  email2: '',
  vehicleLimit: 20,
  accountLimit: 5,
  username: 'lrapide_admin',
  password: '••••••••'
},
{
  id: 5,
  name: 'Société Médicale ABC',
  type: 'Simple',
  reseller: 'Tunav',
  email: 'contact@medicale-abc.fr',
  tel: '+216 71 12 34 56',
  expiry: '2026-12-31',
  status: 'Active',
  website: 'www.medicale-abc.fr',
  formula: 'Standard',
  abonnement: 'FleetIQ Pro',
  timezone: 'UTC+1',
  address: '15 Avenue Habib Bourguiba, Tunis',
  tel2: '',
  email2: '',
  vehicleLimit: 30,
  accountLimit: 8,
  username: 'medicale_admin',
  password: '••••••••'
},
{
  id: 6,
  name: 'Transport Urbain Tunis',
  type: 'Simple',
  reseller: 'Tunav',
  email: 'admin@tut.tn',
  tel: '+216 71 98 76 54',
  expiry: '2027-06-30',
  status: 'Active',
  website: 'www.tut.tn',
  formula: 'Premium',
  abonnement: 'FleetIQ Secure',
  timezone: 'UTC+1',
  address: '42 Rue de la Gare, Tunis',
  tel2: '',
  email2: '',
  vehicleLimit: 50,
  accountLimit: 12,
  username: 'tut_admin',
  password: '••••••••'
},
{
  id: 7,
  name: 'Fret International',
  type: 'Simple',
  reseller: 'Tunav',
  email: 'contact@fret-intl.tn',
  tel: '+216 71 55 44 33',
  expiry: '2026-08-20',
  status: 'Active',
  website: 'www.fret-intl.tn',
  formula: 'Standard',
  abonnement: 'FleetIQ Pro',
  timezone: 'UTC+1',
  address: 'Zone industrielle, Sfax',
  tel2: '',
  email2: '',
  vehicleLimit: 40,
  accountLimit: 10,
  username: 'fret_admin',
  password: '••••••••'
},
{
  id: 8,
  name: 'Distribution Nord',
  type: 'Simple',
  reseller: 'Tunav',
  email: 'info@dist-nord.fr',
  tel: '+33 3 20 11 22 33',
  expiry: '2026-05-10',
  status: 'Blocked',
  website: 'www.dist-nord.fr',
  formula: 'Standard',
  abonnement: 'FleetIQ Mechanic',
  timezone: 'UTC+1',
  address: '8 Rue du Commerce, Lille',
  tel2: '',
  email2: '',
  vehicleLimit: 25,
  accountLimit: 6,
  username: 'distnord_admin',
  password: '••••••••'
}];

// Mock equipment details for lookup
const mockEquipmentDetails: Record<string, any> = {
  'EQ-2024-001': {
    serial: 'EQ-2024-001',
    type: 'FMB120',
    sim: '+33612345678',
    simCallNumber: '0612345678',
    iccid: '89330123456789012345',
    server: 'Srv-Paris-1',
    port: '5027',
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
  'EQ-2024-002': {
    serial: 'EQ-2024-002',
    type: 'FMC130',
    sim: '+33687654321',
    simCallNumber: '0687654321',
    iccid: '89330987654321098765',
    server: 'Srv-Paris-1',
    port: '5027',
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
  'EQ-2024-005': {
    serial: 'EQ-2024-005',
    type: 'FMC130',
    sim: '+33655443322',
    simCallNumber: '0655443322',
    iccid: '89330554433221100998',
    server: 'Srv-Paris-1',
    port: '5027',
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
  'EQ-2024-008': {
    serial: 'EQ-2024-008',
    type: 'FMB120',
    sim: '+33644556677',
    simCallNumber: '0644556677',
    iccid: '89330445566778899001',
    server: 'Srv-Lyon-1',
    port: '5028',
    isInstalled: true,
    firstSendDate: '2024-05-10',
    contractDate: '2024-05-01',
    lastPosition: {
      dateLocal: '18/04/2025 08:30:00',
      latitude: 43.2965,
      longitude: 5.3698,
      vitesse: 62,
      etat: 'Connectée',
      niveauCarburant: 45,
      totalCarburant: 6780.9,
      rpm: 2200,
      temperatureMoteur: 88,
      kilometrage: 55420.6
    }
  }
};
const initialMockVehicles = [
{
  id: 101,
  clientId: 1,
  plate: 'AB-123-CD',
  equipment: 'EQ-2024-001',
  isInstalled: true,
  expiry: '2025-12-31'
},
{
  id: 102,
  clientId: 1,
  plate: 'EF-456-GH',
  equipment: 'EQ-2024-002',
  isInstalled: false,
  expiry: '2025-12-31'
},
{
  id: 103,
  clientId: 2,
  plate: 'IJ-789-KL',
  equipment: 'EQ-2024-005',
  isInstalled: true,
  expiry: '2026-06-30'
},
{
  id: 104,
  clientId: 3,
  plate: 'MN-012-OP',
  equipment: 'EQ-2024-008',
  isInstalled: true,
  expiry: '2024-10-15'
}];

const mockEquipments = [
{
  serial: 'EQ-2024-001',
  type: 'FMB120'
},
{
  serial: 'EQ-2024-002',
  type: 'FMC130'
},
{
  serial: 'EQ-2024-003',
  type: 'FMB920'
},
{
  serial: 'EQ-2024-004',
  type: 'FMB120'
},
{
  serial: 'EQ-2024-005',
  type: 'FMC130'
},
{
  serial: 'EQ-2024-006',
  type: 'FMB920'
},
{
  serial: 'EQ-2024-008',
  type: 'FMB120'
}];

const STEPS = [
{
  id: 1,
  label: 'Général'
},
{
  id: 2,
  label: 'Contact'
},
{
  id: 3,
  label: 'Configuration'
},
{
  id: 4,
  label: 'Compte'
}];

const FLEETIQ_ABONNEMENTS = ['FleetIQ Secure', 'FleetIQ Pro', 'FleetIQ Mechanics', 'FleetIQ Vision'] as const;

function InstallPlateSelect({
  value,
  onChange,
  plates




}: {value: string;onChange: (v: string) => void;plates: string[];}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filtered = plates.filter((p) =>
  p.toLowerCase().includes(query.toLowerCase())
  );
  const showAddOption =
  query.trim() !== '' &&
  !plates.some((p) => p.toLowerCase() === query.trim().toLowerCase());
  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setIsOpen(true);
          setQuery('');
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm cursor-pointer transition-shadow ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
        
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || 'Sélectionner une immatriculation...'}
        </span>
        <Car size={16} className="text-slate-400 shrink-0" />
      </div>

      {isOpen &&
      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14} />
            
              <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher ou saisir une nouvelle..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
            
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.map((plate) =>
          <button
            key={plate}
            type="button"
            onClick={() => {
              onChange(plate);
              setIsOpen(false);
              setQuery('');
            }}
            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${value === plate ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
            
                <span className="flex items-center gap-2">
                  <Car size={14} className="text-slate-400" />
                  {plate}
                </span>
                {value === plate &&
            <CheckCircle2 size={14} className="text-blue-600" />
            }
              </button>
          )}
            {showAddOption &&
          <button
            type="button"
            onClick={() => {
              onChange(query.trim());
              setIsOpen(false);
              setQuery('');
            }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 border-t border-slate-100">
            
                <Plus size={14} className="text-emerald-600" />
                Ajouter "<strong>{query.trim()}</strong>"
              </button>
          }
            {filtered.length === 0 && !showAddOption &&
          <div className="px-3 py-4 text-center text-sm text-slate-400">
                Aucune immatriculation trouvée
              </div>
          }
          </div>
        </div>
      }
    </div>);

}
export function ClientsPage() {
  const { currentUserRole, currentUserName, clients: storeClients, equipments, setEquipments } =
    useFleetStore();
  const isResellerUser = currentUserRole === 'Revendeur';
  const isTunavUser = currentUserRole === 'Tunav';
  // Main Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expiryFilterEnabled, setExpiryFilterEnabled] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodKey>('30d');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  // Multi-step Add/Edit Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editAbonnement, setEditAbonnement] = useState<string>(FLEETIQ_ABONNEMENTS[0]);
  const [currentStep, setCurrentStep] = useState(1);
  const [clientType, setClientType] = useState<'Simple' | 'Revendeur'>('Simple');
  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [clientToView, setClientToView] = useState<any>(null);
  // Vehicles Modal State
  const [allVehicles, setAllVehicles] = useState<any[]>(initialMockVehicles);
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState(false);
  const [clientForVehicles, setClientForVehicles] = useState<any>(null);
  const [clientVehicles, setClientVehicles] = useState<any[]>([]);
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState<any>(null);
  // Add Vehicle Modal State
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  // Assign Equipment Modal State
  const [isAssignEquipmentModalOpen, setIsAssignEquipmentModalOpen] =
  useState(false);
  const [vehicleToAssign, setVehicleToAssign] = useState<any>(null);
  const [selectedEquipmentSerial, setSelectedEquipmentSerial] = useState('');
  // Equipment search state
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  // Form States for Limits Step
  const [vehicleLimitType, setVehicleLimitType] = useState('authorized');
  const [accountLimitType, setAccountLimitType] = useState('authorized');
  // Edit Equipment Modal State
  const [isEditEquipmentModalOpen, setIsEditEquipmentModalOpen] =
  useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<any>(null);
  // Install Equipment Modal State
  const [isInstallEquipmentModalOpen, setIsInstallEquipmentModalOpen] =
  useState(false);
  const [vehicleToInstall, setVehicleToInstall] = useState<any>(null);
  const [installPlate, setInstallPlate] = useState('');
  // View Equipment Details Modal State
  const [isViewEquipmentModalOpen, setIsViewEquipmentModalOpen] =
  useState(false);
  const [equipmentToView, setEquipmentToView] = useState<any>(null);
  const [showPositionMap, setShowPositionMap] = useState(false);
  // Configuration Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [vehicleToConfig, setVehicleToConfig] = useState<any>(null);
  const [configLog, setConfigLog] = useState('desactiver');
  const [configIButton, setConfigIButton] = useState(true);
  const [configAAD, setConfigAAD] = useState('');
  const [configCalcStat, setConfigCalcStat] = useState(false);
  const [configDupPos, setConfigDupPos] = useState(false);
  const [configDupSerial, setConfigDupSerial] = useState('');
  // --- Handlers ---
  const openAddEditModal = (client: any = null) => {
    setSelectedClient(client);
    const nextAbonnement =
    client?.abonnement && FLEETIQ_ABONNEMENTS.includes(client.abonnement as (typeof FLEETIQ_ABONNEMENTS)[number]) ?
    client.abonnement :
    FLEETIQ_ABONNEMENTS[0];
    setEditAbonnement(nextAbonnement);
    setCurrentStep(1);
    setClientType(isResellerUser ? 'Simple' : client?.type === 'Revendeur' ? 'Revendeur' : 'Simple');
    setVehicleLimitType('authorized');
    setAccountLimitType('authorized');
    setIsAddEditModalOpen(true);
  };
  const openViewModal = (client: any) => {
    setClientToView(client);
    setIsViewModalOpen(true);
  };
  const openClientEquipmentsModal = (client: FleetClient | (typeof mockClients)[number]) => {
    setClientForVehicles(client);
    setIsVehiclesModalOpen(true);
  };

  const clientAssignedEquipments = useMemo(() => {
    if (!clientForVehicles?.name) return [];
    return equipments.filter(
      (e) => e.client === clientForVehicles.name && !e.client.endsWith('_Stock')
    );
  }, [equipments, clientForVehicles?.name]);

  const installedCountByClient = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of equipments) {
      if (e.isInstalled && !e.client.endsWith('_Stock')) {
        m.set(e.client, (m.get(e.client) ?? 0) + 1);
      }
    }
    return m;
  }, [equipments]);

  const [clientEquipmentToInstall, setClientEquipmentToInstall] = useState<FleetEquipment | null>(null);
  const [clientInstallPlate, setClientInstallPlate] = useState('');
  const [clientInstallError, setClientInstallError] = useState<string | null>(null);
  const [isClientInstallOpen, setIsClientInstallOpen] = useState(false);

  const clientInstallPlateOptions = useMemo(() => {
    const clientName = clientEquipmentToInstall?.client;
    if (!clientName) return [];
    const plates = new Set<string>();
    for (const e of equipments) {
      if (e.client !== clientName) continue;
      const plate = typeof e.car === 'string' ? e.car.trim() : '';
      if (!plate || plate === 'Unassigned') continue;
      plates.add(plate);
    }
    return Array.from(plates).sort((a, b) => a.localeCompare(b));
  }, [equipments, clientEquipmentToInstall?.client]);

  const openClientEquipmentInstall = (eq: FleetEquipment) => {
    const c = storeClients.find((x) => x.name === eq.client);
    const limit = c?.vehicleLimit;
    const installed = installedCountByClient.get(eq.client) ?? 0;
    if (typeof limit === 'number' && limit >= 0 && installed >= limit) {
      window.alert(`Limite atteinte: ${installed}/${limit} véhicules installés.`);
      return;
    }
    setClientEquipmentToInstall(eq);
    setClientInstallPlate(eq.car && eq.car !== 'Unassigned' ? eq.car : '');
    setClientInstallError(null);
    setIsClientInstallOpen(true);
  };

  const confirmClientEquipmentInstall = () => {
    if (!clientEquipmentToInstall) return;
    const plate = clientInstallPlate.trim();
    if (!plate) {
      setClientInstallError('Veuillez saisir une immatriculation.');
      return;
    }
    setEquipments((prev) =>
      prev.map((e) =>
        e.id === clientEquipmentToInstall.id ? { ...e, isInstalled: true, car: plate } : e
      )
    );
    setIsClientInstallOpen(false);
    setClientEquipmentToInstall(null);
  };

  const uninstallClientEquipment = (eq: FleetEquipment) => {
    setEquipments((prev) =>
      prev.map((e) => (e.id === eq.id ? { ...e, isInstalled: false, car: 'Unassigned' } : e))
    );
  };
  const toggleVehicleStatus = (vehicleId: number, status: boolean) => {
    const updateFn = (prev: any[]) =>
    prev.map((v) =>
    v.id === vehicleId ?
    {
      ...v,
      isInstalled: status
    } :
    v
    );
    setClientVehicles(updateFn);
    setAllVehicles(updateFn);
  };
  const deleteVehicle = (vehicleId: number) => {
    setClientVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setAllVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };
  const openPaymentModal = (client: any) => {
    setClientForPayment(client);
    setIsPaymentModalOpen(true);
  };
  const openAddVehicleModal = () => {
    setNewVehiclePlate('');
    setIsAddVehicleModalOpen(true);
  };
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim() || !clientForVehicles) return;
    const newVehicle = {
      id: Date.now(),
      clientId: clientForVehicles.id,
      plate: newVehiclePlate,
      equipment: '-',
      isInstalled: false,
      expiry: clientForVehicles.expiry
    };
    setClientVehicles((prev) => [...prev, newVehicle]);
    setAllVehicles((prev) => [...prev, newVehicle]);
    setIsAddVehicleModalOpen(false);
  };
  const openAssignEquipmentModal = (vehicle: any) => {
    setVehicleToAssign(vehicle);
    setSelectedEquipmentSerial(
      vehicle.equipment !== '-' ? vehicle.equipment : ''
    );
    setEquipmentSearchQuery('');
    setIsAssignEquipmentModalOpen(true);
  };
  const handleAssignEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToAssign) return;
    const updateFn = (prev: any[]) =>
    prev.map((v) =>
    v.id === vehicleToAssign.id ?
    {
      ...v,
      equipment: selectedEquipmentSerial || '-'
    } :
    v
    );
    setClientVehicles(updateFn);
    setAllVehicles(updateFn);
    setIsAssignEquipmentModalOpen(false);
  };
  const openEditEquipmentModal = (vehicle: any) => {
    const eqSerial = vehicle.equipment;
    if (eqSerial && eqSerial !== '-') {
      const eqData = mockEquipmentDetails[eqSerial] || {
        serial: eqSerial,
        type: '',
        sim: '',
        simCallNumber: '',
        iccid: '',
        server: '',
        port: '',
        isInstalled: vehicle.isInstalled,
        firstSendDate: '',
        contractDate: ''
      };
      setEquipmentToEdit(eqData);
    } else {
      setEquipmentToEdit(null);
    }
    setIsEditEquipmentModalOpen(true);
  };
  // Install Equipment Handler
  const openInstallEquipmentModal = (vehicle: any) => {
    setVehicleToInstall(vehicle);
    setInstallPlate(vehicle.plate);
    setIsInstallEquipmentModalOpen(true);
  };
  const handleInstallEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToInstall || !installPlate.trim()) return;
    const updateFn = (prev: any[]) =>
    prev.map((v) =>
    v.id === vehicleToInstall.id ?
    {
      ...v,
      plate: installPlate,
      isInstalled: true
    } :
    v
    );
    setClientVehicles(updateFn);
    setAllVehicles(updateFn);
    setIsInstallEquipmentModalOpen(false);
  };
  // View Equipment Details Handler
  const openViewEquipmentDetailsModal = (vehicle: any) => {
    const eqSerial = vehicle.equipment;
    if (eqSerial && eqSerial !== '-') {
      const eqData = mockEquipmentDetails[eqSerial] || {
        serial: eqSerial,
        type: '',
        sim: '',
        simCallNumber: '',
        iccid: '',
        server: '',
        port: '',
        isInstalled: vehicle.isInstalled,
        firstSendDate: '',
        contractDate: ''
      };
      setEquipmentToView(eqData);
    } else {
      setEquipmentToView(null);
    }
    setShowPositionMap(false);
    setIsViewEquipmentModalOpen(true);
  };
  const openConfigModal = (vehicle: any) => {
    setVehicleToConfig(vehicle);
    // Reset config states to default
    setConfigLog('desactiver');
    setConfigIButton(true);
    setConfigAAD('');
    setConfigCalcStat(false);
    setConfigDupPos(false);
    setConfigDupSerial('');
    setIsConfigModalOpen(true);
  };
  const visibleEquipments = useMemo(
    () => getVisibleEquipments(equipments, currentUserRole, currentUserName),
    [equipments, currentUserRole, currentUserName]
  );

  const equipmentStats = useMemo(() => {
    const simpleByClient = new Map<string, { installed: number; total: number }>();
    const resellerTotals = new Map<string, number>();
    const lastConnectionByClient = new Map<string, Date>();

    const registerLastConnection = (key: string, at: Date) => {
      const cur = lastConnectionByClient.get(key);
      if (!cur || at > cur) lastConnectionByClient.set(key, at);
    };

    for (const e of visibleEquipments) {
      const lastAt = parseEquipmentLastConnection(e);

      if (e.reseller) {
        resellerTotals.set(e.reseller, (resellerTotals.get(e.reseller) ?? 0) + 1);
        if (lastAt) registerLastConnection(e.reseller, lastAt);
      }

      if (!e.client.endsWith('_Stock') && e.client !== 'Tunav') {
        const cur = simpleByClient.get(e.client) ?? { installed: 0, total: 0 };
        cur.total += 1;
        if (e.isInstalled) cur.installed += 1;
        simpleByClient.set(e.client, cur);
        if (lastAt) registerLastConnection(e.client, lastAt);
      }
    }
    return { simpleByClient, resellerTotals, lastConnectionByClient };
  }, [visibleEquipments]);

  const visibleClients = useMemo(
    () =>
      getVisibleClients(
        storeClients,
        visibleEquipments,
        currentUserRole,
        currentUserName
      ),
    [storeClients, visibleEquipments, currentUserRole, currentUserName]
  );

  const periodRange = useMemo(
    () => getPeriodRange(periodFilter, periodStart, periodEnd),
    [periodFilter, periodStart, periodEnd]
  );

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleClients.filter((client) => {
      const matchSearch =
        !q ||
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q);
      const matchType = typeFilter ? client.type === typeFilter : true;
      const matchStatus = statusFilter ? client.status === statusFilter : true;
      const matchPeriod =
        !expiryFilterEnabled ||
        isDateInRange(client.expiry, periodRange.from, periodRange.to);
      return matchSearch && matchType && matchStatus && matchPeriod;
    });
  }, [
    visibleClients,
    searchQuery,
    typeFilter,
    statusFilter,
    expiryFilterEnabled,
    periodRange
  ]);

  const hasActiveFilters =
    !!searchQuery.trim() ||
    !!typeFilter ||
    !!statusFilter ||
    expiryFilterEnabled;

  const activeFilterCount = [
    searchQuery.trim(),
    typeFilter,
    statusFilter,
    expiryFilterEnabled
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setExpiryFilterEnabled(false);
    setPeriodFilter('30d');
    setPeriodStart('');
    setPeriodEnd('');
  };

  const totalEquipmentCount = useMemo(
    () =>
      filteredClients.reduce((sum, c) => {
        if (c.type === 'Revendeur') {
          return sum + (equipmentStats.resellerTotals.get(c.name) ?? 0);
        }
        return sum + (equipmentStats.simpleByClient.get(c.name)?.total ?? 0);
      }, 0),
    [filteredClients, equipmentStats]
  );

  const activeCount = filteredClients.filter((c) => c.status === 'Active').length;
  const blockedCount = filteredClients.filter((c) => c.status === 'Blocked').length;
  // --- Wizard Navigation ---
  const visibleSteps = useMemo(
    () => (clientType === 'Revendeur' ? STEPS.filter((s) => s.id !== 3) : STEPS),
    [clientType]
  );
  const currentStepIdx = Math.max(
    0,
    visibleSteps.findIndex((s) => s.id === currentStep)
  );
  const nextStep = () =>
    setCurrentStep(visibleSteps[Math.min(currentStepIdx + 1, visibleSteps.length - 1)]?.id ?? 1);
  const prevStep = () => setCurrentStep(visibleSteps[Math.max(currentStepIdx - 1, 0)]?.id ?? 1);

  useEffect(() => {
    // If switching to Revendeur while on Configuration step, move back to Contact
    if (clientType === 'Revendeur' && currentStep === 3) setCurrentStep(2);
  }, [clientType, currentStep]);

  useEffect(() => {
    if (isResellerUser && clientType === 'Revendeur') setClientType('Simple');
  }, [isResellerUser, clientType]);
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Gestion Clients
        </h1>
        <button
          onClick={() => openAddEditModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          
          <Plus size={16} />
          Ajouter un client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={String(filteredClients.length)}
          trend=""
          trendUp={true}
          subtitle="Selon filtres actifs"
          icon={Users} />
        
        <StatCard
          title="Clients Actifs"
          value={String(activeCount)}
          trend={
            filteredClients.length > 0
              ? `${Math.round((activeCount / filteredClients.length) * 100)}%`
              : '0%'
          }
          trendUp={true}
          subtitle="Taux d'activité"
          icon={UserCheck} />
        
        <StatCard
          title="Clients Bloqués"
          value={String(blockedCount)}
          trend={
            filteredClients.length > 0
              ? `${Math.round((blockedCount / filteredClients.length) * 100)}%`
              : '0%'
          }
          trendUp={false}
          subtitle="Nécessite attention"
          icon={UserX} />
        
        <StatCard
          title="Total Équipements"
          value={String(totalEquipmentCount)}
          trend=""
          trendUp={true}
          subtitle="Clients filtrés"
          icon={Cpu} />
        
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <ClientsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          expiryFilterEnabled={expiryFilterEnabled}
          onExpiryFilterEnabledChange={setExpiryFilterEnabled}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          filteredCount={filteredClients.length}
          totalCount={visibleClients.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Revendeur</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Parc équipements</th>
                <th className="p-4 font-medium">Dernière connexion</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filteredClients.map((client) =>
              <tr
                key={client.id}
                className="hover:bg-slate-50 transition-colors">
                
                  <td className="p-4 font-medium text-slate-900">{client.name}</td>
                  <td className="p-4 text-slate-600">{client.reseller}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${client.type === 'Revendeur' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {client.type === 'Revendeur' ? 'Revendeur' : 'Simple'}
                    </span>
                  </td>
                  <td className="p-4">
                    {client.type === 'Revendeur' ? (
                      (() => {
                        const total = equipmentStats.resellerTotals.get(client.name) ?? 0;
                        return (
                          <span
                            className={`text-sm font-medium tabular-nums ${total === 0 ? 'text-slate-400 italic' : 'text-slate-700'}`}
                            title={`${total} équipement${total > 1 ? 's' : ''} affecté${total > 1 ? 's' : ''} au total`}
                          >
                            {total === 0 ? 'Aucun' : total}
                          </span>
                        );
                      })()
                    ) : (
                      (() => {
                        const stats = equipmentStats.simpleByClient.get(client.name) ?? {
                          installed: 0,
                          total: 0
                        };
                        if (stats.total === 0) {
                          return (
                            <span className="text-slate-400 italic text-xs">Aucun équipement</span>
                          );
                        }
                        return (
                          <span
                            className="text-sm font-medium tabular-nums text-slate-700"
                            title={`${stats.installed} installé${stats.installed > 1 ? 's' : ''} sur ${stats.total} affecté${stats.total > 1 ? 's' : ''}`}
                          >
                            <span className="text-emerald-600">{stats.installed}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span>{stats.total}</span>
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="p-4">
                    {formatClientLastConnection(
                      equipmentStats.lastConnectionByClient.get(client.name)
                    )}
                  </td>
                  <td className="p-4">
                    <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${client.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
                    
                      <span
                      className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    </span>
                      {client.status === 'Active' ? 'Actif' : 'Bloqué'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                      onClick={() => openAddEditModal(enrichClientForModal(client))}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier">
                      
                        <Edit2 size={16} />
                      </button>
                      <button
                      onClick={() => openViewModal(enrichClientForModal(client))}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Voir détails">
                      
                        <Eye size={16} />
                      </button>
                      <button
                      onClick={() => openClientEquipmentsModal(client)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Équipements affectés">
                      
                        <Cpu size={16} />
                      </button>
                      <button
                      onClick={() => openPaymentModal(enrichClientForModal(client))}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      title="Valider le paiement">
                      
                        <CreditCard size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 1. MULTI-STEP ADD/EDIT MODAL --- */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedClient ? 'Modifier le client' : 'Ajouter un client'}
        size="lg">
        
        <div className="flex flex-col h-full">
          {/* Step Indicator */}
          <div className="mb-8 px-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 -z-10 transition-all duration-300"
                style={{
                  width: `${visibleSteps.length <= 1 ? 0 : currentStepIdx / (visibleSteps.length - 1) * 100}%`
                }}>
              </div>
              {visibleSteps.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center gap-2">
                    
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isCompleted ? 'bg-blue-600 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                      
                      {isCompleted ? <Check size={16} /> : step.id}
                    </div>
                    <span
                      className={`text-xs font-medium absolute -bottom-6 whitespace-nowrap ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                      
                      {step.label}
                    </span>
                  </div>);

              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-hidden relative min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: -20
                }}
                transition={{
                  duration: 0.2
                }}
                className="space-y-4">
                
                {currentStep === 1 &&
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Type de client
                        </label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                            type="radio"
                            name="type"
                            checked={clientType === 'Simple'}
                            onChange={() => setClientType('Simple')}
                            className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                          
                            <span className="text-sm text-slate-700">
                              Simple
                            </span>
                          </label>
                          {!isResellerUser && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                              type="radio"
                              name="type"
                              checked={clientType === 'Revendeur'}
                              onChange={() => setClientType('Revendeur')}
                              className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                            
                              <span className="text-sm text-slate-700">
                                Revendeur
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Nom
                        </label>
                        <input
                        type="text"
                        defaultValue={selectedClient?.name}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Date d'expiration
                        </label>
                        <input
                        type="date"
                        defaultValue={selectedClient?.expiry}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Site web
                        </label>
                        <input
                        type="url"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Décalage horaire
                        </label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow">
                          <option value="UTC">UTC</option>
                          <option value="UTC+1">UTC+1 (Europe centrale)</option>
                          <option value="UTC+2">UTC+2 (Europe de l'Est)</option>
                        </select>
                      </div>
                      {selectedClient &&
                    <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Abonnement FleetIQ
                          </label>
                          <select
                        value={editAbonnement}
                        onChange={(e) => setEditAbonnement(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow">
                        
                            {FLEETIQ_ABONNEMENTS.map((ab) =>
                        <option key={ab} value={ab}>
                                {ab}
                              </option>
                        )}
                          </select>
                        </div>
                    }
                    </div>
                  </div>
                }

                {currentStep === 2 &&
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Adresse complète
                        </label>
                        <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Téléphone 1
                        </label>
                        <input
                        type="tel"
                        defaultValue={selectedClient?.tel}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Email 1
                        </label>
                        <input
                        type="email"
                        defaultValue={selectedClient?.email}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Téléphone 2
                        </label>
                        <input
                        type="tel"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Email 2
                        </label>
                        <input
                        type="email"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                    </div>
                  </div>
                }

                {currentStep === 3 &&
                <div className="space-y-6">
                    {/* Véhicules */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-900 mb-3">
                        Nombre de véhicules
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="vehicleLimit"
                          checked={vehicleLimitType === 'authorized'}
                          onChange={() => setVehicleLimitType('authorized')}
                          className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                        
                          <span className="text-sm text-slate-700">
                            Nombre de véhicules autorisé
                          </span>
                        </label>
                        {vehicleLimitType === 'authorized' &&
                      <div className="pl-7">
                            <input
                          type="number"
                          placeholder="Saisissez le nombre"
                          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                        
                          </div>
                      }
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="vehicleLimit"
                          checked={vehicleLimitType === 'unlimited'}
                          onChange={() => setVehicleLimitType('unlimited')}
                          className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                        
                          <span className="text-sm text-slate-700">
                            Nombre de véhicules illimité
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Comptes */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-900 mb-3">
                        Nombre de comptes
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="accountLimit"
                          checked={accountLimitType === 'authorized'}
                          onChange={() => setAccountLimitType('authorized')}
                          className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                        
                          <span className="text-sm text-slate-700">
                            Nombre de comptes autorisé
                          </span>
                        </label>
                        {accountLimitType === 'authorized' &&
                      <div className="pl-7">
                            <input
                          type="number"
                          placeholder="Saisissez le nombre"
                          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                        
                          </div>
                      }
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                          type="radio"
                          name="accountLimit"
                          checked={accountLimitType === 'unlimited'}
                          onChange={() => setAccountLimitType('unlimited')}
                          className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                        
                          <span className="text-sm text-slate-700">
                            Nombre de comptes illimité
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                }

                {currentStep === 4 &&
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Nom d'utilisateur
                        </label>
                        <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Nouveau mot de passe
                        </label>
                        <input
                        type="password"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Répétez mot de passe
                        </label>
                        <input
                        type="password"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                      
                      </div>
                    </div>
                  </div>
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              
              Annuler
            </button>
            <div className="flex gap-3">
              {currentStep > 1 &&
              <button
                onClick={prevStep}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                
                  <ChevronLeft size={16} />
                  Précédent
                </button>
              }
              {currentStepIdx < visibleSteps.length - 1 ?
              <button
                onClick={nextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1">
                
                  Suivant
                  <ChevronRight size={16} />
                </button> :

              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1">
                
                  <Check size={16} />
                  Enregistrer
                </button>
              }
            </div>
          </div>
        </div>
      </Modal>

      {/* --- 2. VIEW DETAILS MODAL --- */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails du Client"
        size="lg">
        
        {clientToView &&
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {clientToView.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-medium ${clientToView.type === 'Revendeur' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  
                    {clientToView.type}
                  </span>
                  <span
                  className={`flex items-center gap-1 text-[10px] font-medium ${clientToView.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
                  
                    <span
                    className={`w-1.5 h-1.5 rounded-full ${clientToView.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  </span>
                    {clientToView.status === 'Active' ? 'Actif' : 'Bloqué'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Informations Générales */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Informations Générales
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Hash size={12} /> Type de client
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.type}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Building2 size={12} /> Revendeur
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.reseller}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <CreditCard size={12} /> Date d'expiration
                  </div>
                  <div className="font-medium text-slate-900">
                    {new Date(clientToView.expiry).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Globe size={12} /> Site web
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.website || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Shield size={12} /> Formule commerciale
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.formula || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Clock size={12} /> Décalage horaire
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.timezone || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" />
                Contact
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="col-span-2">
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <MapPin size={12} /> Adresse complète
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.address || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Phone size={12} /> Téléphone 1
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.tel}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Mail size={12} /> Email 1
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.email}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Phone size={12} /> Téléphone 2
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.tel2 || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Mail size={12} /> Email 2
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.email2 || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Limites */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Car size={16} className="text-emerald-500" />
                Configuration
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Car size={12} /> Nombre de véhicules autorisé
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.vehicleLimit === -1 ?
                  'Illimité' :
                  clientToView.vehicleLimit ?? '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Users size={12} /> Nombre de comptes autorisé
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.accountLimit === -1 ?
                  'Illimité' :
                  clientToView.accountLimit ?? '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Compte */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Key size={16} className="text-amber-500" />
                Compte
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Users size={12} /> Nom d'utilisateur
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.username || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1.5">
                    <Key size={12} /> Mot de passe
                  </div>
                  <div className="font-medium text-slate-900">
                    {clientToView.password || '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
                Fermer
              </button>
            </div>
          </div>
        }
      </Modal>

      {/* --- 3. CLIENT EQUIPMENTS POPUP --- */}
      <Modal
        isOpen={isVehiclesModalOpen}
        onClose={() => setIsVehiclesModalOpen(false)}
        title={`Équipements affectés — ${clientForVehicles?.name ?? ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {clientAssignedEquipments.length} équipement
            {clientAssignedEquipments.length > 1 ? 's' : ''} affecté
            {clientAssignedEquipments.length > 1 ? 's' : ''} à ce client.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3 font-medium">Équipement</th>
                  <th className="p-3 font-medium">Véhicule</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {clientAssignedEquipments.length > 0 ? (
                  clientAssignedEquipments.map((eq) => {
                    const eqType = eq.equipmentType ?? eq.type;
                    const plate = eq.car && eq.car !== 'Unassigned' ? eq.car : null;
                    return (
                      <tr key={eq.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-medium text-slate-900">{eqType}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Hash size={11} />
                            {eq.serial}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-900">
                          {plate ?? (
                            <span className="text-slate-400 italic font-normal">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                              eq.isInstalled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {eq.isInstalled ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {eq.isInstalled ? 'Installée' : 'Non installée'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {eq.isInstalled ? (
                            <button
                              type="button"
                              onClick={() => uninstallClientEquipment(eq)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              <XCircle size={14} />
                              Désinstaller
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openClientEquipmentInstall(eq)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 size={14} />
                              Installer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Aucun équipement affecté à ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClientInstallOpen}
        onClose={() => {
          setIsClientInstallOpen(false);
          setClientEquipmentToInstall(null);
        }}
        title={`Installer — ${clientEquipmentToInstall?.serial ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Immatriculation (véhicule)
            </label>
            <InstallPlateSelect
              value={clientInstallPlate}
              onChange={setClientInstallPlate}
              plates={clientInstallPlateOptions}
            />
            <p className="mt-1 text-xs text-slate-500">
              Recherchez dans la liste ou ajoutez une nouvelle immatriculation si elle n&apos;existe pas.
            </p>
          </div>
          {clientInstallError && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">
              {clientInstallError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsClientInstallOpen(false);
                setClientEquipmentToInstall(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmClientEquipmentInstall}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Installer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- 4. PAYMENT VALIDATION POPUP --- */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Paiement - ${clientForPayment?.name}`}
        size="md">
        
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <CreditCard className="shrink-0 mt-0.5" size={16} />
            <p>
              Date d'expiration actuelle :{' '}
              <strong>
                {clientForPayment?.expiry ?
                new Date(clientForPayment.expiry).toLocaleDateString(
                  'fr-FR'
                ) :
                '-'}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Statut actuel :</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${clientForPayment?.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
              
              <span
                className={`w-1.5 h-1.5 rounded-full ${clientForPayment?.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              </span>
              {clientForPayment?.status === 'Active' ? 'Actif' : 'Bloqué'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nouvelle date d'expiration
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
            
          </div>
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2">
              
              <Ban size={14} />
              Bloquer
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                
                Annuler
              </button>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- 5. ADD VEHICLE MODAL --- */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Ajouter un véhicule"
        size="md">
        
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom / Immatriculation du véhicule
            </label>
            <input
              type="text"
              value={newVehiclePlate}
              onChange={(e) => setNewVehiclePlate(e.target.value)}
              placeholder="Ex: AB-123-CD"
              autoFocus
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
              required />
            
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddVehicleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              type="submit"
              disabled={!newVehiclePlate.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              
              Ajouter
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 6. ASSIGN EQUIPMENT MODAL --- */}
      <Modal
        isOpen={isAssignEquipmentModalOpen}
        onClose={() => setIsAssignEquipmentModalOpen(false)}
        title={`Affecter un équipement - ${vehicleToAssign?.plate}`}
        size="md">
        
        <form onSubmit={handleAssignEquipment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rechercher un équipement
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16} />
              
              <input
                type="text"
                value={equipmentSearchQuery}
                onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                placeholder="Rechercher par N° série ou type..."
                autoFocus
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
              
            </div>
            {selectedEquipmentSerial &&
            <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm">
                <CheckCircle2 size={14} />
                <span className="font-medium">{selectedEquipmentSerial}</span>
                <span className="text-blue-500">
                  (
                  {
                mockEquipments.find(
                  (eq) => eq.serial === selectedEquipmentSerial
                )?.type
                }
                  )
                </span>
                <button
                type="button"
                onClick={() => setSelectedEquipmentSerial('')}
                className="ml-auto text-blue-400 hover:text-blue-600">
                
                  <XCircle size={14} />
                </button>
              </div>
            }
            <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
              {mockEquipments.
              filter((eq) => {
                const q = equipmentSearchQuery.toLowerCase();
                return (
                  eq.serial.toLowerCase().includes(q) ||
                  eq.type.toLowerCase().includes(q));

              }).
              map((eq) =>
              <button
                key={eq.serial}
                type="button"
                onClick={() => setSelectedEquipmentSerial(eq.serial)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${selectedEquipmentSerial === eq.serial ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                
                    <span>
                      <span className="font-medium">{eq.serial}</span>
                      <span className="text-slate-400 ml-2">({eq.type})</span>
                    </span>
                    {selectedEquipmentSerial === eq.serial &&
                <CheckCircle2
                  size={14}
                  className="text-blue-600 shrink-0" />

                }
                  </button>
              )}
              {mockEquipments.filter((eq) => {
                const q = equipmentSearchQuery.toLowerCase();
                return (
                  eq.serial.toLowerCase().includes(q) ||
                  eq.type.toLowerCase().includes(q));

              }).length === 0 &&
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                  Aucun équipement trouvé
                </div>
              }
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignEquipmentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 7. EDIT EQUIPMENT MODAL --- */}
      <Modal
        isOpen={isEditEquipmentModalOpen}
        onClose={() => setIsEditEquipmentModalOpen(false)}
        title="Modifier l'équipement"
        size="lg">
        
        {equipmentToEdit ?
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
                  <select
                  defaultValue={equipmentToEdit.type}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow">
                  
                    <option>FMB120</option>
                    <option>FMC130</option>
                    <option>FMB920</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Numéro de série (IMEI)
                  </label>
                  <input
                  type="text"
                  defaultValue={equipmentToEdit.serial}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Statut installation
                  </label>
                  <select
                  defaultValue={
                  equipmentToEdit.isInstalled ? 'true' : 'false'
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
                  defaultValue={equipmentToEdit.simCallNumber}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    N° de série puce (ICCID)
                  </label>
                  <input
                  type="text"
                  defaultValue={equipmentToEdit.iccid}
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
                  defaultValue={equipmentToEdit.server}
                  placeholder="Ex: Srv-Paris-1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Port
                  </label>
                  <input
                  type="text"
                  defaultValue={equipmentToEdit.port}
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
                  defaultValue={equipmentToEdit.firstSendDate}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Date contractuelle adoptée
                  </label>
                  <input
                  type="date"
                  defaultValue={equipmentToEdit.contractDate}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
                
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
              type="button"
              onClick={() => setIsEditEquipmentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
                Annuler
              </button>
              <button
              type="button"
              onClick={() => setIsEditEquipmentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              
                Enregistrer
              </button>
            </div>
          </form> :

        <div className="py-8 text-center text-slate-500 text-sm">
            Aucun équipement associé à ce véhicule. Veuillez d'abord affecter un
            équipement.
          </div>
        }
      </Modal>

      {/* --- 8. INSTALL EQUIPMENT MODAL --- */}
      <Modal
        isOpen={isInstallEquipmentModalOpen}
        onClose={() => setIsInstallEquipmentModalOpen(false)}
        title={`Installer l'équipement - ${vehicleToInstall?.equipment}`}
        size="md">
        
        <form onSubmit={handleInstallEquipment} className="space-y-4">
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <Download className="shrink-0 mt-0.5" size={16} />
            <p>
              Saisissez l'immatriculation du véhicule pour confirmer
              l'installation de l'équipement{' '}
              <strong>{vehicleToInstall?.equipment}</strong>.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Immatriculation du véhicule
            </label>
            <InstallPlateSelect
              value={installPlate}
              onChange={setInstallPlate}
              plates={clientVehicles.map((v) => v.plate)} />
            
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInstallEquipmentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              type="submit"
              disabled={!installPlate.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              
              <CheckCircle2 size={14} />
              Confirmer l'installation
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 9. VIEW EQUIPMENT DETAILS MODAL --- */}
      <Modal
        isOpen={isViewEquipmentModalOpen}
        onClose={() => setIsViewEquipmentModalOpen(false)}
        title="Détails de l'équipement"
        size="lg">
        
        {equipmentToView ?
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {equipmentToView.serial}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {equipmentToView.type}
                  </p>
                </div>
              </div>
              <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${equipmentToView.isInstalled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              
                {equipmentToView.isInstalled ?
              <CheckCircle2 size={14} /> :

              <XCircle size={14} />
              }
                {equipmentToView.isInstalled ? 'Installé' : 'Non installé'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                  <Hash size={14} /> N° de série
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.serial}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                  <Cpu size={14} /> Type
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.type}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                  <Wifi size={14} /> N° d'appel puce
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.simCallNumber || '-'}
                </div>
              </div>
              <div>
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
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.server || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                  <Hash size={14} /> Port
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.port || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                  <Calendar size={14} /> Date premier envoi
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.firstSendDate ?
                new Date(
                  equipmentToView.firstSendDate
                ).toLocaleDateString('fr-FR') :
                '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                  <Calendar size={14} /> Date contractuelle
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {equipmentToView.contractDate ?
                new Date(equipmentToView.contractDate).toLocaleDateString(
                  'fr-FR'
                ) :
                '-'}
                </div>
              </div>
            </div>

            {showPositionMap &&
          <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden h-[250px] relative z-0">
                <MapContainer
              center={[
              equipmentToView.lastPosition?.latitude ?? 48.8566,
              equipmentToView.lastPosition?.longitude ?? 2.3522]
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
                equipmentToView.lastPosition?.latitude ?? 48.8566,
                equipmentToView.lastPosition?.longitude ?? 2.3522]
                }
                icon={customMarkerIcon}>
                
                    <Popup>
                      <div className="text-xs leading-relaxed">
                        <strong>Dernière position:</strong>
                        <br />
                        Date Local={equipmentToView.lastPosition?.dateLocal}
                        <br />
                        Vitesse= {equipmentToView.lastPosition?.vitesse}km/h
                        <br />
                        État={' '}
                        <span
                      style={{
                        color:
                        equipmentToView.lastPosition?.etat === 'Connectée' ?
                        '#16a34a' :
                        '#dc2626'
                      }}>
                      
                          {equipmentToView.lastPosition?.etat}
                        </span>
                        <br />
                        Niveau de carburant=
                        {equipmentToView.lastPosition?.niveauCarburant}%<br />
                        Total de carburant=
                        {equipmentToView.lastPosition?.totalCarburant}
                        <br />
                        RPM={equipmentToView.lastPosition?.rpm}
                        <br />
                        Température Moteur=
                        {equipmentToView.lastPosition?.temperatureMoteur}°C
                        <br />
                        Kilométrage={equipmentToView.lastPosition?.kilometrage}
                        km
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
          }

            {/* Position Details Info */}
            {showPositionMap && equipmentToView.lastPosition &&
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
                      {equipmentToView.lastPosition.dateLocal}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <MapPin size={12} /> Latitude
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.latitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <MapPin size={12} /> Longitude
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.longitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Gauge size={12} /> Vitesse
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.vitesse} km/h
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Activity size={12} /> État
                    </div>
                    <div
                  className={`text-sm font-semibold flex items-center gap-1.5 ${equipmentToView.lastPosition.etat === 'Connectée' ? 'text-emerald-600' : 'text-red-600'}`}>
                  
                      <span
                    className={`w-2 h-2 rounded-full ${equipmentToView.lastPosition.etat === 'Connectée' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  </span>
                      {equipmentToView.lastPosition.etat}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Fuel size={12} /> Niveau de carburant
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.niveauCarburant}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Fuel size={12} /> Total de carburant
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.totalCarburant}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Activity size={12} /> RPM
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.rpm}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Thermometer size={12} /> Température Moteur
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.temperatureMoteur}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center gap-1">
                      <Navigation size={12} /> Kilométrage
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {equipmentToView.lastPosition.kilometrage.toLocaleString(
                    'fr-FR'
                  )}{' '}
                      km
                    </div>
                  </div>
                </div>
              </div>
          }

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
              onClick={() => setShowPositionMap(!showPositionMap)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${showPositionMap ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
              
                <MapPin size={16} />
                {showPositionMap ? 'Masquer la position' : 'Voir position'}
              </button>
              <button
              onClick={() => setIsViewEquipmentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
                Fermer
              </button>
            </div>
          </div> :

        <div className="py-8 text-center text-slate-500 text-sm">
            Aucun équipement associé à ce véhicule.
          </div>
        }
      </Modal>

      {/* --- 10. CONFIGURATION MODAL --- */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Configuration: ${vehicleToConfig?.equipment}`}
        size="lg">
        
        <div className="space-y-4">
          {/* Voltage Section */}
          <fieldset className="border border-slate-200 rounded-md p-3">
            <legend className="text-sm font-medium text-slate-700 px-1">
              Voltage(en Volt):
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-sm text-slate-600 w-48">
                  Voltage du reservoir plein:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.0"
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-sm text-slate-600 w-48">
                  Voltage du reservoir vide:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.0"
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-sm text-slate-600 w-48">
                  Voltage du température max:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.0"
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-sm text-slate-600 w-48">
                  Voltage du température min:
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="-0.2"
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                
              </div>
            </div>
          </fieldset>

          {/* Log Section */}
          <fieldset className="border border-slate-200 rounded-md p-3">
            <legend className="text-sm font-medium text-slate-700 px-1">
              Activation/désactivation de log:
            </legend>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configLog"
                  checked={configLog === 'activer'}
                  onChange={() => setConfigLog('activer')}
                  className="text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-slate-700">Activer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configLog"
                  checked={configLog === 'desactiver'}
                  onChange={() => setConfigLog('desactiver')}
                  className="text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-slate-700">Désactiver</span>
              </label>
            </div>
          </fieldset>

          {/* Options Section */}
          <fieldset className="border border-slate-200 rounded-md p-3">
            <legend className="text-sm font-medium text-slate-700 px-1">
              Activation/désactivation des options:
            </legend>
            <div className="mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configIButton}
                  onChange={(e) => setConfigIButton(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500 rounded-sm" />
                
                <span className="text-sm text-slate-700">
                  iButton ou interface conducteur est installée
                </span>
              </label>
            </div>
          </fieldset>

          {/* AAD Section */}
          <fieldset className="border border-slate-200 rounded-md p-3">
            <legend className="text-sm font-medium text-slate-700 px-1">
              Configuration de AAD:
            </legend>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configAAD"
                  checked={configAAD === 'courant'}
                  onChange={() => setConfigAAD('courant')}
                  className="text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-slate-700">
                  AAD est installé sur courant
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configAAD"
                  checked={configAAD === 'pompe'}
                  onChange={() => setConfigAAD('pompe')}
                  className="text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-slate-700">
                  AAD est installé sur pompe à essence
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="configAAD"
                  checked={configAAD === 'demarreur'}
                  onChange={() => setConfigAAD('demarreur')}
                  className="text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-slate-700">
                  AAD est installé sur démarreur
                </span>
              </label>
            </div>
          </fieldset>

          {/* Stats Section */}
          <fieldset className="border border-slate-200 rounded-md p-3">
            <legend className="text-sm font-medium text-slate-700 px-1">
              Activation/désactivation le calcul de statistique de consommation
              de carburant:
            </legend>
            <div className="mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configCalcStat}
                  onChange={(e) => setConfigCalcStat(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500 rounded-sm" />
                
                <span className="text-sm text-slate-700">
                  Calculer la statistique de consommation de carburant
                </span>
              </label>
            </div>
          </fieldset>

          {/* Duplication Section */}
          <fieldset className="border border-slate-200 rounded-md p-3">
            <legend className="text-sm font-medium text-slate-700 px-1">
              Les positions sont dupliqués avec le N° serie:
            </legend>
            <div className="flex flex-col gap-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configDupPos}
                  onChange={(e) => setConfigDupPos(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500 rounded-sm" />
                
                <span className="text-sm text-slate-700">
                  Activer la modification
                </span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-700">N° de série:</label>
                <input
                  type="text"
                  value={configDupSerial}
                  onChange={(e) => setConfigDupSerial(e.target.value)}
                  disabled={!configDupPos}
                  className="w-48 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400" />
                
              </div>
            </div>
          </fieldset>

          <div className="pt-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 transition-colors">
              Supprimer la dernière information de cet équipement
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>);

}