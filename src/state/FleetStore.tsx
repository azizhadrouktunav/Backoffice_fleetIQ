import React, { createContext, useContext, useMemo, useState } from 'react';

export type EquipmentType =
  | 'ETX'
  | 'MiniTrace'
  | 'MedWatch'
  | 'ETBLE'
  | 'ET8'
  | 'ET6'
  | 'EasyCAN'
  | 'ET8+CAN'
  | 'ET6+CAN'
  | 'Dashcam';

export type Pack = {
  id: number;
  name: 'FleetIQ Secure' | 'FleetIQ Pro' | 'FleetIQ Mechanic' | 'FleetIQ Vision';
  description: string;
  color: 'blue' | 'indigo' | 'amber' | 'emerald' | 'slate';
  vehicleLimit: number;
  supportedEquipments: EquipmentType[];
  features: string[];
};

export type ClientPackAssignment = {
  packId: number;
  vehicleLimit: number;
  equipmentLimits: Partial<Record<EquipmentType, number>>;
  customFeatures?: string[];
};

export type FleetClient = {
  id: number;
  name: string;
  type: 'Simple' | 'Revendeur';
  reseller: string;
  email: string;
  tel: string;
  expiry: string;
  status: 'Active' | 'Blocked';
  /**
   * Quota véhicules défini dans "Gestion Clients".
   * null = illimité (pas d’icône quotas + pas de limite d’installation)
   */
  vehicleLimit: number | null;
  packs: ClientPackAssignment[];
};

export type FleetEquipment = {
  id: number;
  serial: string;
  /** Type d’équipement métier (ETX, MiniTrace, ...) */
  equipmentType?: EquipmentType;
  /** Support bus CAN */
  supportsCan?: boolean;
  /** Pack affecté à l’équipement (1 équipement = 1 pack) */
  packId?: number;
  type: string;
  sim: string;
  simCallNumber: string;
  iccid: string;
  server: string;
  port: string;
  client: string;
  reseller: string;
  car: string;
  isInstalled: boolean;
  firstSendDate: string;
  contractDate: string;
  lastPosition: any;
};

const initialPacks: Pack[] = [
  {
    id: 1,
    name: 'FleetIQ Pro',
    description: 'Pack standard avec suivi et rapports essentiels.',
    color: 'indigo',
    vehicleLimit: 50,
    supportedEquipments: ['ETX', 'ET6', 'ET8'],
    features: [
      'suivie:flotte:tri_dynamique',
      'suivie:flotte:visualisation_cartographique',
      'trajet:trajectoire:trace_itineraire',
      'rapport:suivi_vehicules:detaille:consult'
    ]
  },
  {
    id: 2,
    name: 'FleetIQ Secure',
    description: 'Pack orienté sécurité et alertes.',
    color: 'blue',
    vehicleLimit: 30,
    supportedEquipments: ['ETX', 'ETBLE', 'Dashcam'],
    features: [
      'alerte:securite_actifs:remorquage',
      'alerte:conducteur_urgences:sos',
      'alerte:geofencing:entree_sortie_zone',
      'alerte:parametrage:destinataires'
    ]
  },
  {
    id: 3,
    name: 'FleetIQ Mechanic',
    description: 'Pack orienté maintenance et parc.',
    color: 'amber',
    vehicleLimit: 40,
    supportedEquipments: ['ET6', 'ET8', 'EasyCAN'],
    features: [
      'parc:vehicules:read_update',
      'parc:vehicules:count',
      'alerte:etat_mecanique:dtc',
      'alerte:etat_mecanique:pression_pneus'
    ]
  },
  {
    id: 4,
    name: 'FleetIQ Vision',
    description: 'Pack premium avec dashboard exécutif.',
    color: 'emerald',
    vehicleLimit: 100,
    supportedEquipments: ['ET8+CAN', 'ET6+CAN', 'EasyCAN'],
    features: ['dashboard:executif:kpis', 'dashboard:executif:tendance', 'dashboard:etat_parc:flux_alertes']
  }
];

function packIdByName(abonnement?: string): number | null {
  switch (abonnement) {
    case 'FleetIQ Pro':
      return 1;
    case 'FleetIQ Secure':
      return 2;
    case 'FleetIQ Mechanics':
    case 'FleetIQ Mechanic':
      return 3;
    case 'FleetIQ Vision':
      return 4;
    default:
      return null;
  }
}

function makeAssignment(packId: number, packsById: Map<number, Pack>): ClientPackAssignment {
  const p = packsById.get(packId);
  const supported = p?.supportedEquipments ?? [];
  return {
    packId,
    vehicleLimit: p?.vehicleLimit ?? 0,
    equipmentLimits: supported.reduce<Partial<Record<EquipmentType, number>>>((acc, t) => {
      acc[t] = 0;
      return acc;
    }, {})
  };
}

