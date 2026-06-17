import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FleetEquipment, SimCard, SimOffer } from '../state/FleetStore';

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSimsToExcel(
  sims: SimCard[],
  offerById: Map<number, SimOffer>,
  filename: string,
  equipmentById?: Map<number, FleetEquipment>
) {
  const rows = buildSimExportRows(sims, offerById, equipmentById);
  const sheet = XLSX.utils.aoa_to_sheet([[...SIM_EXPORT_HEADERS], ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Puces');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  );
}

export function exportSimsToPdf(
  sims: SimCard[],
  offerById: Map<number, SimOffer>,
  title: string,
  filename: string,
  equipmentById?: Map<number, FleetEquipment>
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(10);
  doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, 40, 52);

  autoTable(doc, {
    startY: 64,
    head: [SIM_EXPORT_HEADERS as unknown as string[]],
    body: buildSimExportRows(sims, offerById, equipmentById),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
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
