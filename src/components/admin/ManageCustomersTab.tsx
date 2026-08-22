import React, { useState, useMemo } from 'react';
import { AdminCustomerSummary } from '../../types';
import { 
  Users, 
  Search, 
  Crown, 
  Award, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  ShoppingBag, 
  DollarSign, 
  Edit3, 
  Check, 
  X, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface ManageCustomersTabProps {
  customers: AdminCustomerSummary[];
  onUpdateCustomer: (id: string, updates: Partial<AdminCustomerSummary>) => Promise<void>;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info') => void;
}

export const ManageCustomersTab: React.FC<ManageCustomersTabProps> = ({
  customers,
  onUpdateCustomer,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerSummary | null>(null);
  
  // Edit modal state
  const [editingPoints, setEditingPoints] = useState('');
  const [editingTier, setEditingTier] = useState<'Bronze' | 'Silver' | 'Gold' | 'Platinum'>('Bronze');
  const [editingStatus, setEditingStatus] = useState<'active' | 'suspended' | 'vip'>('active');
  const [saving, setSaving] = useState(false);

  // Statistics
  const totalCustomers = customers.length;
  const vipCount = customers.filter((c) => c.vipTier === 'Platinum' || c.vipTier === 'Gold').length;
  const totalCustomerSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgSpend = totalCustomers > 0 ? Math.round(totalCustomerSpend / totalCustomers) : 0;

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery));
      const matchTier = tierFilter === 'all' || c.vipTier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [customers, searchQuery, tierFilter]);

  const handleOpenEdit = (customer: AdminCustomerSummary) => {
    setSelectedCustomer(customer);
    setEditingPoints(customer.vipPoints.toString());
    setEditingTier(customer.vipTier);
    setEditingStatus(customer.status || 'active');
  };

  const handleSaveCustomerUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSaving(true);
    try {
      await onUpdateCustomer(selectedCustomer.id, {
        vipPoints: parseInt(editingPoints, 10) || 0,
        vipTier: editingTier,
        status: editingStatus,
      });
      onShowToast('Customer Updated', `Updated account and VIP balance for ${selectedCustomer.name}.`, 'success');
      setSelectedCustomer(null);
    } finally {
      setSaving(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-200 to-indigo-200 text-slate-900 shadow-sm">
            <Crown className="w-3 h-3 text-indigo-700" />
            Platinum Elite
          </span>
        );
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Award className="w-3 h-3 text-amber-400" />
            Gold Tier
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-600/30 text-gray-300 border border-gray-500/40">
            Silver Tier
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-900/50">
            Bronze Tier
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-manage-customers-tab">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Manage Customers</h2>
            <span className="bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
              {customers.length} Registered Accounts
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Customer directory, VIP loyalty point balances, lifetime purchase volume, and security statuses.
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#00ED64]/10 border border-[#00ED64]/20 flex items-center justify-center text-[#00ED64]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Total Customers</div>
            <div className="text-xl font-bold text-white">{totalCustomers}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">VIP Tier Holders</div>
            <div className="text-xl font-bold text-white">{vipCount}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Customer Lifetime Value</div>
            <div className="text-xl font-bold text-white">${totalCustomerSpend.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Average Spend / User</div>
            <div className="text-xl font-bold text-white">${avgSpend.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone..."
            className="w-full bg-[#182026] border border-gray-700/80 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ED64]"
            id="input-admin-search-customers"
          />
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['all', 'Platinum', 'Gold', 'Silver', 'Bronze'].map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                tierFilter === tier
                  ? 'bg-[#00ED64] text-[#001E2B]'
                  : 'bg-[#182026] text-gray-300 hover:bg-gray-700 border border-gray-700/60'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : `${tier}`}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300" id="table-admin-customers">
            <thead className="bg-[#0B0F13] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800 text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Customer Profile</th>
                <th className="px-4 py-3.5">VIP Tier</th>
                <th className="px-4 py-3.5">Loyalty Points</th>
                <th className="px-4 py-3.5">Total Orders</th>
                <th className="px-4 py-3.5">Lifetime Spend</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-600 stroke-1" />
                    <p className="text-sm font-semibold text-gray-400">No customers found</p>
                    <p className="text-xs text-gray-500 mt-1">Try refining your search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isMasterAdmin = cust.email.toLowerCase() === 'subby@gmail.com';

                  return (
                    <tr key={cust.id} className="hover:bg-gray-800/30 transition-colors" id={`row-customer-${cust.id}`}>
                      {/* Profile */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 overflow-hidden shrink-0">
                            <img
                              src={cust.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cust.name)}`}
                              alt={cust.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{cust.name}</span>
                              {isMasterAdmin && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                                  MASTER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                              <span>{cust.email}</span>
                              {cust.phone && <span>• {cust.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* VIP Tier */}
                      <td className="px-4 py-3.5">
                        {getTierBadge(cust.vipTier)}
                      </td>

                      {/* Points */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#00ED64] text-xs flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#00ED64]" />
                          <span>{cust.vipPoints.toLocaleString()} pts</span>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-white">{cust.orderCount} orders</span>
                      </td>

                      {/* Spend */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          ${cust.totalSpent.toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {cust.status === 'suspended' ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Active Account
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto border border-gray-700 transition-colors cursor-pointer"
                          id={`btn-edit-customer-${cust.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#00ED64]" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11161B] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-gray-100">
            
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-800 bg-[#0B0F13]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
                  <img src={selectedCustomer.avatar || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-gray-400">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerUpdates} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">VIP Loyalty Tier</label>
                <select
                  value={editingTier}
                  onChange={(e) => setEditingTier(e.target.value as any)}
                  className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                >
                  <option value="Bronze">Bronze Tier (Standard)</option>
                  <option value="Silver">Silver Tier (5% Perks)</option>
                  <option value="Gold">Gold Tier (10% Perks + Priority)</option>
                  <option value="Platinum">Platinum Elite (Complimentary Concierge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">VIP Reward Points Balance</label>
                <input
                  type="number"
                  min="0"
                  value={editingPoints}
                  onChange={(e) => setEditingPoints(e.target.value)}
                  className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Account Access Status</label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value as any)}
                  className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                >
                  <option value="active">Active (Full Privileges)</option>
                  <option value="vip">VIP Status Privileged</option>
                  <option value="suspended">Suspended / Frozen</option>
                </select>
              </div>

              <div className="bg-[#0B0F13] border border-gray-800 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                <div>Total Lifetime Orders: <span className="text-white font-bold">{selectedCustomer.orderCount}</span></div>
                <div>Total Lifetime Spend: <span className="text-[#00ED64] font-bold">${selectedCustomer.totalSpent.toLocaleString()}</span></div>
                <div>Joined: <span className="text-gray-300">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 text-xs font-semibold hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00c954] text-[#001E2B] text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-[#00ED64]/10 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Customer Changes'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
