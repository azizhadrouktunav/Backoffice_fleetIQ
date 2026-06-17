import React, { useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Wrench,
  Store,
  ShieldCheck,
  Wallet,
  ChevronDown
} from 'lucide-react';
import { useFleetStore } from '../state/FleetStore';
import type { BackofficeRole } from '../utils/backofficePermissions';

export type { BackofficeRole };

interface RoleDefinition {
  id: BackofficeRole;
  label: string;
  sublabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accent: string;
  glow: string;
}

const ROLES: RoleDefinition[] = [
  {
    id: 'admin_tunav',
    label: 'Admin TUNAV',
    sublabel: 'Administration globale',
    description: 'Gestion complète de la plateforme et des accès',
    icon: ShieldCheck,
    gradient: 'from-cyan-500 to-blue-600',
    accent: 'text-cyan-300',
    glow: 'shadow-cyan-500/40'
  },
  {
    id: 'responsable_sav',
    label: 'Responsable SAV',
    sublabel: 'Service Après-Vente',
    description: 'Gestion complète sauf validation des paiements',
    icon: Wrench,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-300',
    glow: 'shadow-emerald-500/40'
  },
  {
    id: 'technicien_sav',
    label: 'Technicien SAV',
    sublabel: 'Installation terrain',
    description: 'Consultation clients et installation des équipements',
    icon: Wrench,
    gradient: 'from-lime-500 to-green-600',
    accent: 'text-lime-300',
    glow: 'shadow-lime-500/40'
  },
  {
    id: 'revendeur',
    label: 'Revendeur',
    sublabel: 'Espace partenaire',
    description: 'Gestion des clients et des abonnements revendus',
    icon: Store,
    gradient: 'from-amber-500 to-orange-600',
    accent: 'text-amber-300',
    glow: 'shadow-amber-500/40'
  },
  {
    id: 'finance_tunav',
    label: 'Service Financier TUNAV',
    sublabel: 'Finance & facturation',
    description: 'Suivi des paiements, factures et comptabilité',
    icon: Wallet,
    gradient: 'from-fuchsia-500 to-purple-600',
    accent: 'text-fuchsia-300',
    glow: 'shadow-fuchsia-500/40'
  }
];

export interface LoginContext {
  role: BackofficeRole;
  userName: string;
}

interface LoginPageProps {
  onLogin: (ctx: LoginContext) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { clients, setCurrentUserRole, setCurrentUserName, setBackofficeRole } = useFleetStore();

  const resellers = useMemo(
    () =>
      clients
        .filter((c) => c.type === 'Revendeur' && c.name !== 'Tunav' && !c.name.endsWith('_Stock'))
        .map((c) => c.name)
        .sort((a, b) => a.localeCompare(b)),
    [clients]
  );

