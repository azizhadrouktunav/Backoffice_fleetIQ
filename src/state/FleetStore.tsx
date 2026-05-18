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

export type SimOffer = {
  id: number;
  name: string;
  description: string;
  pricePerSim: number;
  /** Opérateur téléphonique de l'offre (Télécom, Orange, Ooredoo, ...) */
  operator: string;
};

export type SimCard = {
  id: number;
  offerId: number | null;
  /** Numéro de la puce (MSISDN). Optionnel. */
  phoneNumber: string;
  /** Numéro CCID/ICCID. Obligatoire. */
  iccid: string;
  /** Client propriétaire. "<Reseller>_Stock" si la puce est en stock. */
  client: string;
  /** Revendeur rattaché (ou "Tunav" pour le stock Tunav). */
  reseller: string;
  /** Identifiant de l’équipement auquel la puce est affectée, le cas échéant. */
  equipmentId?: number;
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
    reseller: 'Tunav',
    email: 'contact@texpress.fr',
    tel: '+33 1 23 45 67 89',
    expiry: '2026-12-31',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 50
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
    abonnement: 'FleetIQ Secure',
    vehicleLimit: -1
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
    abonnement: 'FleetIQ Mechanics',
    vehicleLimit: 20
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
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 40
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
    abonnement: 'FleetIQ Mechanic',
    vehicleLimit: 25
  },
  {
    id: 9,
    name: 'Transit Maroc',
    type: 'Simple',
    reseller: 'MyCom',
    email: 'ops@transit-ma.ma',
    tel: '+212 5 22 33 44 55',
    expiry: '2026-03-15',
    status: 'Active',
    abonnement: 'FleetIQ Secure',
    vehicleLimit: 35
  },
  {
    id: 11,
    name: 'Logistique Sud',
    type: 'Simple',
    reseller: 'MyCom',
    email: 'contact@logistique-sud.tn',
    tel: '+216 74 12 34 56',
    expiry: '2026-11-30',
    status: 'Active',
    abonnement: 'FleetIQ Pro',
    vehicleLimit: 20
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
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+33612345678',
    simCallNumber: '0612345678',
    iccid: '89330123456789012345',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'Transport Express',
    reseller: 'Tunav',
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
    equipmentType: 'ET6',
    packId: 2,
    type: 'FMC130',
    sim: '+33687654321',
    simCallNumber: '0687654321',
    iccid: '89330987654321098765',
    server: 'Srv-Paris-1',
    port: '5027',
    client: 'MyCom',
    reseller: 'MyCom',
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
    serial: 'EQ-2025-101',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+21620101010',
    simCallNumber: '020101010',
    iccid: '89330216000000000001',
    server: 'Srv-Tunis-1',
    port: '5027',
    client: 'Société Médicale ABC',
    reseller: 'Tunav',
    car: 'TN-1234-A',
    isInstalled: true,
    firstSendDate: '2025-03-01',
    contractDate: '2025-01-15',
    lastPosition: null
  },
  {
    id: 4,
    serial: 'EQ-2025-102',
    equipmentType: 'ET6',
    packId: 1,
    type: 'FMC130',
    sim: '+21620101011',
    simCallNumber: '020101011',
    iccid: '89330216000000000002',
    server: 'Srv-Tunis-1',
    port: '5027',
    client: 'Société Médicale ABC',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2025-04-10',
    contractDate: '2025-01-15',
    lastPosition: null
  },
  {
    id: 5,
    serial: 'EQ-2025-201',
    equipmentType: 'ET8',
    packId: 2,
    type: 'FMB920',
    sim: '+21670987654',
    simCallNumber: '070987654',
    iccid: '89330216000000000003',
    server: 'Srv-Tunis-1',
    port: '5028',
    client: 'Transport Urbain Tunis',
    reseller: 'Tunav',
    car: 'TU-100-AA',
    isInstalled: true,
    firstSendDate: '2025-06-01',
    contractDate: '2025-05-01',
    lastPosition: null
  },
  {
    id: 6,
    serial: 'EQ-2025-202',
    equipmentType: 'ETX',
    packId: 2,
    type: 'FMB120',
    sim: '+21670987655',
    simCallNumber: '070987655',
    iccid: '89330216000000000004',
    server: 'Srv-Tunis-1',
    port: '5028',
    client: 'Transport Urbain Tunis',
    reseller: 'Tunav',
    car: 'TU-200-BB',
    isInstalled: true,
    firstSendDate: '2025-06-15',
    contractDate: '2025-05-01',
    lastPosition: null
  },
  {
    id: 7,
    serial: 'EQ-2025-203',
    equipmentType: 'ET6',
    packId: 2,
    type: 'FMC130',
    sim: '+21670987656',
    simCallNumber: '070987656',
    iccid: '89330216000000000005',
    server: 'Srv-Tunis-1',
    port: '5028',
    client: 'Transport Urbain Tunis',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2025-07-01',
    contractDate: '2025-05-01',
    lastPosition: null
  },
  {
    id: 8,
    serial: 'EQ-2026-301',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+21671554433',
    simCallNumber: '071554433',
    iccid: '89330216000000000006',
    server: 'Srv-Tunis-2',
    port: '5027',
    client: 'Fret International',
    reseller: 'Tunav',
    car: 'FI-500-CC',
    isInstalled: true,
    firstSendDate: '2026-01-20',
    contractDate: '2026-01-01',
    lastPosition: null
  },
  {
    id: 9,
    serial: 'EQ-2026-302',
    equipmentType: 'ET6',
    packId: 3,
    type: 'FMC130',
    sim: '+21671554434',
    simCallNumber: '071554434',
    iccid: '89330216000000000007',
    server: 'Srv-Tunis-2',
    port: '5027',
    client: 'Fret International',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-02-01',
    contractDate: '2026-01-01',
    lastPosition: null
  },
  {
    id: 10,
    serial: 'EQ-2026-401',
    equipmentType: 'ETX',
    packId: 2,
    type: 'FMB920',
    sim: '+21252233445',
    simCallNumber: '052233445',
    iccid: '89330212000000000001',
    server: 'Srv-Casa-1',
    port: '5029',
    client: 'Transit Maroc',
    reseller: 'Tunav',
    car: 'MA-7890-D',
    isInstalled: true,
    firstSendDate: '2026-02-15',
    contractDate: '2026-02-01',
    lastPosition: null
  },
  {
    id: 11,
    serial: 'EQ-2026-501',
    equipmentType: 'ET8',
    packId: 4,
    type: 'FMC130',
    sim: '+33698765432',
    simCallNumber: '0698765432',
    iccid: '89330198765432109876',
    server: 'Srv-Paris-2',
    port: '5027',
    client: 'MyCom',
    reseller: 'MyCom',
    car: 'GL-001-EF',
    isInstalled: true,
    firstSendDate: '2026-03-01',
    contractDate: '2026-01-01',
    lastPosition: null
  },
  {
    id: 12,
    serial: 'EQ-2026-502',
    equipmentType: 'ET6',
    packId: 4,
    type: 'FMB120',
    sim: '',
    simCallNumber: '',
    iccid: '',
    server: 'Srv-Paris-2',
    port: '5027',
    client: 'MyCom_Stock',
    reseller: 'MyCom',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2026-03-10',
    contractDate: '2026-03-10',
    lastPosition: null
  },
  {
    id: 13,
    serial: 'EQ-2026-601',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB120',
    sim: '+21674123456',
    simCallNumber: '074123456',
    iccid: '89330216000000000008',
    server: 'Srv-Tunis-1',
    port: '5027',
    client: 'Logistique Sud',
    reseller: 'MyCom',
    car: 'LS-300-GG',
    isInstalled: true,
    firstSendDate: '2026-04-01',
    contractDate: '2026-03-15',
    lastPosition: null
  },
  {
    id: 14,
    serial: 'EQ-2024-003',
    equipmentType: 'ETX',
    packId: 1,
    type: 'FMB920',
    sim: '+33611223344',
    simCallNumber: '061122334',
    iccid: '89330111223344556677',
    server: 'Srv-Lyon-1',
    port: '5028',
    client: 'Transport Express',
    reseller: 'Tunav',
    car: 'Unassigned',
    isInstalled: false,
    firstSendDate: '2024-06-01',
    contractDate: '2024-06-01',
    lastPosition: null
  },
  {
    id: 15,
    serial: 'EQ-2026-701',
    equipmentType: 'ET6',
    packId: 3,
    type: 'FMC130',
    sim: '+33620112233',
    simCallNumber: '062011223',
    iccid: '89330201000000000001',
    server: 'Srv-Lille-1',
    port: '5030',
    client: 'Distribution Nord',
    reseller: 'Tunav',
    car: 'DN-450-HH',
    isInstalled: false,
    firstSendDate: '2026-01-05',
    contractDate: '2026-01-01',
    lastPosition: null
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
  simOffers: SimOffer[];
  setSimOffers: React.Dispatch<React.SetStateAction<SimOffer[]>>;
  simCards: SimCard[];
  setSimCards: React.Dispatch<React.SetStateAction<SimCard[]>>;
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

  const [simOffers, setSimOffers] = useState<SimOffer[]>(() => [
    {
      id: 1,
      name: 'Data 1 Go - Orange',
      description: 'Offre data légère pour télémétrie - 1 Go inclus / mois.',
      pricePerSim: 12,
      operator: 'Orange'
    },
    {
      id: 2,
      name: 'Data 5 Go + SMS - Télécom',
      description: 'Offre standard avec data et SMS pour alertes - 5 Go / mois.',
      pricePerSim: 25,
      operator: 'Télécom'
    },
    {
      id: 3,
      name: 'M2M Premium - Ooredoo',
      description: 'Offre M2M premium avec data illimitée.',
      pricePerSim: 40,
      operator: 'Ooredoo'
    }
  ]);

  const [simCards, setSimCards] = useState<SimCard[]>(() => [
    {
      id: 1,
      offerId: 2,
      phoneNumber: '+216 71 12 34 56',
      iccid: '89330123456789012345',
      client: 'Transport Express',
      reseller: 'Tunav',
      equipmentId: 1
    },
    {
      id: 2,
      offerId: 1,
      phoneNumber: '+216 71 65 43 21',
      iccid: '89330987654321098765',
      client: 'MyCom',
      reseller: 'MyCom',
      equipmentId: 2
    },
    {
      id: 3,
      offerId: 3,
      phoneNumber: '+216 71 11 22 33',
      iccid: '89216001100110011001',
      client: 'Société Médicale ABC',
      reseller: 'Tunav'
    },
    {
      id: 4,
      offerId: 1,
      phoneNumber: '+216 71 00 00 01',
      iccid: '89330000000000000001',
      client: 'Tunav_Stock',
      reseller: 'Tunav'
    },
    {
      id: 5,
      offerId: 2,
      phoneNumber: '',
      iccid: '89330000000000000099',
      client: 'Tunav_Stock',
      reseller: 'Tunav'
    },
    {
      id: 6,
      offerId: 3,
      phoneNumber: '+216 71 11 11 22',
      iccid: '89216002200220022002',
      client: 'MyCom_Stock',
      reseller: 'MyCom'
    }
  ]);

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
      setEquipments,
      simOffers,
      setSimOffers,
      simCards,
      setSimCards
    }),
    [currentUserRole, currentUserName, packs, clients, equipments, simOffers, simCards]
  );

  return <FleetStoreContext.Provider value={value}>{children}</FleetStoreContext.Provider>;
}

export function useFleetStore(): FleetStore {
  const ctx = useContext(FleetStoreContext);
  if (!ctx) throw new Error('useFleetStore must be used within FleetStoreProvider');
  return ctx;
}

