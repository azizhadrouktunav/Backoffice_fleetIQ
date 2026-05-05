import React, { useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PeriodFilter, PeriodKey } from '../components/PeriodFilter';
import { Users, Server, WifiOff, Building2, AlertCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
const mockDisconnectedEquipments = [{
  id: 1,
  serial: 'EQ-2024-002',
  client: 'Global Logistics',
  lastSeen: '2024-03-10 14:30',
  duration: '48h',
  vehicle: 'Unassigned'
}, {
  id: 2,
  serial: 'EQ-2023-156',
  client: 'Transport Express',
  lastSeen: '2024-03-09 09:15',
  duration: '72h',
  vehicle: 'AB-123-CD'
}, {
  id: 3,
  serial: 'EQ-2024-089',
  client: 'Auto Fleet Pro',
  lastSeen: '2024-03-11 08:00',
  duration: '26h',
  vehicle: 'EF-456-GH'
}, {
  id: 4,
  serial: 'EQ-2024-112',
  client: 'Global Logistics',
  lastSeen: '2024-02-28 16:45',
  duration: '312h',
  vehicle: 'IJ-789-KL'
}, {
  id: 5,
  serial: 'EQ-2023-045',
  client: 'Transport Express',
  lastSeen: '2024-03-05 11:20',
  duration: '144h',
  vehicle: 'MN-012-OP'
}];
const mockResellers = [{
  id: 'rev-1',
  name: 'Global Logistics'
}, {
  id: 'rev-2',
  name: 'Auto Fleet Pro'
}, {
  id: 'rev-3',
  name: 'Transport Express'
}];
// Mock stats that vary by period
const tunavStatsByPeriod: Record<PeriodKey, {
  clients: string;
  equipments: string;
  disconnected: string;
  clientsTrend: string;
  eqTrend: string;
}> = {
  today: {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '42',
    clientsTrend: '0.3%',
    eqTrend: '0.1%'
  },
  '7d': {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '128',
    clientsTrend: '2.1%',
    eqTrend: '0.8%'
  },
  '30d': {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '342',
    clientsTrend: '12.5%',
    eqTrend: '2.1%'
  },
  '3m': {
    clients: '1,180',
    equipments: '8,650',
    disconnected: '587',
    clientsTrend: '18.2%',
    eqTrend: '5.4%'
  },
  custom: {
    clients: '1,234',
    equipments: '8,901',
    disconnected: '215',
    clientsTrend: '8.0%',
    eqTrend: '1.5%'
  }
};
const resellerStatsByPeriod: Record<PeriodKey, {
  clients: string;
  equipments: string;
  disconnected: string;
}> = {
  today: {
    clients: '45',
    equipments: '320',
    disconnected: '3'
  },
  '7d': {
    clients: '45',
    equipments: '320',
    disconnected: '8'
  },
  '30d': {
    clients: '45',
    equipments: '320',
    disconnected: '12'
  },
  '3m': {
    clients: '42',
    equipments: '305',
    disconnected: '24'
  },
  custom: {
    clients: '45',
    equipments: '320',
    disconnected: '10'
  }
};
export function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<'tunav' | 'reseller'>('tunav');
  const [selectedReseller, setSelectedReseller] = useState('');
  // Period filters for each section
  const [tunavPeriod, setTunavPeriod] = useState<PeriodKey>('30d');
  const [tunavStartDate, setTunavStartDate] = useState('');
  const [tunavEndDate, setTunavEndDate] = useState('');
  const [resellerPeriod, setResellerPeriod] = useState<PeriodKey>('30d');
  const [resellerStartDate, setResellerStartDate] = useState('');
  const [resellerEndDate, setResellerEndDate] = useState('');
  const tunavStats = tunavStatsByPeriod[tunavPeriod];
  const resellerStats = selectedReseller ? resellerStatsByPeriod[resellerPeriod] : null;
  const openDisconnectedModal = (source: 'tunav' | 'reseller') => {
    setModalSource(source);
    setIsModalOpen(true);
  };
  // Filter disconnected equipments based on modal source
  const filteredDisconnected = modalSource === 'reseller' && selectedReseller ? mockDisconnectedEquipments.filter((eq) => {
    const reseller = mockResellers.find((r) => r.id === selectedReseller);
    return reseller ? eq.client === reseller.name : true;
  }) : mockDisconnectedEquipments;
  const periodLabel = (period: PeriodKey) => {
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
  };
  return <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Tableau de bord
        </h1>
        <div className="text-xs text-slate-500">
          Dernière mise à jour : Aujourd'hui, 10:42
        </div>
      </div>

      {/* Section 1: Dashboard Tunav */}
      <section>
        <div className="mb-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-900">
                Dashboard Tunav
              </h2>
            </div>
            <p className="text-sm text-slate-500 ml-4 mt-1">
              Vue globale de la plateforme et statistiques générales
            </p>
          </div>

          <PeriodFilter value={tunavPeriod} onChange={setTunavPeriod} startDate={tunavStartDate} endDate={tunavEndDate} onStartDateChange={setTunavStartDate} onEndDateChange={setTunavEndDate} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Clients" value={tunavStats.clients} trend={tunavStats.clientsTrend} trendUp={true} subtitle={`Nouveaux clients sur ${periodLabel(tunavPeriod)}`} icon={Users} />
          <StatCard title="Total Équipements" value={tunavStats.equipments} trend={tunavStats.eqTrend} trendUp={true} subtitle={`Équipements déployés sur ${periodLabel(tunavPeriod)}`} icon={Server} />
          <StatCard title="Équipements Déconnectés" value={tunavStats.disconnected} subtitle={`Déconnectés +24h sur ${periodLabel(tunavPeriod)}`} icon={WifiOff} color="red" onClick={() => openDisconnectedModal('tunav')} />
        </div>
      </section>

      {/* Section 2: Dashboard Revendeurs */}
      <section className="pt-6 border-t border-slate-200">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Dashboard Revendeurs
                </h2>
              </div>
              <p className="text-sm text-slate-500 ml-4 mt-1">
                Statistiques détaillées par revendeur
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <Building2 size={18} className="text-slate-400 ml-2" />
              <select value={selectedReseller} onChange={(e) => setSelectedReseller(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 py-1 pr-8 cursor-pointer outline-none">
                <option value="">Sélectionner un revendeur...</option>
                {mockResellers.map((rev) => <option key={rev.id} value={rev.id}>
                    {rev.name}
                  </option>)}
              </select>
            </div>
          </div>

          {selectedReseller && <div className="flex justify-end">
              <PeriodFilter value={resellerPeriod} onChange={setResellerPeriod} startDate={resellerStartDate} endDate={resellerEndDate} onStartDateChange={setResellerStartDate} onEndDateChange={setResellerEndDate} />
            </div>}
        </div>

        {selectedReseller ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Clients du Revendeur" value={resellerStats!.clients} subtitle={`Clients actifs sur ${periodLabel(resellerPeriod)}`} icon={Users} />
            <StatCard title="Équipements du Revendeur" value={resellerStats!.equipments} subtitle={`Total déployé sur ${periodLabel(resellerPeriod)}`} icon={Server} />
            <StatCard title="Équipements Déconnectés" value={resellerStats!.disconnected} subtitle={`Déconnectés +24h sur ${periodLabel(resellerPeriod)}`} icon={WifiOff} color="red" onClick={() => openDisconnectedModal('reseller')} />
          </div> : <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">
              Aucun revendeur sélectionné
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Veuillez sélectionner un revendeur dans le menu déroulant
              ci-dessus pour afficher ses statistiques détaillées.
            </p>
          </div>}
      </section>

      {/* Modal for Disconnected Equipments */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalSource === 'reseller' && selectedReseller ? `Équipements Déconnectés — ${mockResellers.find((r) => r.id === selectedReseller)?.name}` : 'Équipements Déconnectés (+24h)'} size="xl">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-red-800">
              Cette liste affiche les équipements n'ayant pas communiqué avec le
              serveur depuis plus de 24 heures sur{' '}
              <strong>
                {modalSource === 'tunav' ? periodLabel(tunavPeriod) : periodLabel(resellerPeriod)}
              </strong>
              . Une intervention peut être nécessaire.
            </p>
          </div>

          {filteredDisconnected.length > 0 ? <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
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
                  {filteredDisconnected.map((eq) => <tr key={eq.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">
                        {eq.serial}
                      </td>
                      <td className="p-3 text-slate-600">{eq.client}</td>
                      <td className="p-3 text-slate-600">
                        {eq.vehicle === 'Unassigned' ? <span className="text-slate-400 italic text-xs">
                            Non assigné
                          </span> : eq.vehicle}
                      </td>
                      <td className="p-3 text-slate-600">{eq.lastSeen}</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          {eq.duration}
                        </span>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div> : <div className="text-center py-8 text-slate-500 text-sm">
              Aucun équipement déconnecté trouvé pour ce revendeur.
            </div>}
        </div>
      </Modal>
    </div>;
}