import React from 'react';
import {
  CheckCircle2,
  Edit2,
  Eye,
  XCircle,
  ArrowLeftRight,
  Boxes,
  Store,
  Cpu,
  Hash,
  User as UserIcon,
  Trash2,
  Package,
  Smartphone
} from 'lucide-react';
import type { EquipmentType, FleetClient, FleetEquipment, Pack, SimCard, SimOffer } from '../state/FleetStore';

export type EquipmentRowStatus = 'installed' | 'not_installed' | 'stock';

type Props = {
  rows: FleetEquipment[];
  equipmentTypes: EquipmentType[];
  packs: Pack[];
  clients: FleetClient[];
  simOfferById: Map<number, SimOffer>;
  simByEquipmentId: Map<number, SimCard>;
  packById: Map<number, Pack>;
  isTunavUser: boolean;
  filterEquipmentType: string;
  setFilterEquipmentType: (v: string) => void;
  filterClientReseller: string;
  setFilterClientReseller: (v: string) => void;
  filterPack: string;
  setFilterPack: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  clientResellerFilterOptions: string[];
  getEquipmentStatus: (eq: FleetEquipment) => EquipmentRowStatus;
  isStockEquipment: (client: string) => boolean;
  onEdit: (eq: FleetEquipment) => void;
  onDelete: (eq: FleetEquipment) => void;
  onViewDetails: (eq: FleetEquipment) => void;
  onInstall: (eq: FleetEquipment) => void;
  onUninstall: (eq: FleetEquipment) => void;
  onAssignClient: (eq: FleetEquipment) => void;
  onAssignReseller: (eq: FleetEquipment) => void;
  onReturnToStock: (eq: FleetEquipment) => void;
};

export function EquipmentsUnifiedTable({
  rows,
  equipmentTypes,
  packs,
  clients,
  simOfferById,
  simByEquipmentId,
  packById,
  isTunavUser,
  filterEquipmentType,
  setFilterEquipmentType,
  filterClientReseller,
  setFilterClientReseller,
  filterPack,
  setFilterPack,
  filterStatus,
  setFilterStatus,
  clientResellerFilterOptions,
  getEquipmentStatus,
  isStockEquipment,
  onEdit,
  onDelete,
  onViewDetails,
  onInstall,
  onUninstall,
  onAssignClient,
  onAssignReseller,
  onReturnToStock
}: Props) {
  const renderClientResellerCell = (eq: FleetEquipment) => {
    if (isStockEquipment(eq.client)) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Boxes size={12} />
            Stock
          </span>
          <span className="font-medium text-slate-900">{eq.client}</span>
          {eq.reseller && <span className="text-[11px] text-slate-500">Revendeur : {eq.reseller}</span>}
        </div>
      );
    }
    const clientEntity = clients.find((c) => c.name === eq.client);
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-slate-900">{eq.client}</span>
        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
          {clientEntity?.type === 'Revendeur' ? <Store size={11} /> : <UserIcon size={11} />}
          {clientEntity?.type === 'Revendeur' ? 'Revendeur' : 'Client'}
          {eq.reseller && eq.reseller !== eq.client ? ` · ${eq.reseller}` : ''}
        </span>
      </div>
    );
  };

  const renderStatusBadge = (eq: FleetEquipment) => {
    const status = getEquipmentStatus(eq);
    if (status === 'installed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          Installé
        </span>
      );
    }
    if (status === 'stock') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
          <Boxes size={12} />
          Stock Tunav
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <XCircle size={12} />
        Non installé
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-3">
        <select
          value={filterEquipmentType}
          onChange={(e) => setFilterEquipmentType(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les types</option>
          {equipmentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filterClientReseller}
          onChange={(e) => setFilterClientReseller(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
        >
          <option value="all">Tous clients / revendeurs</option>
          {clientResellerFilterOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={filterPack}
          onChange={(e) => setFilterPack(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les packs</option>
          <option value="none">Sans pack</option>
          {packs.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="installed">Installé</option>
          <option value="not_installed">Non installé</option>
          <option value="stock">Stock Tunav</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
              <th className="p-4 font-medium">Client / Revendeur</th>
              <th className="p-4 font-medium">Type / IMEI</th>
              <th className="p-4 font-medium">Carte SIM / Offre</th>
              <th className="p-4 font-medium">Pack</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {rows.map((eq) => {
              const status = getEquipmentStatus(eq);
              const sim = simByEquipmentId.get(eq.id);
              const iccid = sim?.iccid || eq.iccid;
              const phone = sim?.phoneNumber || eq.sim;
              const offer = sim?.offerId != null ? simOfferById.get(sim.offerId) : undefined;
              const pack = typeof eq.packId === 'number' ? packById.get(eq.packId) : undefined;
              const eqType = eq.equipmentType ?? eq.type;
              const inStock = status === 'stock';

              return (
                <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">{renderClientResellerCell(eq)}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{eqType}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Cpu size={11} />
                      IMEI : {eq.serial}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {iccid ? (
                        <span className="text-xs text-slate-900 inline-flex items-center gap-1">
                          <Hash size={11} className="text-slate-400" />
                          {iccid}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pas de CCID</span>
                      )}
                      {phone && (
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                          <Smartphone size={11} />
                          {phone}
                        </span>
                      )}
                      {offer ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md self-start">
                          <Package size={11} />
                          {offer.name}
                          {offer.operator && (
                            <span className="text-slate-500 font-normal">· {offer.operator}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Aucune offre</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {pack ? (
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {pack.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="p-4">{renderStatusBadge(eq)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onEdit(eq)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(eq)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                      {status === 'installed' ? (
                        <button
                          type="button"
                          onClick={() => onUninstall(eq)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Désinstaller"
                        >
                          <XCircle size={16} />
                        </button>
                      ) : (
                        !inStock && (
                          <button
                            type="button"
                            onClick={() => onInstall(eq)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Installer"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => onViewDetails(eq)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Voir détail"
                      >
                        <Eye size={16} />
                      </button>
                      {(inStock || status === 'not_installed') && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAssignClient(eq)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Affecter à un client"
                          >
                            <ArrowLeftRight size={16} />
                          </button>
                          {isTunavUser && inStock && (
                            <button
                              type="button"
                              onClick={() => onAssignReseller(eq)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                              title="Affecter à un revendeur"
                            >
                              <Store size={16} />
                            </button>
                          )}
                        </>
                      )}
                      {!inStock && status !== 'installed' && (
                        <button
                          type="button"
                          onClick={() => onReturnToStock(eq)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Retour au stock"
                        >
                          <Boxes size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Aucun équipement trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
