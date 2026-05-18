import React, { useMemo, useState } from 'react';
import {
  Search,
  Edit2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Package,
  XCircle,
  ChevronDown,
  ChevronRight,
  Check,
  ListChecks,
  ShieldCheck,
  CreditCard,
  Ban,
  Settings
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { useFleetStore } from '../state/FleetStore';

type FeatureNode = {
  id: string;
  label: string;
  children?: FeatureNode[];
};

type Pack = {
  id: number;
  name: string;
  description: string;
  color: 'blue' | 'indigo' | 'amber' | 'emerald' | 'slate';
  vehicleLimit: number; // quota véhicules par défaut
  supportedEquipments: EquipmentType[]; // types d’équipements supportés par le pack (quota défini à l’affectation)
  features: string[]; // leaf feature ids (fonctionnalités générales)
  isActive: boolean;
};

type EquipmentType =
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

type ClientPackAssignment = {
  packId: number;
  vehicleLimit: number;
  equipmentLimits: Partial<Record<EquipmentType, number>>;
  customFeatures?: string[]; // si défini, ce pack devient “personnalisé” pour ce client
};

type ClientWithPack = {
  id: number;
  name: string;
  type: string;
  email: string;
  tel: string;
  expiry: string;
  status: 'Active' | 'Blocked';
  vehicleLimit: number | null; // null = illimité (pas d’icône quotas)
  packs: ClientPackAssignment[];
};

const COLOR_STYLES: Record<Pack['color'], { badge: string; ring: string }> = {
  blue: { badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' },
  indigo: { badge: 'bg-indigo-100 text-indigo-700', ring: 'ring-indigo-500' },
  amber: { badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-500' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-500' },
  slate: { badge: 'bg-slate-100 text-slate-700', ring: 'ring-slate-500' }
};

// Fonctionnalités (catalogue) – structuré par grands modules.
// Note: chaque "feuille" représente une fonctionnalité assignable à un pack.
const FEATURE_CATALOG: FeatureNode[] = [
  {
    id: 'module:suivie',
    label: 'Suivie',
    children: [
      {
        id: 'suivie:flotte',
        label: 'Suivi > Flotte',
        children: [
          { id: 'suivie:flotte:tri_dynamique', label: 'Tri dynamique des véhicules' },
          { id: 'suivie:flotte:visualisation_cartographique', label: 'Visualisation cartographique et centrage' },
          { id: 'suivie:flotte:indicateurs_maintenance', label: 'Indicateurs de maintenance' }
        ]
      },
      {
        id: 'suivie:citerne',
        label: 'Suivi > Citerne',
        children: [{ id: 'suivie:citerne:visualisation_donnees', label: 'Visualisation des données citerne' }]
      },
      {
        id: 'suivie:ui_temps_reel',
        label: 'Suivi > UI Temps réel',
        children: [{ id: 'suivie:ui_temps_reel:fenetre', label: 'Fenêtre de suivi en temps réel' }]
      },
      {
        id: 'trajet',
        label: 'Trajet',
        children: [
          {
            id: 'trajet:trajectoire',
            label: 'Trajet > Trajectoire',
            children: [{ id: 'trajet:trajectoire:trace_itineraire', label: "Tracé d'itinéraire directionnel" }]
          },
          {
            id: 'trajet:stop_circulation',
            label: 'Trajet > Stop circulation',
            children: [{ id: 'trajet:stop_circulation:bascule', label: 'Bascule Arrêt/Circulation' }]
          }
        ]
      },
      {
        id: 'cmd_distance',
        label: 'Gestion des Cmd à distance',
        children: [
          {
            id: 'cmd_distance:suivi',
            label: 'Suivi des cmd envoyés',
            children: [{ id: 'cmd_distance:suivi:etat', label: "Suivi d'état des cmd" }]
          }
        ]
      },
      {
        id: 'menu_click_droit',
        label: 'Menu click droit',
        children: [
          { id: 'menu_click_droit:shortcuts', label: 'Shortcuts click droit' },
          { id: 'menu_click_droit:menu', label: 'Menu click droit' }
        ]
      }
    ]
  },
  {
    id: 'module:parc',
    label: 'Parc',
    children: [
      {
        id: 'parc:chauffeurs',
        label: 'Exploitation du parc > Gestion des Chauffeurs',
        children: [
          { id: 'parc:chauffeurs:create', label: 'Créer un chauffeur' },
          { id: 'parc:chauffeurs:read_update', label: 'Consulter et modifier un chauffeur' },
          { id: 'parc:chauffeurs:delete', label: 'Supprimer un chauffeur' },
          { id: 'parc:chauffeurs:count', label: 'Afficher le nombre total des chauffeurs' },
          { id: 'parc:chauffeurs:export', label: 'Exporter la liste des chauffeurs' }
        ]
      },
      {
        id: 'parc:clients',
        label: 'Exploitation du parc > Gestion des Clients',
        children: [
          { id: 'parc:clients:create', label: 'Créer un client' },
          { id: 'parc:clients:read_update', label: 'Consulter et modifier un client' },
          { id: 'parc:clients:delete', label: 'Supprimer un client' },
          { id: 'parc:clients:count', label: 'Afficher le nombre total des clients' },
          { id: 'parc:clients:export', label: 'Exporter la liste des clients' }
        ]
      },
      {
        id: 'parc:vehicules',
        label: 'Gestion des Véhicules',
        children: [
          { id: 'parc:vehicules:create', label: 'Créer un véhicule' },
          { id: 'parc:vehicules:read_update', label: 'Consulter et modifier un véhicule' },
          { id: 'parc:vehicules:delete', label: 'Supprimer un véhicule' },
          { id: 'parc:vehicules:count', label: 'Afficher le nombre total des véhicules' },
          { id: 'parc:vehicules:export', label: 'Exporter la liste des véhicules' }
        ]
      }
    ]
  },
  {
    id: 'module:alerte',
    label: 'Alerte',
    children: [
      {
        id: 'alerte:securite_actifs',
        label: 'Sécurité & Protection des Actifs',
        children: [
          { id: 'alerte:securite_actifs:remorquage', label: 'Remoquage' },
          { id: 'alerte:securite_actifs:batterie_gps', label: 'Batterie gps faible/débranché' },
          { id: 'alerte:securite_actifs:alarme_actif', label: "Systéme d'alarme actif" },
          { id: 'alerte:securite_actifs:porte_arriere', label: 'Etat porte arriére (camion)' },
          { id: 'alerte:securite_actifs:gnss_lost', label: 'GNSS signal Lost' }
        ]
      },
      {
        id: 'alerte:conducteur_urgences',
        label: 'Sécurité du Conducteur & Urgences',
        children: [
          { id: 'alerte:conducteur_urgences:sos', label: 'SOS' },
          { id: 'alerte:conducteur_urgences:collision', label: 'Collision' },
          { id: 'alerte:conducteur_urgences:qualite_conduite', label: 'Qualité de conduite' },
          { id: 'alerte:conducteur_urgences:vitesse', label: 'Dépassement de vitesse' }
        ]
      },
      {
        id: 'alerte:etat_mecanique',
        label: 'État Mécanique & Maintenance',
        children: [
          { id: 'alerte:etat_mecanique:dtc', label: 'DTC (Diagnostic Trouble Codes)' },
          { id: 'alerte:etat_mecanique:batterie_vehicule', label: 'Batterie véhicule faible' },
          { id: 'alerte:etat_mecanique:pression_pneus', label: 'Pression des pneus faible' },
          { id: 'alerte:etat_mecanique:carburant_faible', label: 'Niveau de carburant faible' }
        ]
      },
      {
        id: 'alerte:geofencing',
        label: 'Geofencing',
        children: [
          { id: 'alerte:geofencing:entree_sortie_zone', label: 'Entrée/Sortie de Zone' },
          { id: 'alerte:geofencing:deviation_itineraire', label: "Déviation d'Itinéraire" },
          { id: 'alerte:geofencing:arrivee_site', label: 'Arrivée sur Site Client' },
          { id: 'alerte:geofencing:proximite', label: 'Alerte de Proximité' }
        ]
      },
      {
        id: 'alerte:parametrage',
        label: 'Paramétrage des Alertes',
        children: [
          { id: 'alerte:parametrage:seuils', label: 'Définition des Seuils' },
          { id: 'alerte:parametrage:ciblage', label: 'Ciblage et Assignation' },
          { id: 'alerte:parametrage:destinataires', label: 'Gestion des Destinataires et des Canaux' }
        ]
      }
    ]
  },
  {
    id: 'module:rapport',
    label: 'Rapport',
    children: [
      {
        id: 'rapport:suivi_vehicules',
        label: 'Rapports de Suivi des Véhicules',
        children: [
          {
            id: 'rapport:suivi_vehicules:detaille',
            label: 'Rapport Détaillé',
            children: [
              { id: 'rapport:suivi_vehicules:detaille:consult', label: 'Consultation du rapport détaillé' },
              { id: 'rapport:suivi_vehicules:detaille:filtrage', label: 'Filtrage avancé du rapport' },
              { id: 'rapport:suivi_vehicules:detaille:export', label: 'Export du rapport détaillé' }
            ]
          },
          {
            id: 'rapport:suivi_vehicules:trajets',
            label: 'Rapport des Trajets',
            children: [
              { id: 'rapport:suivi_vehicules:trajets:liste', label: 'Liste des trajets effectués' },
              { id: 'rapport:suivi_vehicules:trajets:detail', label: "Détail d'un trajet" },
              { id: 'rapport:suivi_vehicules:trajets:mensuel', label: 'Rapport mensuel des trajets' },
              { id: 'rapport:suivi_vehicules:trajets:export', label: 'Export des trajets' }
            ]
          },
          {
            id: 'rapport:suivi_vehicules:vitesse',
            label: 'Rapport de Vitesse',
            children: [
              { id: 'rapport:suivi_vehicules:vitesse:visualisation', label: 'Visualisation des données de vitesse' },
              { id: 'rapport:suivi_vehicules:vitesse:exces', label: 'Rapport des excès de vitesse' },
              { id: 'rapport:suivi_vehicules:vitesse:classement', label: 'Classement des infractions de vitesse' },
              { id: 'rapport:suivi_vehicules:vitesse:alerte', label: "Alerte et notification d'excès" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'module:dashboard',
    label: 'Dashboard',
    children: [
      {
        id: 'dashboard:etat_parc',
        label: 'Etat de parc (Opérationnel)',
        children: [
          { id: 'dashboard:etat_parc:statut_flotte', label: 'Statut de la Flotte' },
          { id: 'dashboard:etat_parc:filtres', label: 'Filtres Rapides' },
          { id: 'dashboard:etat_parc:flux_alertes', label: "Flux d'Alertes en Direct" }
        ]
      },
      {
        id: 'dashboard:eco_conduite',
        label: 'Éco-Conduite (Comportement)',
        children: [
          { id: 'dashboard:eco_conduite:score', label: 'Score de Conduite' },
          { id: 'dashboard:eco_conduite:classement', label: 'Classement (Leaderboard)' },
          { id: 'dashboard:eco_conduite:ralenti', label: 'Analyse du Ralenti' }
        ]
      },
      {
        id: 'dashboard:executif',
        label: 'Exécutif (Résumé)',
        children: [
          { id: 'dashboard:executif:kpis', label: 'Kpis de Performance' },
          { id: 'dashboard:executif:tendance', label: 'Tendance Hebdomadaire/Mensuelle' }
        ]
      }
    ]
  },
  {
    id: 'module:administration',
    label: 'Administration',
    children: [
      {
        id: 'admin:comptes',
        label: 'Gestion des comptes',
        children: [
          { id: 'admin:comptes:list', label: 'Lister et rechercher les comptes' },
          { id: 'admin:comptes:create', label: 'Créer un compte utilisateur' },
          { id: 'admin:comptes:update', label: 'Modifier un compte (droits + périmètre)' },
          { id: 'admin:comptes:reset_delete', label: 'Réinitialiser le mot de passe / Supprimer un compte' }
        ]
      },
      {
        id: 'admin:departements',
        label: 'Gestion des départements & affectations',
        children: [
          { id: 'admin:departements:tree', label: "Visualiser l’arborescence des départements" },
          { id: 'admin:departements:search', label: "Rechercher un département dans l’arbre" },
          { id: 'admin:departements:upsert', label: 'Ajouter / modifier un département' },
          { id: 'admin:departements:delete', label: 'Supprimer un département avec option de transfert' }
        ]
      }
    ]
  }
];

function flattenLeafIds(nodes: FeatureNode[]): string[] {
  const ids: string[] = [];
  const walk = (n: FeatureNode) => {
    if (!n.children || n.children.length === 0) {
      ids.push(n.id);
      return;
    }
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return ids;
}

function countSelectedLeaves(node: FeatureNode, selected: Set<string>): { selected: number; total: number } {
  if (!node.children || node.children.length === 0) {
    return { selected: selected.has(node.id) ? 1 : 0, total: 1 };
  }
  return node.children.reduce(
    (acc, child) => {
      const r = countSelectedLeaves(child, selected);
      return { selected: acc.selected + r.selected, total: acc.total + r.total };
    },
    { selected: 0, total: 0 }
  );
}

function toggleAllLeaves(node: FeatureNode, selected: Set<string>, shouldSelect: boolean): Set<string> {
  const next = new Set(selected);
  const walk = (n: FeatureNode) => {
    if (!n.children || n.children.length === 0) {
      if (shouldSelect) next.add(n.id);
      else next.delete(n.id);
      return;
    }
    n.children.forEach(walk);
  };
  walk(node);
  return next;
}

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
    ],
    isActive: true
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
    ],
    isActive: true
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
    ],
    isActive: true
  },
  {
    id: 4,
    name: 'FleetIQ Vision',
    description: 'Pack premium avec dashboard exécutif.',
    color: 'emerald',
    vehicleLimit: 100,
    supportedEquipments: ['ET8+CAN', 'ET6+CAN', 'EasyCAN'],
    features: ['dashboard:executif:kpis', 'dashboard:executif:tendance', 'dashboard:etat_parc:flux_alertes'],
    isActive: true
  }
];

const initialClients: ClientWithPack[] = [
  {
    id: 1,
    name: 'Transport Express',
    type: 'Simple',
    email: 'contact@texpress.fr',
    tel: '+33 1 23 45 67 89',
    packs: [
      {
        packId: 1,
        vehicleLimit: 50,
        equipmentLimits: { ETX: 50, ET6: 50, ET8: 50 }
      }
    ],
    expiry: '2025-12-31',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Global Logistics',
    type: 'Revendeur',
    email: 'admin@glogistics.com',
    tel: '+33 4 56 78 90 12',
    packs: [
      {
        packId: 2,
        vehicleLimit: 30,
        equipmentLimits: { ETX: 30, ETBLE: 30, Dashcam: 10 }
      }
    ],
    expiry: '2026-06-30',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Livraison Rapide',
    type: 'Simple',
    email: 'hello@lrapide.fr',
    tel: '+33 6 12 34 56 78',
    packs: [
      {
        packId: 1,
        vehicleLimit: 50,
        equipmentLimits: { ETX: 50, ET6: 50, ET8: 50 }
      }
    ],
    expiry: '2024-10-15',
    status: 'Blocked'
  },
  {
    id: 4,
    name: 'Auto Fleet Pro',
    type: 'Revendeur',
    email: 'contact@autofleet.pro',
    tel: '+33 9 87 65 43 21',
    packs: [],
    expiry: '2025-01-01',
    status: 'Active'
  }
];

export function SubscriptionsPage() {
  const { currentUserRole, currentUserName, packs: basePacks, clients: allClients, setClients } = useFleetStore();
  const allLeafFeatureIds = useMemo(() => flattenLeafIds(FEATURE_CATALOG), []);
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

  const [packs, setPacks] = useState<Pack[]>(basePacks as unknown as Pack[]);

  const [clientSearch, setClientSearch] = useState('');
  const [packSearch, setPackSearch] = useState('');
  const fixedPackNames = useMemo(
    () => ['FleetIQ Secure', 'FleetIQ Pro', 'FleetIQ Mechanic', 'FleetIQ Vision'] as const,
    []
  );

  // --- Create/Edit pack modal ---
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [packEditingId, setPackEditingId] = useState<number | null>(null);
  const [packName, setPackName] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packColor, setPackColor] = useState<Pack['color']>('indigo');
  const [packEquipments, setPackEquipments] = useState<EquipmentType[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [featureSearch, setFeatureSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['module:suivie', 'module:parc']));

  // --- Assign pack to client modal ---
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [clientToAssign, setClientToAssign] = useState<ClientWithPack | null>(null);
  const [selectedPackIds, setSelectedPackIds] = useState<Set<number>>(new Set());

  // --- Quotas modal (per client) ---
  const [isQuotasModalOpen, setIsQuotasModalOpen] = useState(false);
  const [clientToEditQuotas, setClientToEditQuotas] = useState<ClientWithPack | null>(null);
  const [quotaVehicleLimit, setQuotaVehicleLimit] = useState<number>(0);
  const [quotaEquipmentLimits, setQuotaEquipmentLimits] = useState<Partial<Record<EquipmentType, number>>>({});
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // --- Payment modal ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] = useState<ClientWithPack | null>(null);
  const [newExpiry, setNewExpiry] = useState('');

  // Stats
  const visibleClients = useMemo(() => {
    const isTunavUser = currentUserRole === 'Tunav';
    return (allClients as unknown as ClientWithPack[])
      .filter((c) => !c.name.endsWith('_Stock'))
      .filter((c) => c.name !== 'Tunav')
      // Tunav voit ses revendeurs + clients directs ; un revendeur ne voit que ses propres clients
      .filter((c) => c.reseller === currentUserName)
      .filter((c) => (isTunavUser ? true : c.type === 'Simple'));
  }, [allClients, currentUserName, currentUserRole]);

  const totalClients = visibleClients.length;
  const activeClients = visibleClients.filter((c) => c.status === 'Active').length;
  const blockedClients = visibleClients.filter((c) => c.status === 'Blocked').length;
  const clientsWithPack = visibleClients.filter((c) => c.packs.length > 0).length;

  const packsActive = packs.filter((p) => p.isActive).length;
  const totalPacks = packs.length;
  const clientsWithCustomPack = useMemo(
    () =>
      visibleClients.filter((c) =>
        c.packs.some((a) => Array.isArray(a.customFeatures) && a.customFeatures.length > 0)
      ).length,
    [visibleClients]
  );

  const packById = useMemo(() => new Map(packs.map((p) => [p.id, p])), [packs]);

  const filteredPacks = useMemo(() => {
    const q = packSearch.trim().toLowerCase();
    const order = new Map<string, number>([
      ['FleetIQ Secure', 0],
      ['FleetIQ Pro', 1],
      ['FleetIQ Mechanic', 2],
      ['FleetIQ Vision', 3]
    ]);
    const base = packs
      .filter((p) => fixedPackNames.includes(p.name as any))
      .slice()
      .sort((a, b) => (order.get(a.name) ?? 999) - (order.get(b.name) ?? 999));
    if (!q) return base;
    return base.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [packSearch, packs, fixedPackNames]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return visibleClients;
    return visibleClients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clientSearch, visibleClients]);

  const openCreatePackModal = () => {
    setPackEditingId(null);
    setPackName('');
    setPackDescription('');
    setPackColor('indigo');
    setPackEquipments([]);
    setSelectedFeatures(new Set());
    setFeatureSearch('');
    setExpandedNodes(new Set(['module:suivie', 'module:parc']));
    setIsPackModalOpen(true);
  };

  const openEditPackModal = (pack: Pack) => {
    setPackEditingId(pack.id);
    setPackName(pack.name);
    setPackDescription(pack.description);
    setPackColor(pack.color);
    setPackEquipments(pack.supportedEquipments);
    setSelectedFeatures(new Set(pack.features));
    setFeatureSearch('');
    setExpandedNodes(new Set(['module:suivie', 'module:parc', 'module:alerte', 'module:rapport', 'module:dashboard']));
    setIsPackModalOpen(true);
  };

  const upsertPack = () => {
    const name = packName.trim();
    if (!name) return;

    const features = Array.from(selectedFeatures);
    const preservedVehicleLimit =
      packEditingId != null
        ? (packs.find((p) => p.id === packEditingId)?.vehicleLimit ?? 50)
        : 50;
    const nextPack: Omit<Pack, 'id'> = {
      name,
      description: packDescription.trim(),
      color: packColor,
      vehicleLimit: preservedVehicleLimit,
      supportedEquipments: Array.from(new Set(packEquipments)).sort((a, b) => a.localeCompare(b)),
      features,
      isActive: true
    };

    setPacks((prev) => {
      if (packEditingId === null) {
        const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
        return [{ id: nextId, ...nextPack }, ...prev];
      }
      return prev.map((p) => (p.id === packEditingId ? { ...p, ...nextPack, id: packEditingId } : p));
    });

    setIsPackModalOpen(false);
  };

  const deletePack = (packId: number) => {
    setPacks((prev) => prev.filter((p) => p.id !== packId));
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        packs: c.packs.filter((a) => a.packId !== packId)
      }))
    );
  };

  const openAssignModal = (client: ClientWithPack) => {
    setClientToAssign(client);
    setSelectedPackIds(new Set(client.packs.map((a) => a.packId)));
    setIsAssignModalOpen(true);
  };

  const openQuotasModal = (client: ClientWithPack) => {
    const assignment = client.packs[0];
    const pack = assignment ? packById.get(assignment.packId) : undefined;
    const nextEquipmentLimits =
      assignment?.equipmentLimits ??
      (pack?.supportedEquipments ?? []).reduce<Partial<Record<EquipmentType, number>>>((acc, t) => {
        acc[t] = 0;
        return acc;
      }, {});

    setClientToEditQuotas(client);
    setQuotaVehicleLimit(client.vehicleLimit ?? (assignment?.vehicleLimit ?? pack?.vehicleLimit ?? 0));
    setQuotaEquipmentLimits(nextEquipmentLimits);
    setQuotaError(null);
    setIsQuotasModalOpen(true);
  };

  const openPaymentModal = (client: ClientWithPack) => {
    setClientForPayment(client);
    setNewExpiry(client.expiry);
    setIsPaymentModalOpen(true);
  };

  const handleAssignPack = () => {
    if (!clientToAssign) return;
    const selected = Array.from(selectedPackIds);
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientToAssign.id) return c;

        const byPackId = new Map(c.packs.map((a) => [a.packId, a]));
        const nextAssignments: ClientPackAssignment[] = selected
          .map((packId) => {
            const existing = byPackId.get(packId);
            if (existing) return existing;
            const pack = packById.get(packId);
            if (!pack) return null;
            return {
              packId,
              vehicleLimit: pack.vehicleLimit,
              equipmentLimits: pack.supportedEquipments.reduce<Partial<Record<EquipmentType, number>>>((acc, t) => {
                acc[t] = 0;
                return acc;
              }, {})
            } satisfies ClientPackAssignment;
          })
          .filter(Boolean) as ClientPackAssignment[];

        return { ...c, packs: nextAssignments };
      })
    );
    setIsAssignModalOpen(false);
  };

  const handleValidatePayment = () => {
    if (!clientForPayment) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientForPayment.id
          ? {
              ...c,
              expiry: newExpiry,
              status: 'Active'
            }
          : c
      )
    );
    setIsPaymentModalOpen(false);
  };

  const handleBlockClient = () => {
    if (!clientForPayment) return;
    setClients((prev) => prev.map((c) => (c.id === clientForPayment.id ? { ...c, status: 'Blocked' } : c)));
    setIsPaymentModalOpen(false);
  };

  const matchesFeatureSearch = (label: string) => {
    const q = featureSearch.trim().toLowerCase();
    if (!q) return true;
    return label.toLowerCase().includes(q);
  };

  const doesNodeMatch = (node: FeatureNode): boolean => {
    if (matchesFeatureSearch(node.label)) return true;
    if (!node.children) return false;
    return node.children.some(doesNodeMatch);
  };

  const toggleNodeExpanded = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFeatureTree = (nodes: FeatureNode[], depth = 0) => {
    return nodes
      .filter((n) => (featureSearch.trim() ? doesNodeMatch(n) : true))
      .map((node) => {
        const isLeaf = !node.children || node.children.length === 0;
        const expanded = expandedNodes.has(node.id);
        const pad = depth * 12;

        if (isLeaf) {
          const checked = selectedFeatures.has(node.id);
          return (
            <label
              key={node.id}
              className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-slate-50 cursor-pointer"
              style={{ paddingLeft: 12 + pad }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setSelectedFeatures((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                }}
                className="mt-0.5 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{node.label}</span>
            </label>
          );
        }

        const { selected, total } = countSelectedLeaves(node, selectedFeatures);
        const isAllSelected = total > 0 && selected === total;
        const isPartiallySelected = selected > 0 && selected < total;

        return (
          <div key={node.id} className="rounded-md">
            <div
              className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-slate-50"
              style={{ paddingLeft: 8 + pad }}
            >
              <button
                type="button"
                onClick={() => toggleNodeExpanded(node.id)}
                className="p-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-slate-500"
                aria-label={expanded ? 'Réduire' : 'Déplier'}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = toggleAllLeaves(node, selectedFeatures, !isAllSelected);
                  setSelectedFeatures(next);
                }}
                className={`h-4 w-4 rounded border flex items-center justify-center ${
                  isAllSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isPartiallySelected
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-600'
                }`}
                aria-label="Sélectionner/désélectionner tout"
                title="Sélectionner/désélectionner tout"
              >
                {(isAllSelected || isPartiallySelected) && <Check size={12} />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-900 truncate">{node.label}</span>
                  <span className="text-[11px] text-slate-500">
                    {selected}/{total}
                  </span>
                </div>
              </div>
            </div>

            {expanded && node.children && (
              <div className="pl-2">{renderFeatureTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      });
  };

  const selectedFeatureCount = selectedFeatures.size;
  const totalLeafFeatureCount = allLeafFeatureIds.length;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Gestion des Packs</h1>
          <p className="text-sm text-slate-500">
            Créez des packs, affectez des fonctionnalités, puis associez un pack à chaque client.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Packs" value={totalPacks.toString()} subtitle="Packs configurés" icon={Package} />
        <StatCard
          title="Clients avec pack personnalisé"
          value={clientsWithCustomPack.toString()}
          trend={`${totalClients ? Math.round((clientsWithCustomPack / totalClients) * 100) : 0}%`}
          trendUp={true}
          subtitle="Fonctionnalités personnalisées"
          icon={ShieldCheck}
        />
        <StatCard
          title="Clients Actifs"
          value={activeClients.toString()}
          trend={`${totalClients ? Math.round((activeClients / totalClients) * 100) : 0}%`}
          trendUp={true}
          subtitle="Taux d'activité"
          icon={TrendingUp}
        />
        <StatCard
          title="Clients avec pack"
          value={clientsWithPack.toString()}
          trend={`${totalClients ? Math.round((clientsWithPack / totalClients) * 100) : 0}%`}
          trendUp={true}
          subtitle="Clients associés"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packs */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un pack..."
                value={packSearch}
                onChange={(e) => setPackSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredPacks.map((pack) => (
              <div key={pack.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${COLOR_STYLES[pack.color].badge}`}
                      >
                        {pack.name}
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <ListChecks size={12} />
                        {pack.features.length} fonctionnalités
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{pack.description || '—'}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditPackModal(pack)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier le pack"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredPacks.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">Aucun pack trouvé.</div>
            )}
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Pack</th>
                  <th className="p-4 font-medium">Expiration</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {filteredClients.map((client) => {
                  const assignments = client.packs;
                  const packsForClient = assignments
                    .map((a) => packById.get(a.packId))
                    .filter(Boolean) as Pack[];
                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{client.name}</div>
                        <div className="text-slate-500 text-xs">{client.email}</div>
                      </td>
                      <td className="p-4">
                        {packsForClient.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {packsForClient.map((p) => (
                              <span
                                key={p.id}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium ${COLOR_STYLES[p.color].badge}`}
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Non affecté</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{new Date(client.expiry).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            client.status === 'Active' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              client.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {client.status === 'Active' ? 'Actif' : 'Bloqué'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAssignModal(client)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Affecter des packs"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openPaymentModal(client)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Valider/Bloquer paiements"
                          >
                            <CreditCard size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Aucun client trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- PACK CREATE/EDIT MODAL --- */}
      <Modal
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        title={packEditingId === null ? 'Créer un pack' : 'Modifier un pack'}
        size="xl"
      >
        <div className="flex flex-col min-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du pack</label>
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Ex: Pack Premium"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                placeholder="Décrivez l’objectif du pack…"
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
              <div className="flex flex-wrap gap-2">
                {(['blue', 'indigo', 'amber', 'emerald', 'slate'] as Pack['color'][]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPackColor(c)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      packColor === c
                        ? `border-slate-200 ring-2 ${COLOR_STYLES[c].ring} ${COLOR_STYLES[c].badge}`
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Types d’équipements supportés</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Cochez les types supportés. Les quotas seront définis dans la modale d’affectation client.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPackEquipments(equipmentTypes)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Ajouter tous les types"
                >
                  Tout ajouter
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {equipmentTypes.map((t) => {
                  const enabled = packEquipments.includes(t);
                  return (
                    <div key={t} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 min-w-[140px]">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setPackEquipments((prev) => {
                              if (checked) return [...prev, t];
                              return prev.filter((x) => x !== t);
                            });
                          }}
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{t}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 text-slate-500" size={16} />
              <div>
                <div className="font-medium">Fonctionnalités sélectionnées</div>
                <div className="text-slate-500 text-xs mt-1">
                  {selectedFeatureCount}/{totalLeafFeatureCount} sélectionnées
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedFeatures(new Set(allLeafFeatureIds))}
                className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={() => setSelectedFeatures(new Set())}
                className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Tout retirer
              </button>
            </div>
            </div>

            <div className="lg:col-span-2 space-y-3 flex flex-col min-h-0">
            <div className="flex items-center gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher une fonctionnalité…"
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
                />
              </div>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set(FEATURE_CATALOG.map((m) => m.id)))}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Déplier les modules"
              >
                Déplier
              </button>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set())}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Réduire les modules"
              >
                Réduire
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
              <div className="p-2">{renderFeatureTree(FEATURE_CATALOG)}</div>
            </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-slate-100">
          <button
            onClick={() => setIsPackModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <XCircle size={16} />
            Annuler
          </button>
          <button
            onClick={upsertPack}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Enregistrer
          </button>
          </div>
        </div>
      </Modal>

      {/* --- PAYMENT MODAL --- */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Paiement — ${clientForPayment?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <CreditCard className="shrink-0 mt-0.5" size={16} />
            <p>
              Date d'expiration actuelle :{' '}
              <strong>
                {clientForPayment?.expiry ? new Date(clientForPayment.expiry).toLocaleDateString('fr-FR') : '-'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Statut actuel :</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${
                clientForPayment?.status === 'Active' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  clientForPayment?.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {clientForPayment?.status === 'Active' ? 'Actif' : 'Bloqué'}
            </span>
          </div>

          {(() => {
            const packId = clientForPayment?.packs?.[0]?.packId;
            const pack = packId != null ? packById.get(packId) : undefined;

            if (!pack) return null;

            return (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Pack :</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${COLOR_STYLES[pack.color].badge}`}
                >
                  {pack.name}
                </span>
              </div>
            );
          })()}

          <div className="bg-amber-50 text-amber-900 p-3 rounded-lg text-sm flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5 text-amber-700" size={16} />
            <p>
              La validation du paiement met à jour l’expiration et réactive le client. Le blocage empêche l’accès
              jusqu’à régularisation.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouvelle date d'expiration</label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBlockClient}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Ban size={14} />
              Bloquer
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleValidatePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- ASSIGN PACK MODAL --- */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Pack — ${clientToAssign?.name}`}
        size="md"
      >
        <div className="space-y-5">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <Package className="shrink-0 mt-0.5" size={16} />
            <p>
              Sélectionnez un ou plusieurs packs à affecter au client <strong>{clientToAssign?.name}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pack</label>
            <div className="space-y-2">
              {filteredPacks.map((pack) => {
                const isSelected = selectedPackIds.has(pack.id);
                return (
                  <label
                    key={pack.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? `border-blue-500 bg-blue-50 ring-1 ${COLOR_STYLES[pack.color].ring}`
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedPackIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(pack.id)) next.delete(pack.id);
                          else next.add(pack.id);
                          return next;
                        })
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${COLOR_STYLES[pack.color].badge}`}>
                          {pack.name}
                        </span>
                        <span className="text-[11px] text-slate-500">{pack.features.length} fonctionnalités</span>
                        {isSelected && <CheckCircle2 size={16} className="text-blue-600 ml-auto shrink-0" />}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{pack.description || '—'}</div>
                    </div>
                  </label>
                );
              })}

              <label className="flex items-center justify-between gap-3 p-3 border rounded-lg border-slate-200 hover:bg-slate-50">
                <span className="text-sm text-slate-600">Aucun pack</span>
                <button
                  type="button"
                  onClick={() => setSelectedPackIds(new Set())}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Retirer
                </button>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAssignPack}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- QUOTAS MODAL --- */}
      <Modal
        isOpen={isQuotasModalOpen}
        onClose={() => setIsQuotasModalOpen(false)}
        title={`Quotas — ${clientToEditQuotas?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Véhicules autorisés</label>
              <input
                type="number"
                min={0}
                value={quotaVehicleLimit}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ce quota vient de <strong>Gestion Clients</strong> (illimité = pas d’icône).
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="text-sm font-medium text-slate-900">Quotas par type d’équipement</div>
            <div className="text-xs text-slate-500 mt-1">
              Les types proviennent du pack affecté au client.
            </div>
            <div className="mt-3 space-y-2">
              {Object.keys(quotaEquipmentLimits).length === 0 && (
                <div className="text-xs text-slate-400 italic">Aucun type (ou aucun pack affecté).</div>
              )}
              {Object.entries(quotaEquipmentLimits).map(([t, v]) => (
                <div key={t} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-700">{t}</div>
                  <input
                    type="number"
                    min={0}
                    value={v ?? 0}
                    onChange={(e) =>
                      setQuotaEquipmentLimits((prev) => ({
                        ...prev,
                        [t]: Math.max(0, Number(e.target.value))
                      }))
                    }
                    className="w-28 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {quotaError && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">
              {quotaError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsQuotasModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (!clientToEditQuotas) return;
                const limit = clientToEditQuotas.vehicleLimit;
                const total = Object.values(quotaEquipmentLimits).reduce((acc, v) => acc + (Number(v) || 0), 0);
                if (typeof limit === 'number' && total > limit) {
                  setQuotaError(
                    `Le total des équipements à installer (${total}) ne doit pas dépasser les véhicules autorisés (${limit}).`
                  );
                  return;
                }
                setClients((prev) =>
                  prev.map((c) => {
                    if (c.id !== clientToEditQuotas.id) return c;
                    const a = c.packs[0];
                    if (!a) return c;
                    return {
                      ...c,
                      packs: [
                        {
                          ...a,
                          equipmentLimits: quotaEquipmentLimits
                        }
                      ]
                    };
                  })
                );
                setIsQuotasModalOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}