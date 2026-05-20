import React, { useMemo, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PeriodFilter, PeriodKey } from '../components/PeriodFilter';
import { SearchableSelect } from '../components/SearchableSelect';
import { Users, Server, WifiOff, Building2, AlertCircle, UserX } from 'lucide-react';
import { Modal } from '../components/Modal';

type DisconnectedEquipment = {
  id: number;
  serial: string;
  client: string;
  lastSeen: string;
  duration: string;
  vehicle: string;
};

type DisconnectedClientRow = {
  client: string;
  lastConnection: string;
  disconnectedEquipments: number;
};

const mockResellers = [
  { id: 'rev-1', name: 'Global Logistics' },
  { id: 'rev-2', name: 'Auto Fleet Pro' },
  { id: 'rev-3', name: 'Transport Express' }
];

function daysAgoLastSeen(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`;
}

const mockDisconnectedEquipments: DisconnectedEquipment[] = [
  {
    id: 1,
    serial: 'EQ-2024-002',
    client: 'Global Logistics',
    lastSeen: daysAgoLastSeen(2, 14),
    duration: '48h',
    vehicle: 'Unassigned'
  },
  {
    id: 2,
    serial: 'EQ-2023-156',
    client: 'Transport Express',
    lastSeen: daysAgoLastSeen(3, 9),
    duration: '72h',
    vehicle: 'AB-123-CD'
  },
  {
    id: 3,
    serial: 'EQ-2024-089',
    client: 'Auto Fleet Pro',
    lastSeen: daysAgoLastSeen(1, 8),
    duration: '26h',
    vehicle: 'EF-456-GH'
  },
  {
    id: 4,
    serial: 'EQ-2024-112',
    client: 'Global Logistics',
    lastSeen: daysAgoLastSeen(12, 16),
    duration: '312h',
    vehicle: 'IJ-789-KL'
  },
  {
    id: 5,
    serial: 'EQ-2023-045',
    client: 'Transport Express',
    lastSeen: daysAgoLastSeen(6, 11),
    duration: '144h',
    vehicle: 'MN-012-OP'
  },
  {
    id: 6,
    serial: 'EQ-2024-201',
    client: 'Fleet Demo',
    lastSeen: daysAgoLastSeen(4, 18),
    duration: '96h',
    vehicle: 'QR-345-ST'
  }
];

const tunavStatsByPeriod: Record<
  PeriodKey,
  {
    clients: string;
    equipments: string;
    disconnected: string;
    disconnectedClients: string;
    clientsTrend: string;
    eqTrend: string;
  }
> = {
  today: {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '42',
    disconnectedClients: '18',
    clientsTrend: '0.3%',
    eqTrend: '0.1%'
  },
  '7d': {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '128',
    disconnectedClients: '52',
    clientsTrend: '2.1%',
    eqTrend: '0.8%'
  },
  '30d': {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '342',
    disconnectedClients: '89',
    clientsTrend: '12.5%',
    eqTrend: '2.1%'
  },
  '3m': {
    clients: '1,180',
    equipments: '8,650',
    disconnected: '587',
    disconnectedClients: '124',
    clientsTrend: '18.2%',
    eqTrend: '5.4%'
  },
  custom: {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '215',
    disconnectedClients: '67',
    clientsTrend: '8.0%',
    eqTrend: '1.5%'
  }
};

const resellerStatsByPeriod: Record<
  PeriodKey,
  {
    clients: string;
    equipments: string;
    disconnected: string;
    disconnectedClients: string;
  }
> = {
  today: { clients: '45', equipments: '320', disconnected: '3', disconnectedClients: '2' },
  '7d': { clients: '45', equipments: '320', disconnected: '8', disconnectedClients: '4' },
  '30d': { clients: '45', equipments: '320', disconnected: '12', disconnectedClients: '5' },
  '3m': { clients: '42', equipments: '305', disconnected: '24', disconnectedClients: '9' },
  custom: { clients: '45', equipments: '320', disconnected: '10', disconnectedClients: '4' }
};

function aggregateDisconnectedClients(equipments: DisconnectedEquipment[]): DisconnectedClientRow[] {
  const byClient = new Map<string, { lastSeen: string; count: number }>();
  for (const eq of equipments) {
    const cur = byClient.get(eq.client);
    if (!cur) {
      byClient.set(eq.client, { lastSeen: eq.lastSeen, count: 1 });
    } else {
      cur.count += 1;
      if (eq.lastSeen > cur.lastSeen) cur.lastSeen = eq.lastSeen;
    }
  }
  return Array.from(byClient.entries())
    .map(([client, { lastSeen, count }]) => ({
      client,
      lastConnection: lastSeen,
      disconnectedEquipments: count
    }))
    .sort((a, b) => a.client.localeCompare(b.client));
}

function formatLastConnection(isoLike: string): string {
  const d = new Date(isoLike.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return isoLike;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPeriodRange(
  period: PeriodKey,
  start: string,
  end: string
): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  let from = new Date(now);
  from.setHours(0, 0, 0, 0);
  switch (period) {
    case '7d':
      from.setDate(from.getDate() - 6);
      break;
    case '30d':
      from.setDate(from.getDate() - 29);
      break;
    case '3m':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'custom':
      if (start) from = new Date(start);
      if (end) {
        to.setTime(new Date(end).getTime());
        to.setHours(23, 59, 59, 999);
      }
      break;
    default:
      break;
  }
  return { from, to };
}

function isLastSeenInPeriod(
  lastSeen: string,
  period: PeriodKey,
  start: string,
  end: string
): boolean {
  const { from, to } = getPeriodRange(period, start, end);
  const d = new Date(lastSeen.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return true;
  return d >= from && d <= to;
}

function periodLabel(period: PeriodKey): string {
  switch (period) {
    case 'today':
      return "aujourd'hui";
    case '7d':
      return 'les 7 derniers jours';
    case '30d':
      return 'les 30 derniers jours';
    case '3m':
      return 'les 3 derniers mois';
    case 'custom':
      return 'la période sélectionnée';
  }
}

export function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisconnectedClientsModalOpen, setIsDisconnectedClientsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<'tunav' | 'reseller'>('tunav');
  const [selectedReseller, setSelectedReseller] = useState('');
  const [disconnectClientFilter, setDisconnectClientFilter] = useState('');
  const [disconnectPeriod, setDisconnectPeriod] = useState<PeriodKey>('30d');
  const [disconnectStartDate, setDisconnectStartDate] = useState('');
  const [disconnectEndDate, setDisconnectEndDate] = useState('');

  const [tunavPeriod, setTunavPeriod] = useState<PeriodKey>('30d');
  const [tunavStartDate, setTunavStartDate] = useState('');
  const [tunavEndDate, setTunavEndDate] = useState('');
  const [resellerPeriod, setResellerPeriod] = useState<PeriodKey>('30d');
  const [resellerStartDate, setResellerStartDate] = useState('');
  const [resellerEndDate, setResellerEndDate] = useState('');

  const tunavStats = tunavStatsByPeriod[tunavPeriod];
  const resellerStats = selectedReseller ? resellerStatsByPeriod[resellerPeriod] : null;

  const scopeDisconnected = useMemo(() => {
    if (modalSource === 'reseller' && selectedReseller) {
      const reseller = mockResellers.find((r) => r.id === selectedReseller);
      if (!reseller) return mockDisconnectedEquipments;
      return mockDisconnectedEquipments.filter((eq) => eq.client === reseller.name);
    }
    return mockDisconnectedEquipments;
  }, [modalSource, selectedReseller]);

  const dateFilteredScope = useMemo(
    () =>
      scopeDisconnected.filter((eq) =>
        isLastSeenInPeriod(eq.lastSeen, disconnectPeriod, disconnectStartDate, disconnectEndDate)
      ),
    [scopeDisconnected, disconnectPeriod, disconnectStartDate, disconnectEndDate]
  );

  const clientFilterOptions = useMemo(() => {
    const names = new Set(dateFilteredScope.map((eq) => eq.client));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [dateFilteredScope]);

  const filteredDisconnected = useMemo(() => {
    if (!disconnectClientFilter) return dateFilteredScope;
    return dateFilteredScope.filter((eq) => eq.client === disconnectClientFilter);
  }, [dateFilteredScope, disconnectClientFilter]);

  const disconnectedClientsRows = useMemo(
    () => aggregateDisconnectedClients(dateFilteredScope),
    [dateFilteredScope]
  );

  const filteredDisconnectedClientsRows = useMemo(() => {
    if (!disconnectClientFilter) return disconnectedClientsRows;
    return disconnectedClientsRows.filter((row) => row.client === disconnectClientFilter);
  }, [disconnectedClientsRows, disconnectClientFilter]);

  const syncDisconnectPeriodFromDashboard = (source: 'tunav' | 'reseller') => {
    if (source === 'tunav') {
      setDisconnectPeriod(tunavPeriod);
      setDisconnectStartDate(tunavStartDate);
      setDisconnectEndDate(tunavEndDate);
    } else {
      setDisconnectPeriod(resellerPeriod);
      setDisconnectStartDate(resellerStartDate);
      setDisconnectEndDate(resellerEndDate);
    }
  };

  const openDisconnectedModal = (source: 'tunav' | 'reseller') => {
    setModalSource(source);
    syncDisconnectPeriodFromDashboard(source);
    setDisconnectClientFilter('');
    setIsModalOpen(true);
  };

  const openDisconnectedClientsModal = (source: 'tunav' | 'reseller') => {
    setModalSource(source);
    syncDisconnectPeriodFromDashboard(source);
    setDisconnectClientFilter('');
    setIsDisconnectedClientsModalOpen(true);
  };

  const closeDisconnectedModal = () => {
    setIsModalOpen(false);
    setDisconnectClientFilter('');
  };

  const disconnectPeriodLabel = periodLabel(disconnectPeriod);

  const equipmentModalTitle =
    modalSource === 'reseller' && selectedReseller
      ? `Équipements Déconnectés — ${mockResellers.find((r) => r.id === selectedReseller)?.name}`
      : 'Équipements Déconnectés (+24h)';

  const clientsModalTitle =
    modalSource === 'reseller' && selectedReseller
      ? `Clients déconnectés — ${mockResellers.find((r) => r.id === selectedReseller)?.name}`
      : 'Clients déconnectés (+24h)';

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Tableau de bord</h1>
        <div className="text-xs text-slate-500">Dernière mise à jour : Aujourd&apos;hui, 10:42</div>
      </div>

      <section>
        <div className="mb-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-lg font-semibold text-slate-900">Dashboard Tunav</h2>
            </div>
            <p className="text-sm text-slate-500 ml-4 mt-1">
              Vue globale de la plateforme et statistiques générales
            </p>
          </div>
          <PeriodFilter
            value={tunavPeriod}
            onChange={setTunavPeriod}
            startDate={tunavStartDate}
            endDate={tunavEndDate}
            onStartDateChange={setTunavStartDate}
            onEndDateChange={setTunavEndDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Clients"
            value={tunavStats.clients}
            trend={tunavStats.clientsTrend}
            trendUp
            subtitle={`Nouveaux clients sur ${periodLabel(tunavPeriod)}`}
            icon={Users}
          />
          <StatCard
            title="Total Équipements"
            value={tunavStats.equipments}
            trend={tunavStats.eqTrend}
            trendUp
            subtitle={`Équipements déployés sur ${periodLabel(tunavPeriod)}`}
            icon={Server}
          />
          <StatCard
            title="Équipements Déconnectés"
            value={tunavStats.disconnected}
            subtitle={`Déconnectés +24h sur ${periodLabel(tunavPeriod)}`}
            icon={WifiOff}
            color="red"
            onClick={() => openDisconnectedModal('tunav')}
          />
          <StatCard
            title="Clients Déconnectés"
            value={tunavStats.disconnectedClients}
            subtitle={`Comptes clients +24h sur ${periodLabel(tunavPeriod)}`}
            icon={UserX}
            color="red"
            onClick={() => openDisconnectedClientsModal('tunav')}
          />
        </div>
      </section>

      <section className="pt-6 border-t border-slate-200">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                <h2 className="text-lg font-semibold text-slate-900">Dashboard Revendeurs</h2>
              </div>
              <p className="text-sm text-slate-500 ml-4 mt-1">Statistiques détaillées par revendeur</p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <Building2 size={18} className="text-slate-400 ml-2" />
              <select
                value={selectedReseller}
                onChange={(e) => setSelectedReseller(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1 pr-8 cursor-pointer outline-none"
              >
                <option value="">Sélectionner un revendeur...</option>
                {mockResellers.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedReseller && (
            <div className="flex justify-end">
              <PeriodFilter
                value={resellerPeriod}
                onChange={setResellerPeriod}
                startDate={resellerStartDate}
                endDate={resellerEndDate}
                onStartDateChange={setResellerStartDate}
                onEndDateChange={setResellerEndDate}
              />
            </div>
          )}
        </div>

        {selectedReseller ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Clients du Revendeur"
              value={resellerStats!.clients}
              subtitle={`Clients actifs sur ${periodLabel(resellerPeriod)}`}
              icon={Users}
            />
            <StatCard
              title="Équipements du Revendeur"
              value={resellerStats!.equipments}
              subtitle={`Total déployé sur ${periodLabel(resellerPeriod)}`}
              icon={Server}
            />
            <StatCard
              title="Équipements Déconnectés"
              value={resellerStats!.disconnected}
              subtitle={`Déconnectés +24h sur ${periodLabel(resellerPeriod)}`}
              icon={WifiOff}
              color="red"
              onClick={() => openDisconnectedModal('reseller')}
            />
            <StatCard
              title="Clients Déconnectés"
              value={resellerStats!.disconnectedClients}
              subtitle={`Comptes clients +24h sur ${periodLabel(resellerPeriod)}`}
              icon={UserX}
              color="red"
              onClick={() => openDisconnectedClientsModal('reseller')}
            />
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">Aucun revendeur sélectionné</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Veuillez sélectionner un revendeur dans le menu déroulant ci-dessus pour afficher ses
              statistiques détaillées.
            </p>
          </div>
        )}
      </section>

      {/* Modal équipements déconnectés */}
      <Modal isOpen={isModalOpen} onClose={closeDisconnectedModal} title={equipmentModalTitle} size="xl">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-red-800">
              Équipements n&apos;ayant pas communiqué avec la plateforme depuis plus de 24 h. Filtrez
              par période selon la <strong>dernière connexion</strong> ({disconnectPeriodLabel}).
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
              <PeriodFilter
                value={disconnectPeriod}
                onChange={setDisconnectPeriod}
                startDate={disconnectStartDate}
                endDate={disconnectEndDate}
                onStartDateChange={setDisconnectStartDate}
                onEndDateChange={setDisconnectEndDate}
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filtrer par client</label>
              <SearchableSelect
                value={disconnectClientFilter}
                onChange={setDisconnectClientFilter}
                options={clientFilterOptions}
                placeholder="Tous les clients"
              />
            </div>
          </div>

          {filteredDisconnected.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="p-3 font-medium">N° Série</th>
                    <th className="p-3 font-medium">Client</th>
                    <th className="p-3 font-medium">Véhicule</th>
                    <th className="p-3 font-medium">Dernière connexion</th>
                    <th className="p-3 font-medium text-right">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDisconnected.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{eq.serial}</td>
                      <td className="p-3 text-slate-600">{eq.client}</td>
                      <td className="p-3 text-slate-600">
                        {eq.vehicle === 'Unassigned' ? (
                          <span className="text-slate-400 italic text-xs">Non assigné</span>
                        ) : (
                          eq.vehicle
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{formatLastConnection(eq.lastSeen)}</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          {eq.duration}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              {disconnectClientFilter
                ? `Aucun équipement déconnecté pour « ${disconnectClientFilter} » sur ${disconnectPeriodLabel}.`
                : `Aucun équipement déconnecté sur ${disconnectPeriodLabel}.`}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal clients déconnectés */}
      <Modal
        isOpen={isDisconnectedClientsModalOpen}
        onClose={() => setIsDisconnectedClientsModalOpen(false)}
        title={clientsModalTitle}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-amber-900">
              Comptes clients sans connexion à la plateforme depuis plus de 24 h. La date affichée
              est la dernière connexion connue du parc client sur la période sélectionnée.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
              <PeriodFilter
                value={disconnectPeriod}
                onChange={setDisconnectPeriod}
                startDate={disconnectStartDate}
                endDate={disconnectEndDate}
                onStartDateChange={setDisconnectStartDate}
                onEndDateChange={setDisconnectEndDate}
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filtrer par client</label>
              <SearchableSelect
                value={disconnectClientFilter}
                onChange={setDisconnectClientFilter}
                options={clientFilterOptions}
                placeholder="Tous les clients"
              />
            </div>
          </div>

          {filteredDisconnectedClientsRows.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="p-3 font-medium">Client</th>
                    <th className="p-3 font-medium">Équipements déconnectés</th>
                    <th className="p-3 font-medium">Dernière connexion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDisconnectedClientsRows.map((row) => (
                    <tr key={row.client} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{row.client}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          {row.disconnectedEquipments}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{formatLastConnection(row.lastConnection)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              {disconnectClientFilter
                ? `Aucun client déconnecté pour « ${disconnectClientFilter} » sur ${disconnectPeriodLabel}.`
                : `Aucun client déconnecté (+24h) sur ${disconnectPeriodLabel}.`}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
