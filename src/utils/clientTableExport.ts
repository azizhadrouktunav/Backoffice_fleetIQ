import type { FleetClient } from '../state/FleetStore';
import { exportTableToExcel, exportTableToPdf } from './tableExport';

export const CLIENT_EXPORT_HEADERS = [
  'Client',
  'Revendeur',
  'Type',
  'Parc équipements',
  'Dernière connexion',
  'Statut'
] as const;

export type ClientEquipmentStats = {
  simpleByClient: Map<string, { installed: number; total: number }>;
  resellerTotals: Map<string, number>;
  lastConnectionByClient: Map<string, Date>;
};

function formatLastConnectionExport(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatParcExport(client: FleetClient, stats: ClientEquipmentStats): string {
  if (client.type === 'Revendeur') {
    const total = stats.resellerTotals.get(client.name) ?? 0;
    return total === 0 ? 'Aucun' : String(total);
  }
  const clientStats = stats.simpleByClient.get(client.name) ?? { installed: 0, total: 0 };
  if (clientStats.total === 0) return 'Aucun équipement';
  return `${clientStats.installed} installé(s) / ${clientStats.total}`;
}

export function clientToExportRow(
  client: FleetClient,
  stats: ClientEquipmentStats
): string[] {
  const lastConnection = stats.lastConnectionByClient.get(client.name);
  return [
    client.name,
    client.reseller || '—',
    client.type === 'Revendeur' ? 'Revendeur' : 'Simple',
    formatParcExport(client, stats),
    formatLastConnectionExport(lastConnection),
    client.status === 'Active' ? 'Actif' : 'Bloqué'
  ];
}

export function buildClientExportRows(
  clients: FleetClient[],
  stats: ClientEquipmentStats
): string[][] {
  return clients.map((client) => clientToExportRow(client, stats));
}

export function exportClientsToExcel(clients: FleetClient[], stats: ClientEquipmentStats) {
  const rows = buildClientExportRows(clients, stats);
  exportTableToExcel(CLIENT_EXPORT_HEADERS, rows, 'Clients', 'clients-export.xlsx');
}

export function exportClientsToPdf(clients: FleetClient[], stats: ClientEquipmentStats) {
  const rows = buildClientExportRows(clients, stats);
  exportTableToPdf(
    'Gestion des clients — export',
    CLIENT_EXPORT_HEADERS,
    rows,
    'clients-export.pdf'
  );
}
