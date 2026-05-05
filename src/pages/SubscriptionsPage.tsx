import React, { useState } from 'react';
import {
  Search,
  Edit2,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Users,
  Ban,
  CheckCircle2 } from
'lucide-react';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
const PLANS = [
'FleetIQ Secure',
'FleetIQ Pro',
'FleetIQ Mechanic',
'FleetIQ Vision'] as
const;
type PlanType = (typeof PLANS)[number];
interface ClientSubscription {
  id: number;
  name: string;
  type: string;
  email: string;
  tel: string;
  plan: PlanType | '';
  expiry: string;
  status: 'Active' | 'Blocked';
}
const initialClients: ClientSubscription[] = [
{
  id: 1,
  name: 'Transport Express',
  type: 'Simple',
  email: 'contact@texpress.fr',
  tel: '+33 1 23 45 67 89',
  plan: 'FleetIQ Pro',
  expiry: '2025-12-31',
  status: 'Active'
},
{
  id: 2,
  name: 'Global Logistics',
  type: 'Revendeur',
  email: 'admin@glogistics.com',
  tel: '+33 4 56 78 90 12',
  plan: 'FleetIQ Secure',
  expiry: '2026-06-30',
  status: 'Active'
},
{
  id: 3,
  name: 'Livraison Rapide',
  type: 'Simple',
  email: 'hello@lrapide.fr',
  tel: '+33 6 12 34 56 78',
  plan: 'FleetIQ Mechanic',
  expiry: '2024-10-15',
  status: 'Blocked'
},
{
  id: 4,
  name: 'Auto Fleet Pro',
  type: 'Revendeur',
  email: 'contact@autofleet.pro',
  tel: '+33 9 87 65 43 21',
  plan: '',
  expiry: '2025-01-01',
  status: 'Active'
}];

