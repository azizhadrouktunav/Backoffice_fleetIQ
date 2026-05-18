import type { FleetClient, FleetEquipment } from '../state/FleetStore';
import { isStockClientName } from './fleetVisibility';

export const TUNAV_RESELLER_NAME = 'Tunav';
export const MYCOM_RESELLER_NAME = 'MyCom';

/** Client simple rattaché directement à Tunav (affectable par l'admin Tunav). */
export function isTunavDirectClient(client: FleetClient): boolean {
  return client.type === 'Simple' && client.reseller === TUNAV_RESELLER_NAME;
}

/** Revendeur de second niveau (ex. MyCom), affectable par Tunav en stock revendeur. */
export function isTunavAssignableReseller(client: FleetClient): boolean {
  return (
    client.type === 'Revendeur' &&
    client.name !== TUNAV_RESELLER_NAME &&
    !isStockClientName(client.name) &&
    client.reseller === TUNAV_RESELLER_NAME
  );
}

/** Clients simples affectables depuis le compte Tunav (pas les clients d'un revendeur). */
export function getAssignableSimpleClients(
  clients: FleetClient[],
  isTunavUser: boolean,
  currentUserName: string
): FleetClient[] {
  return clients
    .filter((c) => !isStockClientName(c.name) && c.name !== TUNAV_RESELLER_NAME && c.type === 'Simple')
    .filter((c) => (isTunavUser ? isTunavDirectClient(c) : c.reseller === currentUserName))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Revendeurs affectables depuis le compte Tunav (ex. MyCom). */
export function getAssignableResellers(clients: FleetClient[], isTunavUser: boolean): FleetClient[] {
  if (!isTunavUser) return [];
  return clients.filter(isTunavAssignableReseller).sort((a, b) => a.name.localeCompare(b.name));
}

/** Cibles d'affectation puce : clients Tunav + revendeurs (stock). */
export function getAssignableSimTargets(
  clients: FleetClient[],
  isTunavUser: boolean,
  currentUserName: string
): FleetClient[] {
  const base = clients.filter((c) => !isStockClientName(c.name) && c.name !== TUNAV_RESELLER_NAME);
  if (isTunavUser) {
    return base
      .filter((c) => isTunavDirectClient(c) || isTunavAssignableReseller(c))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return base.filter((c) => c.type === 'Simple' && c.reseller === currentUserName).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/** Nom client stocké sur la puce selon le type de cible. */
export function getSimAssignmentClientName(client: FleetClient): string {
  return client.type === 'Revendeur' ? `${client.name}_Stock` : client.name;
}

/** IMEI / numéros de série liés à une ligne du tableau clients. */
export function getClientEquipmentSerials(
  client: FleetClient,
  equipments: FleetEquipment[]
): string[] {
  const serials: string[] = [];
  for (const e of equipments) {
    if (client.type === 'Revendeur') {
      if (e.reseller === client.name || e.client === `${client.name}_Stock` || e.client === client.name) {
        serials.push(e.serial);
      }
    } else if (e.client === client.name) {
      serials.push(e.serial);
    }
  }
  return serials.sort((a, b) => a.localeCompare(b));
}
