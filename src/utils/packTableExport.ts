import type { FleetClient, Pack } from '../state/FleetStore';
import { exportTableToExcel, exportTableToPdf } from './tableExport';

export const PACK_LIST_EXPORT_HEADERS = ['Nom', 'Description', 'Nb fonctionnalités'] as const;

export const PACK_CLIENT_EXPORT_HEADERS = [
  'Client',
  'Email',
  'Packs',
  'Expiration',
  'Statut'
] as const;

export function packToExportRow(pack: Pack): string[] {
  return [pack.name, pack.description || '—', String(pack.features.length)];
}

export function buildPackListExportRows(packs: Pack[]): string[][] {
  return packs.map(packToExportRow);
}

export function packClientToExportRow(
  client: FleetClient,
  packById: Map<number, Pack>
): string[] {
  const packNames = client.packs
    .map((a) => packById.get(a.packId)?.name)
    .filter(Boolean)
    .join(', ');
  return [
    client.name,
    client.email || '—',
    packNames || 'Non affecté',
    new Date(client.expiry).toLocaleDateString('fr-FR'),
    client.status === 'Active' ? 'Actif' : 'Bloqué'
  ];
}

export function buildPackClientExportRows(
  clients: FleetClient[],
  packById: Map<number, Pack>
): string[][] {
  return clients.map((client) => packClientToExportRow(client, packById));
}

export function exportPacksListToExcel(packs: Pack[]) {
  const rows = buildPackListExportRows(packs);
  exportTableToExcel(PACK_LIST_EXPORT_HEADERS, rows, 'Packs', 'packs-export.xlsx');
}

export function exportPacksListToPdf(packs: Pack[]) {
  const rows = buildPackListExportRows(packs);
  exportTableToPdf('Gestion des packs — export', PACK_LIST_EXPORT_HEADERS, rows, 'packs-export.pdf');
}

export function exportPackClientsToExcel(clients: FleetClient[], packById: Map<number, Pack>) {
  const rows = buildPackClientExportRows(clients, packById);
  exportTableToExcel(
    PACK_CLIENT_EXPORT_HEADERS,
    rows,
    'Clients',
    'packs-clients-export.xlsx'
  );
}

export function exportPackClientsToPdf(clients: FleetClient[], packById: Map<number, Pack>) {
  const rows = buildPackClientExportRows(clients, packById);
  exportTableToPdf(
    'Gestion des packs — clients',
    PACK_CLIENT_EXPORT_HEADERS,
    rows,
    'packs-clients-export.pdf'
  );
}