// Seed clients from previous mock (Gestion Clients)
const initialClientsSeed: Array<{
  id: number;
  name: string;
  type: 'Simple' | 'Revendeur';
  reseller: string;
  email: string;
  tel: string;
  expiry: string;
  status: 'Active' | 'Blocked';
  abonnement?: string;
  vehicleLimit: number; // -1 = illimité
}> = [
  {
    id: 0,
    name: 'Tunav',
    type: 'Revendeur',
    reseller: 'Tunav',
    email: 'admin@tunav.local',
    tel: '+33 0 00 00 00 00',
    expiry: '2030-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Vision',
    vehicleLimit: -1
  },
  {
    id: 1,
    name: 'Transport Express',
    type: 'Simple',
    reseller: 'Auto Fleet Pro',
    email: 'contact@texpress.fr',
    tel: '+33 1 23 45 67 89',
    expiry: '2025-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 50
  },
  {
    id: 2,
    name: 'Global Logistics',
    type: 'Revendeur',
    reseller: 'Tunav',
    email: 'admin@glogistics.com',
    tel: '+33 4 56 78 90 12',
    expiry: '2026-06-30',
    status: 'Active',
    abonnement: 'FleetIQ Secure',
    vehicleLimit: -1
  },
  {
    id: 3,
    name: 'Livraison Rapide',
    type: 'Simple',
    reseller: 'Global Logistics',
    email: 'hello@lrapide.fr',
    tel: '+33 6 12 34 56 78',
    expiry: '2024-10-15',
    status: 'Blocked',
    abonnement: 'FleetIQ Mechanics',
    vehicleLimit: 20
  },
  {
    id: 4,
    name: 'Auto Fleet Pro',
    type: 'Revendeur',
    reseller: 'Tunav',
    email: 'contact@autofleet.pro',
    tel: '+33 9 87 65 43 21',
    expiry: '2025-01-01',
    status: 'Active',
    abonnement: 'FleetIQ Vision',
    vehicleLimit: -1
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
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 30
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
    abonnement: 'FleetIQ Secure',
    vehicleLimit: 50
  }
];

const initialEquipments: FleetEquipment[] = [
  // --- Stock Tunav (non affecté) ---
  {
    id: 1001,
    serial: 'STK-2026-001',
    type: 'FMC130',
    sim: '+33600000001',
    simCallNumber: '0600000001',
    iccid: '89330000000000000001',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'Tunav_Stock',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-01-10',
    contractDate: '2026-01-10',
    lastPosition: null
  },
  {
    id: 1002,
    serial: 'STK-2026-002',
    type: 'FMB120',
    sim: '+33600000002',
    simCallNumber: '0600000002',
    iccid: '89330000000000000002',
    server: 'Srv-Lyon-1',
    port: '5028',
    client: 'Tunav_Stock',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-01-12',
    contractDate: '2026-01-12',
    lastPosition: null
  },
  {
    id: 1003,
    serial: 'STK-2026-003',
    type: 'FMB920',
    sim: '+33600000003',
    simCallNumber: '0600000003',
    iccid: '89330000000000000003',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'Tunav_Stock',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-01-15',
    contractDate: '2026-01-15',
    lastPosition: null
  },
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
  }
];

type FleetStore = {
  currentUserRole: 'Tunav' | 'Revendeur';
  setCurrentUserRole: React.Dispatch<React.SetStateAction<'Tunav' | 'Revendeur'>>;
  currentUserName: string; // "Tunav" ou nom revendeur
  setCurrentUserName: React.Dispatch<React.SetStateAction<string>>;
  packs: Pack[];
  clients: FleetClient[];
  setClients: React.Dispatch<React.SetStateAction<FleetClient[]>>;
  equipments: FleetEquipment[];
  setEquipments: React.Dispatch<React.SetStateAction<FleetEquipment[]>>;
};

const FleetStoreContext = createContext<FleetStore | null>(null);

export function FleetStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useState<'Tunav' | 'Revendeur'>(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('fleet_role') : null;
    return raw === 'Revendeur' ? 'Revendeur' : 'Tunav';
  });
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('fleet_user') : null;
    return raw && raw.trim() ? raw : 'Tunav';
  });

  // Persist for easy demo/testing
  React.useEffect(() => {
    try {
      window.localStorage.setItem('fleet_role', currentUserRole);
      window.localStorage.setItem('fleet_user', currentUserName);
    } catch {
      // ignore
    }
  }, [currentUserRole, currentUserName]);

  const packs = useMemo(() => initialPacks, []);
  const packsById = useMemo(() => new Map(packs.map((p) => [p.id, p])), [packs]);

  const [clients, setClients] = useState<FleetClient[]>(() => {
    const base = initialClientsSeed.map((c) => {
      const packId = packIdByName(c.abonnement);
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        reseller: c.reseller,
        email: c.email,
        tel: c.tel,
        expiry: c.expiry,
        status: c.status,
        vehicleLimit: c.vehicleLimit < 0 ? null : c.vehicleLimit,
        packs: packId ? [makeAssignment(packId, packsById)] : []
      } satisfies FleetClient;
    });

    const stockClients: FleetClient[] = base
      .filter((c) => c.type === 'Revendeur')
      .map((r) => {
        const name = `${r.name}_Stock`;
        return {
          id: 10000 + r.id,
          name,
          type: 'Simple',
          reseller: r.name,
          email: '-',
          tel: '-',
          expiry: '2030-12-31',
          status: 'Active',
          vehicleLimit: null,
          packs: []
        };
      });

    const tunavStock: FleetClient = {
      id: 9999,
      name: 'Tunav_Stock',
      type: 'Simple',
      reseller: 'Tunav',
      email: '-',
      tel: '-',
      expiry: '2030-12-31',
      status: 'Active',
      vehicleLimit: null,
      packs: []
    };

    return [tunavStock, ...stockClients, ...base];
  });

  const [equipments, setEquipments] = useState<FleetEquipment[]>(initialEquipments);

  const value = useMemo<FleetStore>(
    () => ({
      currentUserRole,
      setCurrentUserRole,
      currentUserName,
      setCurrentUserName,
      packs,
      clients,
      setClients,
      equipments,
      setEquipments
    }),
    [currentUserRole, currentUserName, packs, clients, equipments]
  );

  return <FleetStoreContext.Provider value={value}>{children}</FleetStoreContext.Provider>;
}

export function useFleetStore(): FleetStore {
  const ctx = useContext(FleetStoreContext);
  if (!ctx) throw new Error('useFleetStore must be used within FleetStoreProvider');
  return ctx;
}

