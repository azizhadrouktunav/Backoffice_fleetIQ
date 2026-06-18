import { exportTableToExcel, exportTableToPdf } from './tableExport';

export const DISCONNECTED_EQUIPMENT_HEADERS = [
  'N° Série',
  'Client',
  'Véhicule',
  'Dernière connexion'
] as const;

export const DISCONNECTED_CLIENT_HEADERS = ['Client', 'Dernière connexion'] as const;

export type DisconnectedEquipmentRow = {
  serial: string;
  client: string;
  vehicle: string;
  lastSeen: string;
};

export type DisconnectedClientRow = {
  client: string;
  lastConnection: string;
};

function formatLastConnectionExport(isoLike: string): string {
  const d = new Date(isoLike.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return isoLike || '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function disconnectedEquipmentToExportRow(eq: DisconnectedEquipmentRow): string[] {
  const vehicle = eq.vehicle === 'Unassigned' ? 'Non assigné' : eq.vehicle || '—';
  return [
    eq.serial || '—',
    eq.client || '—',
    vehicle,
    formatLastConnectionExport(eq.lastSeen)
  ];
}

export function buildDisconnectedEquipmentExportRows(
  equipments: DisconnectedEquipmentRow[]
): string[][] {
  return equipments.map(disconnectedEquipmentToExportRow);
}

export function disconnectedClientToExportRow(row: DisconnectedClientRow): string[] {
  return [row.client, formatLastConnectionExport(row.lastConnection)];
}

export function buildDisconnectedClientExportRows(
  rows: DisconnectedClientRow[]
): string[][] {
  return rows.map(disconnectedClientToExportRow);
}

export function exportDisconnectedEquipmentsToExcel(equipments: DisconnectedEquipmentRow[]) {
  const rows = buildDisconnectedEquipmentExportRows(equipments);
  exportTableToExcel(
    DISCONNECTED_EQUIPMENT_HEADERS,
    rows,
    'Équipements',
    'equipements-deconnectes-export.xlsx'
  );
}

export function exportDisconnectedEquipmentsToPdf(equipments: DisconnectedEquipmentRow[]) {
  const rows = buildDisconnectedEquipmentExportRows(equipments);
  exportTableToPdf(
    'Équipements déconnectés — export',
    DISCONNECTED_EQUIPMENT_HEADERS,
    rows,
    'equipements-deconnectes-export.pdf'
  );
}

export function exportDisconnectedClientsToExcel(rows: DisconnectedClientRow[]) {
  const data = buildDisconnectedClientExportRows(rows);
  exportTableToExcel(
    DISCONNECTED_CLIENT_HEADERS,
    data,
    'Clients',
    'clients-deconnectes-export.xlsx'
  );
}

export function exportDisconnectedClientsToPdf(rows: DisconnectedClientRow[]) {
  const data = buildDisconnectedClientExportRows(rows);
  exportTableToPdf(
    'Clients déconnectés — export',
    DISCONNECTED_CLIENT_HEADERS,
    data,
    'clients-deconnectes-export.pdf'
  );
}
