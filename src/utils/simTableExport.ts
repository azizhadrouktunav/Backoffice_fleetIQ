import type { FleetEquipment, SimCard, SimOffer } from '../state/FleetStore';
import { exportTableToExcel, exportTableToPdf } from './tableExport';

export type SimStatus = 'assigned_equipment' | 'assigned_client' | 'stock';

export type SimKpiKey = 'total' | 'assigned_equipment' | 'assigned_client' | 'stock';

const STATUS_LABELS: Record<SimStatus, string> = {
  assigned_equipment: 'Affectée à un équipement',
  assigned_client: 'Non affectée à un équipement',
  stock: 'En stock'
};

export const SIM_EXPORT_HEADERS = [
  'Numéro puce',
  'ICCID',
  'Opérateur',
  'Client',
  'Offre puce',
  'Statut'
] as const;

export function getSimStatus(sim: SimCard): SimStatus {
  if (sim.equipmentId != null) return 'assigned_equipment';
  if (sim.client.endsWith('_Stock')) return 'stock';
  return 'assigned_client';
}

export function simToExportRow(
  sim: SimCard,
  offerById: Map<number, SimOffer>,
  _equipmentById?: Map<number, FleetEquipment>
): string[] {
  const offer = sim.offerId != null ? offerById.get(sim.offerId) : undefined;
  const status = getSimStatus(sim);
  return [
    sim.phoneNumber || '—',
    sim.iccid || '—',
    offer?.operator || '—',
    sim.client || '—',
    offer?.name || '—',
    STATUS_LABELS[status]
  ];
}

export function buildSimExportRows(
  sims: SimCard[],
  offerById: Map<number, SimOffer>,
  equipmentById?: Map<number, FleetEquipment>
): string[][] {
  return sims.map((sim) => simToExportRow(sim, offerById, equipmentById));
}

export function exportSimsToExcel(
  sims: SimCard[],
  offerById: Map<number, SimOffer>,
  filename: string,
  equipmentById?: Map<number, FleetEquipment>
) {
  const rows = buildSimExportRows(sims, offerById, equipmentById);
  exportTableToExcel(SIM_EXPORT_HEADERS, rows, 'Puces', filename);
}

export function exportSimsToPdf(
  sims: SimCard[],
  offerById: Map<number, SimOffer>,
  title: string,
  filename: string,
  equipmentById?: Map<number, FleetEquipment>
) {
  const rows = buildSimExportRows(sims, offerById, equipmentById);
  exportTableToPdf(title, SIM_EXPORT_HEADERS, rows, filename);
}

export function filterSimsByKpi(sims: SimCard[], kpi: SimKpiKey): SimCard[] {
  if (kpi === 'total') return sims;
  return sims.filter((sim) => getSimStatus(sim) === kpi);
}

export function kpiExportFilename(kpi: SimKpiKey): string {
  switch (kpi) {
    case 'total':
      return 'puces-total.xlsx';
    case 'assigned_equipment':
      return 'puces-affectees-equipement.xlsx';
    case 'assigned_client':
      return 'puces-non-affectees.xlsx';
    case 'stock':
      return 'puces-en-stock.xlsx';
  }
}

export function kpiExportTitle(kpi: SimKpiKey): string {
  switch (kpi) {
    case 'total':
      return 'Total puces';
    case 'assigned_equipment':
      return 'Puces affectées à un équipement';
    case 'assigned_client':
      return 'Puces non affectées';
    case 'stock':
      return 'Puces en stock';
  }
}
