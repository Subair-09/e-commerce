import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Database, 
  Cloud, 
  LayoutDashboard, 
  KeyRound, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Crown,
  Server,
  Layers
} from 'lucide-react';
import { User } from '../types';
import { loginAdmin, clearSession, MASTER_ADMIN_EMAIL, MASTER_ADMIN_DEFAULT_PASSWORD, isUserAdmin } from '../services/authService';

interface AdminLoginSectionProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onOpenMongoDatabase: () => void;
  onOpenAzureStorage: () => void;
  onOpenCustomerDashboard: (tab?: string) => void;
  onOpenAdminDashboard?: () => void;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info' | 'cart' | 'wishlist') => void;
}

export const AdminLoginSection: React.FC<AdminLoginSectionProps> = ({
  currentUser,
  onUserChange,
  onOpenMongoDatabase,
  onOpenAzureStorage,
  onOpenCustomerDashboard,
  onOpenAdminDashboard,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = isUserAdmin(currentUser);

  const handleFillCredentials = () => {
    setEmail(MASTER_ADMIN_EMAIL);
    setPassword(MASTER_ADMIN_DEFAULT_PASSWORD);
    setErrorMsg('');
    onShowToast('Credentials Filled', `Autofilled ${MASTER_ADMIN_EMAIL} credentials for instant admin authorization.`, 'info');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both administrative email and password.');
      return;
    }

    if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg(`Access Restricted: Only ${MASTER_ADMIN_EMAIL} is authorized as an administrator.`);
      onShowToast('Access Denied', `Only ${MASTER_ADMIN_EMAIL} has administrative privileges.`, 'info');
      return;
    }

    setLoading(true);

    try {
      const res = await loginAdmin(cleanEmail, password);
      if (res.success && res.user) {
        onUserChange(res.user);
        setPassword('');
        setErrorMsg('');
        onShowToast('Admin Authenticated!', `Welcome Master Administrator, ${res.user.name}.`, 'success');
        if (onOpenAdminDashboard) {
          onOpenAdminDashboard();
        }
      } else {
        setErrorMsg(res.error || 'Invalid administrator password.');
        onShowToast('Admin Authentication Failed', res.error || 'Please check your admin credentials.', 'info');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Administrative authentication service failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignOut = () => {
    clearSession();
    onUserChange(null);
    onShowToast('Admin Signed Out', 'Administrative session closed securely.', 'info');
  };

  return (
    <section id="admin-portal" className="py-12 bg-gradient-to-b from-[#0F172A] to-[#020617] text-white border-t border-b border-slate-800 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ED64]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0078D4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 relative z-10">
        
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[#00ED64] shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#00ED64] uppercase">
                  AURA Security Suite
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-700/50">
                  Role: Master Admin
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Administrative Control Gateway
              </h2>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized Administrator: <strong className="text-white font-mono">{MASTER_ADMIN_EMAIL}</strong> only</span>
          </div>
        </div>

        {/* If Logged in as Admin: Show Command Center */}
        {isAdmin ? (
          <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Subair%20Nurudeen&backgroundColor=001E2B&textColor=00ED64`}
                    alt="Admin Avatar"
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-950 border-2 border-[#00ED64]"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#00ED64] text-black p-1 rounded-full shadow-md">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{currentUser?.name}</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-[#00ED64] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                      SUPERADMIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser?.email}</p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
                    Full Master Admin Privileges Active • MongoDB & Azure Integrated
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onOpenAdminDashboard && (
                  <button
                    onClick={onOpenAdminDashboard}
                    className="px-5 py-2.5 bg-[#00ED64] hover:bg-[#00c954] text-[#001E2B] text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00ED64]/20"
                    id="btn-launch-admin-dashboard-page"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Launch Admin Dashboard (4 Tabs)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleAdminSignOut}
                  className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white text-xs font-bold rounded-xl border border-red-800/60 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  id="admin-section-signout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit Admin Mode</span>
                </button>
              </div>
            </div>

            {/* Admin Command Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {/* MongoDB Card */}
              <div 
                onClick={onOpenMongoDatabase}
                className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4.5 cursor-pointer transition-all group hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/80 text-[#00ED64] flex items-center justify-center border border-emerald-800/60">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded">
                    Database CRUD
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#00ED64] transition-colors">
                  MongoDB Atlas Hub
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Manage products, inspect collections, trigger seed data & export logs.
                </p>
              </div>

              {/* Azure Storage Card */}
              <div 
                onClick={onOpenAzureStorage}
                className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4.5 cursor-pointer transition-all group hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-950/80 text-[#0078D4] flex items-center justify-center border border-blue-800/60">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-blue-950 text-blue-300 font-mono px-2 py-0.5 rounded">
                    Blob Storage
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#0078D4] transition-colors">
                  Azure Cloud Storage
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Upload media assets, sync catalog snapshots & explore containers.
                </p>
              </div>

              {/* Customer Dashboard / Orders Card */}
              <div 
                onClick={() => onOpenCustomerDashboard('orders')}
                className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl p-4.5 cursor-pointer transition-all group hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-950/80 text-purple-400 flex items-center justify-center border border-purple-800/60">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-purple-950 text-purple-300 font-mono px-2 py-0.5 rounded">
                    Orders Pipeline
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Customer & Orders Portal
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  View customer orders, live shipping status, VIP tiers & order history.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* When NOT logged in as Admin: Show the Landing Page Admin Sign In Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-[#00ED64] px-3 py-1 rounded-full text-xs font-mono border border-emerald-800/60">
                <Crown className="w-3.5 h-3.5" />
                <span>Single Authorized Administrator</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sign In to AURA <br className="hidden sm:inline" />
                Admin Console
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Administrative access is strictly restricted to <strong className="text-white">{MASTER_ADMIN_EMAIL}</strong> with full authority over MongoDB collections, product catalogs, Azure blob storage, and customer orders.
              </p>

              {/* Quick Fill Preset Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Admin Master Account
                  </span>
                  <p className="text-xs font-mono text-emerald-400 font-bold mt-0.5">
                    {MASTER_ADMIN_EMAIL}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillCredentials}
                  className="px-3.5 py-1.5 bg-[#00ED64] hover:bg-[#00c552] text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                  id="admin-autofill-btn"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Autofill Credentials</span>
                </button>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#00ED64] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Administrator Credentials</h4>
                    <p className="text-[11px] text-slate-400">Enter your authorized email and master key</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
                  PBKDF2 SHA-512
                </span>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Admin Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={MASTER_ADMIN_EMAIL}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ED64] transition-all font-mono"
                      required
                      id="admin-landing-email-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Master Password <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Default: {MASTER_ADMIN_DEFAULT_PASSWORD}</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ED64] transition-all font-mono"
                      required
                      id="admin-landing-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#00ED64] hover:bg-[#00c552] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg mt-2 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  id="admin-landing-submit-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <span>Authenticate Master Administrator</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