const planColors: Record<string, string> = {
  'FleetIQ Secure': 'bg-blue-100 text-blue-700',
  'FleetIQ Pro': 'bg-indigo-100 text-indigo-700',
  'FleetIQ Mechanic': 'bg-amber-100 text-amber-700',
  'FleetIQ Vision': 'bg-emerald-100 text-emerald-700'
};
export function SubscriptionsPage() {
  const [clients, setClients] = useState<ClientSubscription[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  // Assign subscription modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [clientToAssign, setClientToAssign] =
  useState<ClientSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | ''>('');
  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientForPayment, setClientForPayment] =
  useState<ClientSubscription | null>(null);
  const [newExpiry, setNewExpiry] = useState('');
  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const blockedClients = clients.filter((c) => c.status === 'Blocked').length;
  const subscribedClients = clients.filter((c) => c.plan !== '').length;
  // Filtering
  const filteredClients = clients.filter((client) => {
    return (
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()));

  });
  // Handlers
  const openAssignModal = (client: ClientSubscription) => {
    setClientToAssign(client);
    setSelectedPlan(client.plan || '');
    setIsAssignModalOpen(true);
  };
  const handleAssignPlan = () => {
    if (!clientToAssign) return;
    setClients((prev) =>
    prev.map((c) =>
    c.id === clientToAssign.id ?
    {
      ...c,
      plan: selectedPlan
    } :
    c
    )
    );
    setIsAssignModalOpen(false);
  };
  const openPaymentModal = (client: ClientSubscription) => {
    setClientForPayment(client);
    setNewExpiry(client.expiry);
    setIsPaymentModalOpen(true);
  };
  const handleValidatePayment = () => {
    if (!clientForPayment) return;
    setClients((prev) =>
    prev.map((c) =>
    c.id === clientForPayment.id ?
    {
      ...c,
      expiry: newExpiry,
      status: 'Active'
    } :
    c
    )
    );
    setIsPaymentModalOpen(false);
  };
  const handleBlockClient = () => {
    if (!clientForPayment) return;
    setClients((prev) =>
    prev.map((c) =>
    c.id === clientForPayment.id ?
    {
      ...c,
      status: 'Blocked'
    } :
    c
    )
    );
    setIsPaymentModalOpen(false);
  };
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Gestion des Abonnements
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={totalClients.toString()}
          subtitle="Clients enregistrés"
          icon={Users} />
        
        <StatCard
          title="Clients Actifs"
          value={activeClients.toString()}
          trend={`${Math.round(activeClients / totalClients * 100)}%`}
          trendUp={true}
          subtitle="Taux d'activité"
          icon={TrendingUp} />
        
        <StatCard
          title="Clients Bloqués"
          value={blockedClients.toString()}
          trend={`${Math.round(blockedClients / totalClients * 100)}%`}
          trendUp={false}
          subtitle="Nécessite attention"
          icon={AlertCircle} />
        
        <StatCard
          title="Abonnés"
          value={subscribedClients.toString()}
          trend={`${Math.round(subscribedClients / totalClients * 100)}%`}
          trendUp={true}
          subtitle="Clients avec abonnement"
          icon={CreditCard} />
        
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16} />
            
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow" />
            
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide bg-slate-50/50">
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Abonnement</th>
                <th className="p-4 font-medium">Date d'expiration</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filteredClients.map((client) =>
              <tr
                key={client.id}
                className="hover:bg-slate-50 transition-colors">
                
                  <td className="p-4">
                    <div className="font-medium text-slate-900">
                      {client.name}
                    </div>
                    <div className="text-slate-500 text-xs">{client.email}</div>
                  </td>
                  <td className="p-4">
                    {client.plan ?
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${planColors[client.plan] || 'bg-slate-100 text-slate-600'}`}>
                    
                        {client.plan}
                      </span> :

                  <span className="text-slate-400 italic text-xs">
                        Non affecté
                      </span>
                  }
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(client.expiry).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4">
                    <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${client.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
                    
                      <span
                      className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    </span>
                      {client.status === 'Active' ? 'Actif' : 'Bloqué'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                      onClick={() => openAssignModal(client)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Affecter un abonnement">
                      
                        <Edit2 size={16} />
                      </button>
                      <button
                      onClick={() => openPaymentModal(client)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      title="Valider le paiement">
                      
                        <CreditCard size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredClients.length === 0 &&
              <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun client trouvé.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ASSIGN SUBSCRIPTION MODAL --- */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Abonnement — ${clientToAssign?.name}`}
        size="md">
        
        <div className="space-y-5">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <CreditCard className="shrink-0 mt-0.5" size={16} />
            <p>
              Sélectionnez le type d'abonnement à affecter au client{' '}
              <strong>{clientToAssign?.name}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type d'abonnement
            </label>
            <div className="space-y-2">
              {PLANS.map((plan) =>
              <label
                key={plan}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedPlan === plan ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                
                  <input
                  type="radio"
                  name="plan"
                  checked={selectedPlan === plan}
                  onChange={() => setSelectedPlan(plan)}
                  className="text-blue-600 focus:ring-blue-500 border-slate-300" />
                
                  <div className="flex items-center gap-2">
                    <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${planColors[plan]}`}>
                    
                      {plan}
                    </span>
                  </div>
                  {selectedPlan === plan &&
                <CheckCircle2
                  size={16}
                  className="text-blue-600 ml-auto shrink-0" />

                }
                </label>
              )}
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedPlan === '' ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                
                <input
                  type="radio"
                  name="plan"
                  checked={selectedPlan === ''}
                  onChange={() => setSelectedPlan('')}
                  className="text-slate-600 focus:ring-slate-500 border-slate-300" />
                
                <span className="text-sm text-slate-500 italic">
                  Aucun abonnement
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              
              Annuler
            </button>
            <button
              onClick={handleAssignPlan}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* --- PAYMENT VALIDATION MODAL --- */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Paiement — ${clientForPayment?.name}`}
        size="md">
        
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-3">
            <CreditCard className="shrink-0 mt-0.5" size={16} />
            <p>
              Date d'expiration actuelle :{' '}
              <strong>
                {clientForPayment?.expiry ?
                new Date(clientForPayment.expiry).toLocaleDateString(
                  'fr-FR'
                ) :
                '-'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Statut actuel :</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${clientForPayment?.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
              
              <span
                className={`w-1.5 h-1.5 rounded-full ${clientForPayment?.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              </span>
              {clientForPayment?.status === 'Active' ? 'Actif' : 'Bloqué'}
            </span>
          </div>

          {clientForPayment?.plan &&
          <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Abonnement :</span>
              <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${planColors[clientForPayment.plan] || 'bg-slate-100 text-slate-600'}`}>
              
                {clientForPayment.plan}
              </span>
            </div>
          }

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nouvelle date d'expiration
            </label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow" />
            
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBlockClient}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2">
              
              <Ban size={14} />
              Bloquer
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                
                Annuler
              </button>
              <button
                onClick={handleValidatePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>);

}