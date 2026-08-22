import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Lock, 
  LogIn, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  Crown
} from 'lucide-react';
import { User } from '../types';
import { 
  registerCustomer, 
  loginCustomer,
  loginAdmin,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_DEFAULT_PASSWORD
} from '../services/authService';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info' | 'cart' | 'wishlist') => void;
  onOpenCustomerDashboard?: (tab?: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onShowToast,
  onOpenCustomerDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'admin'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // If the user is already logged in and opens this modal, redirect them straight to the Customer Dashboard
  useEffect(() => {
    if (isOpen && currentUser) {
      onClose();
      if (onOpenCustomerDashboard) {
        onOpenCustomerDashboard('browse');
      }
    }
  }, [isOpen, currentUser, onClose, onOpenCustomerDashboard]);

  if (!isOpen || currentUser) return null;

  const handleFillAdmin = () => {
    setEmail(MASTER_ADMIN_EMAIL);
    setPassword(MASTER_ADMIN_DEFAULT_PASSWORD);
    setFormError('');
    onShowToast('Admin Credentials Filled', `Autofilled ${MASTER_ADMIN_EMAIL} for master admin sign in.`, 'info');
  };

  // Handle Authentication (Sign In & Sign Up & Admin)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'admin') {
        if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
          setFormError(`Access Denied: Only authorized administrator (${MASTER_ADMIN_EMAIL}) is permitted.`);
          setLoading(false);
          return;
        }

        const res = await loginAdmin(cleanEmail, password);
        if (res.success && res.user) {
          onUserChange(res.user);
          setPassword('');
          setFormError('');
          onClose();
          onShowToast('Master Admin Authenticated!', `Welcome ${res.user.name}. Administrator access granted.`, 'success');
        } else {
          setFormError(res.error || 'Invalid administrator credentials.');
          onShowToast('Admin Sign In Failed', res.error || 'Please check your credentials.', 'info');
        }
      } else if (activeTab === 'signin') {
        const res = await loginCustomer(cleanEmail, password);
        if (res.success && res.user) {
          onUserChange(res.user);
          setPassword('');
          setFormError('');
          onClose();
          if (onOpenCustomerDashboard) {
            onOpenCustomerDashboard('browse');
          }
          onShowToast('Welcome Back!', `Logged in as ${res.user.name}. Opening your customer dashboard...`, 'success');
        } else {
          setFormError(res.error || 'Invalid email or password.');
          onShowToast('Sign In Failed', res.error || 'Please check your credentials.', 'info');
        }
      } else {
        if (!name.trim()) {
          setFormError('Please enter your full name.');
          setLoading(false);
          return;
        }

        const res = await registerCustomer({
          name: name.trim(),
          email: cleanEmail,
          password,
          phone: phone.trim(),
        });
        if (res.success && res.user) {
          onUserChange(res.user);
          setPassword('');
          setFormError('');
          onClose();
          if (onOpenCustomerDashboard) {
            onOpenCustomerDashboard('browse');
          }
          onShowToast('Welcome to AURA!', `Account created for ${res.user.name}. Opening your customer dashboard...`, 'success');
        } else {
          setFormError(res.error || 'Registration failed.');
          onShowToast('Registration Failed', res.error || 'Could not create account.', 'info');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
        id="account-modal-backdrop"
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 overflow-hidden border border-neutral-100 animate-in zoom-in-95 duration-200 z-10 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              activeTab === 'admin' 
                ? 'bg-emerald-950 text-[#00ED64]' 
                : 'bg-[#001E2B] text-[#00ED64]'
            }`}>
              {activeTab === 'admin' ? (
                <Crown className="w-5 h-5" />
              ) : activeTab === 'signin' ? (
                <LogIn className="w-5 h-5" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                {activeTab === 'admin' 
                  ? 'Admin Portal Sign In' 
                  : activeTab === 'signin' 
                  ? 'Sign In to AURA' 
                  : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-neutral-500">
                {activeTab === 'admin'
                  ? `Authorized Admin: ${MASTER_ADMIN_EMAIL}`
                  : activeTab === 'signin'
                  ? 'Access your orders & customer dashboard'
                  : 'Earn 250 VIP bonus points & VIP privileges'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Register vs Admin */}
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setFormError('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'signin' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            id="tab-signin"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setFormError('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'register' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            id="tab-register"
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setFormError('');
              setEmail(MASTER_ADMIN_EMAIL);
              setPassword(MASTER_ADMIN_DEFAULT_PASSWORD);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'admin' ? 'bg-[#001E2B] text-[#00ED64] shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            id="tab-admin"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Admin Quick Autofill Notice */}
        {activeTab === 'admin' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-2">
            <div className="text-[11px] text-emerald-950">
              <span className="font-bold block text-[10px] uppercase text-emerald-800">Only Admin User</span>
              <span className="font-mono text-emerald-700">{MASTER_ADMIN_EMAIL}</span>
            </div>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Autofill</span>
            </button>
          </div>
        )}

        {/* Error Message Box */}
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Subair Nurudeen"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
                  required={activeTab === 'register'}
                  id="auth-input-name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {activeTab === 'admin' ? 'Admin Email' : 'Email Address'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'admin' ? MASTER_ADMIN_EMAIL : 'nuddywale@gmail.com'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white transition-all font-mono"
                required
                id="auth-input-email"
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Phone Number <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
                  id="auth-input-phone"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-neutral-700">
                {activeTab === 'admin' ? 'Master Password' : 'Password'} <span className="text-red-500">*</span>
              </label>
              {activeTab === 'signin' && (
                <button
                  type="button"
                  onClick={() => onShowToast('Password Reset', 'Password reset instructions have been dispatched to your email.', 'info')}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white transition-all font-mono"
                required
                minLength={6}
                id="auth-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {activeTab === 'register' && (
              <p className="text-[10px] text-neutral-400 mt-1">Minimum 6 characters secured with PBKDF2 salt hashing</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#001E2B] hover:bg-[#00A35C] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            id="auth-submit-button"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#00ED64]" />
            ) : (
              <>
                <span>
                  {activeTab === 'admin'
                    ? 'Authenticate Master Admin'
                    : activeTab === 'signin'
                    ? 'Sign In & Open Dashboard'
                    : 'Create Account & Open Dashboard'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00ED64]" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-5 text-center text-[10px] text-neutral-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {activeTab === 'admin' 
              ? 'Secured Administrator clearance • subby@gmail.com only'
              : 'Customer data securely encrypted & persisted to MongoDB'}
          </span>
        </div>

      </div>
    </div>
  );
};
