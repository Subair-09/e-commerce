import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Crown,
  KeyRound
} from 'lucide-react';
import { User } from '../types';
import { loginAdmin, MASTER_ADMIN_EMAIL, MASTER_ADMIN_DEFAULT_PASSWORD } from '../services/authService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info' | 'cart' | 'wishlist') => void;
  onOpenMongoDatabase?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onShowToast,
  onOpenMongoDatabase,
  onOpenAdminDashboard,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFillCredentials = () => {
    setEmail(MASTER_ADMIN_EMAIL);
    setPassword(MASTER_ADMIN_DEFAULT_PASSWORD);
    setErrorMsg('');
    onShowToast('Credentials Filled', `Autofilled ${MASTER_ADMIN_EMAIL} credentials.`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both administrative email and password.');
      return;
    }

    if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg(`Access Denied: Only ${MASTER_ADMIN_EMAIL} is authorized as an administrator.`);
      onShowToast('Access Denied', `Only ${MASTER_ADMIN_EMAIL} has administrator authorization.`, 'info');
      return;
    }

    setLoading(true);

    try {
      const res = await loginAdmin(cleanEmail, password);
      if (res.success && res.user) {
        onUserChange(res.user);
        setPassword('');
        setErrorMsg('');
        onClose();
        onShowToast('Admin Authenticated!', `Welcome back, Master Administrator ${res.user.name}.`, 'success');
        if (onOpenAdminDashboard) {
          onOpenAdminDashboard();
        }
      } else {
        setErrorMsg(res.error || 'Invalid administrator password.');
        onShowToast('Admin Authentication Failed', res.error || 'Please check your credentials.', 'info');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Administrative authentication service failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
        id="admin-modal-backdrop"
      />

      <div className="relative bg-[#0F172A] text-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 overflow-hidden border border-slate-700/80 animate-in zoom-in-95 duration-200 z-10 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-[#00ED64] flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black text-white">
                  Admin Sign In
                </h3>
                <span className="text-[9px] bg-emerald-950 text-[#00ED64] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-700/40">
                  RESTRICTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single master administrator access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fill Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-5 flex items-center justify-between gap-2 shadow-inner">
          <div className="text-[11px] text-slate-300">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Authorized Admin</span>
            <span className="font-mono text-emerald-400 font-bold">{MASTER_ADMIN_EMAIL}</span>
          </div>
          <button
            type="button"
            onClick={handleFillCredentials}
            className="px-2.5 py-1.5 bg-[#00ED64] hover:bg-[#00c552] text-slate-950 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            id="admin-modal-autofill-btn"
          >
            <Sparkles className="w-3 h-3" />
            <span>Fill Credentials</span>
          </button>
        </div>

        {/* Error Message Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ED64] font-mono transition-all"
                required
                id="admin-modal-input-email"
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ED64] font-mono transition-all"
                required
                id="admin-modal-input-password"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00ED64] hover:bg-[#00c552] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md mt-2 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            id="admin-modal-submit-button"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Sign In as Master Administrator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-5 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict Access Control: Only subby@gmail.com is authorized as Admin</span>
        </div>

      </div>
    </div>
  );
};
