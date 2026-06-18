export type BackofficeRole =
  | 'admin_tunav'
  | 'responsable_sav'
  | 'technicien_sav'
  | 'revendeur'
  | 'finance_tunav';

export type BackofficeRouteKey =
  | 'dashboard'
  | 'clients'
  | 'subscriptions'
  | 'sims'
  | 'equipments';

export type BackofficePermissions = {
  routes: Record<BackofficeRouteKey, boolean>;
  clients: {
    canAddEdit: boolean;
    canViewDetails: boolean;
    canViewEquipments: boolean;
    canInstallEquipment: boolean;
    canUninstallEquipment: boolean;
    canEditEquipmentSim: boolean;
    canManagePayment: boolean;
  };
  equipments: {
    canAdd: boolean;
    canEdit: boolean;
    canAssign: boolean;
    canReturnToStock: boolean;
    canViewDetails: boolean;
  };
  sims: { canManage: boolean };
  subscriptions: { canManage: boolean };
  dashboard: { canViewAdminSections: boolean };
};

const FULL_CLIENTS = {
  canAddEdit: true,
  canViewDetails: true,
  canViewEquipments: true,
  canInstallEquipment: true,
  canUninstallEquipment: true,
  canEditEquipmentSim: true,
  canManagePayment: false
} as const;

const FULL_EQUIPMENTS = {
  canAdd: true,
  canEdit: true,
  canAssign: true,
  canReturnToStock: true,
  canViewDetails: true
} as const;

const ALL_ROUTES: Record<BackofficeRouteKey, boolean> = {
  dashboard: true,
  clients: true,
  subscriptions: true,
  sims: true,
  equipments: true
};

const PERMISSIONS_BY_ROLE: Record<BackofficeRole, BackofficePermissions> = {
  admin_tunav: {
    routes: ALL_ROUTES,
    clients: { ...FULL_CLIENTS, canManagePayment: true },
    equipments: FULL_EQUIPMENTS,
    sims: { canManage: true },
    subscriptions: { canManage: true },
    dashboard: { canViewAdminSections: true }
  },
  finance_tunav: {
    routes: {
      dashboard: true,
      clients: true,
      subscriptions: true,
      sims: false,
      equipments: false
    },
    clients: {
      canAddEdit: true,
      canViewDetails: true,
      canViewEquipments: true,
      canInstallEquipment: false,
      canUninstallEquipment: false,
      canEditEquipmentSim: false,
      canManagePayment: true
    },
    equipments: {
      canAdd: false,
      canEdit: false,
      canAssign: false,
      canReturnToStock: false,
      canViewDetails: false
    },
    sims: { canManage: false },
    subscriptions: { canManage: true },
    dashboard: { canViewAdminSections: false }
  },
  responsable_sav: {
    routes: ALL_ROUTES,
    clients: { ...FULL_CLIENTS, canManagePayment: false },
    equipments: FULL_EQUIPMENTS,
    sims: { canManage: true },
    subscriptions: { canManage: true },
    dashboard: { canViewAdminSections: false }
  },
  technicien_sav: {
    routes: {
      dashboard: false,
      clients: true,
      subscriptions: false,
      sims: false,
      equipments: false
    },
    clients: {
      canAddEdit: false,
      canViewDetails: true,
      canViewEquipments: true,
      canInstallEquipment: true,
      canUninstallEquipment: false,
      canEditEquipmentSim: false,
      canManagePayment: false
    },
    equipments: {
      canAdd: false,
      canEdit: false,
      canAssign: false,
      canReturnToStock: false,
      canViewDetails: false
    },
    sims: { canManage: false },
    subscriptions: { canManage: false },
    dashboard: { canViewAdminSections: false }
  },
  revendeur: {
    routes: {
      dashboard: true,
      clients: true,
      subscriptions: false,
      sims: true,
      equipments: true
    },
    clients: {
      canAddEdit: true,
      canViewDetails: true,
      canViewEquipments: true,
      canInstallEquipment: true,
      canUninstallEquipment: true,
      canEditEquipmentSim: true,
      canManagePayment: true
    },
    equipments: {
      canAdd: false,
      canEdit: true,
      canAssign: true,
      canReturnToStock: true,
      canViewDetails: true
    },
    sims: { canManage: true },
    subscriptions: { canManage: false },
    dashboard: { canViewAdminSections: false }
  }
};

export function getBackofficePermissions(role: BackofficeRole): BackofficePermissions {
  return PERMISSIONS_BY_ROLE[role];
}

export function canAccessRoute(role: BackofficeRole, route: BackofficeRouteKey): boolean {
  return getBackofficePermissions(role).routes[route];
}

export function getDefaultRoute(role: BackofficeRole): string {
  switch (role) {
    case 'technicien_sav':
      return '/clients';
    case 'finance_tunav':
      return '/subscriptions';
    default:
      return '/dashboard';
  }
}
