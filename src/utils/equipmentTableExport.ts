import type { FleetEquipment, Pack, SimCard, SimOffer } from '../state/FleetStore';
import { exportTableToExcel, exportTableToPdf } from './tableExport';

export type EquipmentRowStatus = 'installed' | 'not_installed' | 'stock';

const STATUS_LABELS: Record<EquipmentRowStatus, string> = {
  installed: 'Installée',
  not_installed: 'Non installée',
  stock: 'Stock'
};

const BASE_HEADERS = [
  'Client',
  'Revendeur',
  'Type',
  'IMEI',
  'ICCID',
  'Téléphone SIM',
  'Offre'
] as const;

const PACK_HEADER = 'Pack';
const STATUS_HEADER = 'Statut';

export function getEquipmentExportHeaders(showPack: boolean): string[] {
  return showPack
    ? [...BASE_HEADERS, PACK_HEADER, STATUS_HEADER]
    : [...BASE_HEADERS, STATUS_HEADER];
}

export function equipmentToExportRow(
  eq: FleetEquipment,
  getEquipmentStatus: (eq: FleetEquipment) => EquipmentRowStatus,
  simByEquipmentId: Map<number, SimCard>,
  simOfferById: Map<number, SimOffer>,
  packById: Map<number, Pack>,
  showPack: boolean
): string[] {
  const sim = simByEquipmentId.get(eq.id);
  const iccid = sim?.iccid || eq.iccid || '—';
  const phone = sim?.phoneNumber || eq.sim || '—';
  const offer =
    sim?.offerId != null ? simOfferById.get(sim.offerId)?.name ?? '—' : '—';
  const pack =
    typeof eq.packId === 'number' ? packById.get(eq.packId)?.name ?? '—' : '—';
  const status = STATUS_LABELS[getEquipmentStatus(eq)];
  const eqType = eq.equipmentType ?? eq.type;

  const base = [
    eq.client || '—',
    eq.reseller || '—',
    eqType,
    eq.serial || '—',
    iccid,
    phone,
    offer
  ];

  return showPack ? [...base, pack, status] : [...base, status];
}

export function buildEquipmentExportRows(
  equipments: FleetEquipment[],
  getEquipmentStatus: (eq: FleetEquipment) => EquipmentRowStatus,
  simByEquipmentId: Map<number, SimCard>,
  simOfferById: Map<number, SimOffer>,
  packById: Map<number, Pack>,
  showPack: boolean
): string[][] {
  return equipments.map((eq) =>
    equipmentToExportRow(
      eq,
      getEquipmentStatus,
      simByEquipmentId,
      simOfferById,
      packById,
      showPack
    )
  );
}

type ExportOptions = {
  equipments: FleetEquipment[];
  getEquipmentStatus: (eq: FleetEquipment) => EquipmentRowStatus;
  simByEquipmentId: Map<number, SimCard>;
  simOfferById: Map<number, SimOffer>;
  packById: Map<number, Pack>;
  showPack: boolean;
};

export function exportEquipmentsToExcel(options: ExportOptions) {
  const headers = getEquipmentExportHeaders(options.showPack);
  const rows = buildEquipmentExportRows(
    options.equipments,
    options.getEquipmentStatus,
    options.simByEquipmentId,
    options.simOfferById,
    options.packById,
    options.showPack
  );
  exportTableToExcel(headers, rows, 'Équipements', 'equipements-export.xlsx');
}

export function exportEquipmentsToPdf(options: ExportOptions) {
  const headers = getEquipmentExportHeaders(options.showPack);
  const rows = buildEquipmentExportRows(
    options.equipments,
    options.getEquipmentStatus,
    options.simByEquipmentId,
    options.simOfferById,
    options.packById,
    options.showPack
  );
  exportTableToPdf(
    'Gestion des équipements — export',
    headers,
    rows,
    'equipements-export.pdf'
  );
}
