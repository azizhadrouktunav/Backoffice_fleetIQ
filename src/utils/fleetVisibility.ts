import type { FleetClient, FleetEquipment } from '../state/FleetStore';

/** Clients affichés par défaut dans Gestion Clients (vue Tunav). */
export const GESTION_CLIENTS_SHOWCASE_NAMES = [
  'Transport Express',
  'Global Logistics',
  'Société Médicale ABC',
  'Transport Urbain Tunis',
  'Fret International',
  'Distribution Nord'
] as const;

const showcaseNameSet = new Set<string>(GESTION_CLIENTS_SHOWCASE_NAMES);

/** Client stock (Tunav_Stock, {Revendeur}_Stock). */
export function isStockClientName(name: string): boolean {
  return name.endsWith('_Stock');
}

/**
 * Équipements visibles selon le rôle (même règle que la page Équipements).
 */
export function getVisibleEquipments(
  equipments: FleetEquipment[],
  currentUserRole: 'Tunav' | 'Revendeur',
  currentUserName: string
): FleetEquipment[] {
  if (currentUserRole === 'Tunav') return equipments;
  return equipments.filter((e) => e.reseller === currentUserName);
}

/**
 * Noms clients / revendeurs présents dans le tableau équipements (hors stocks).
 */
export function getLinkedEntityNamesFromEquipments(
  visibleEquipments: FleetEquipment[]
): Set<string> {
  const names = new Set<string>();
  for (const e of visibleEquipments) {
    if (!isStockClientName(e.client) && e.client !== 'Tunav') {
      names.add(e.client);
    }
    if (e.reseller && e.reseller !== 'Tunav') {
      names.add(e.reseller);
    }
  }
  return names;
}

/**
 * Clients affichables en Gestion Clients : alignés sur le périmètre équipements.
 * - Tunav : clients directs + toute entité liée à un équipement visible.
 * - Revendeur : clients Simple sous ce revendeur, présents dans ses équipements.
 */
export function getVisibleClients(
  clients: FleetClient[],
  visibleEquipments: FleetEquipment[],
  currentUserRole: 'Tunav' | 'Revendeur',
  currentUserName: string
): FleetClient[] {
  const linkedNames = getLinkedEntityNamesFromEquipments(visibleEquipments);
  const isTunavUser = currentUserRole === 'Tunav';

  const base = clients.filter((c) => !isStockClientName(c.name) && c.name !== 'Tunav');

  const filtered = base.filter((c) => {
    if (isTunavUser) {
      return (
        c.reseller === currentUserName ||
        linkedNames.has(c.name) ||
        showcaseNameSet.has(c.name)
      );
    }
    return (
      c.reseller === currentUserName &&
      c.type === 'Simple' &&
      linkedNames.has(c.name)
    );
  });

  return filtered.slice().sort((a, b) => a.name.localeCompare(b.name));
}