  const [selectedRole, setSelectedRole] = useState<BackofficeRole>('admin_tunav');
  const [selectedReseller, setSelectedReseller] = useState<string>(resellers[0] ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const currentRole = ROLES.find((r) => r.id === selectedRole) ?? ROLES[0];
  const isReseller = selectedRole === 'revendeur';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (isReseller && !selectedReseller) {
      setError('Veuillez sélectionner un revendeur');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const storeRole = isReseller ? 'Revendeur' : 'Tunav';
      const userName = isReseller ? selectedReseller : 'Tunav';
      setCurrentUserRole(storeRole);
      setCurrentUserName(userName);
      setBackofficeRole(selectedRole);
      setIsLoading(false);
      onLogin({ role: selectedRole, userName });
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop">
          <source
            src="https://cdn.coverr.co/videos/coverr-aerial-view-of-city-at-night-1573/1080p.mp4"
            type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95" />
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
              animation: 'gridMove 20s linear infinite'
            }} />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-100px) scale(1.5); opacity: 0.8; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.6); }
        }
        @keyframes avatar-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 w-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Side - Branding & Avatar */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-6">
              <div className="inline-block bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <img src="/tunav_logo.png" alt="TUNAV Logo" className="h-16 lg:h-20 w-auto" />
              </div>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Back-Office FleetIQ
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Technology{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Powered
                </span>
                <br />
                By Intelligence
              </h1>
              <p className="text-slate-300 text-lg lg:text-xl max-w-md mx-auto lg:mx-0">
                Plateforme d'administration et de gestion de la flotte TUNAV
              </p>
            </div>

            <div className="hidden lg:block">
              <div
                className="relative inline-block"
                style={{ animation: 'avatar-float 3s ease-in-out infinite' }}>
                <img src="/image_(1).png" alt="TUNAVI Assistant" className="h-56 w-auto drop-shadow-2xl" />
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2 shadow-xl">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm font-medium">Bienvenue !</span>
                  </div>
                  <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white transform rotate-45" />
                </div>
              </div>
            </div>

            <div className="lg:hidden mb-6">
              <img
                src="/image_(1).png"
                alt="TUNAVI Assistant"
                className="h-32 w-auto mx-auto drop-shadow-xl"
                style={{ animation: 'avatar-float 3s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-lg">
            <div
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-7 lg:p-8 shadow-2xl"
              style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Connexion Back-Office</h2>
                <p className="text-slate-300 text-sm">Sélectionnez votre profil pour vous connecter</p>
              </div>

              {/* Role selector */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = role.id === selectedRole;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`group relative text-left rounded-xl p-3 border transition-all duration-300 ${
                        isActive
                          ? `bg-white/15 border-white/40 shadow-lg ${role.glow} scale-[1.02]`
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-white text-xs font-semibold leading-tight truncate">
                            {role.label}
                          </div>
                          <div className="text-slate-400 text-[10px] leading-tight truncate">
                            {role.sublabel}
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected role indicator */}
              <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentRole.gradient} flex items-center justify-center flex-shrink-0`}>
                    <currentRole.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold ${currentRole.accent}`}>Connexion en tant que</div>
                    <div className="text-white text-sm font-medium truncate">
                      {isReseller && selectedReseller ? `${currentRole.label} — ${selectedReseller}` : currentRole.label}
                    </div>
                    <div className="text-slate-400 text-xs truncate">{currentRole.description}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center backdrop-blur-sm">
                    {error}
                  </div>
                )}

                {/* Reseller picker (only for Revendeur role) */}
                {isReseller && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200 ml-1">Revendeur</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Store className="h-5 w-5 text-amber-300" />
                      </div>
                      <select
                        value={selectedReseller}
                        onChange={(e) => setSelectedReseller(e.target.value)}
                        className="block w-full appearance-none pl-12 pr-10 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 focus:bg-white/10 transition-all duration-300">
                        {resellers.length === 0 && <option value="">Aucun revendeur disponible</option>}
                        {resellers.map((r) => (
                          <option key={r} value={r} className="bg-slate-900 text-white">
                            {r}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200 ml-1">Adresse email</label>
                    <div className={`relative transition-all duration-300 ${isFocused === 'email' ? 'scale-[1.02]' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={`h-5 w-5 transition-colors duration-300 ${isFocused === 'email' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsFocused('email')}
                        onBlur={() => setIsFocused(null)}
                        className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:bg-white/10 transition-all duration-300"
                        placeholder={isReseller ? 'admin@revendeur.com' : 'nom@tunav.com'}
                        required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200 ml-1">Mot de passe</label>
                    <div className={`relative transition-all duration-300 ${isFocused === 'password' ? 'scale-[1.02]' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`h-5 w-5 transition-colors duration-300 ${isFocused === 'password' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsFocused('password')}
                        onBlur={() => setIsFocused(null)}
                        className="block w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:bg-white/10 transition-all duration-300"
                        placeholder="••••••••"
                        required />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Mot de passe oublié ?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center py-3.5 px-6 bg-gradient-to-r ${currentRole.gradient} hover:brightness-110 text-white font-semibold rounded-xl shadow-lg ${currentRole.glow} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-cyan-500 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}>
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-5 text-center">
              <p className="text-slate-400 text-xs">
                &copy; {new Date().getFullYear()} TUNAV IT Group. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
