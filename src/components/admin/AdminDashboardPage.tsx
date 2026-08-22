import React, { useState, useEffect } from 'react';
import { User, Product, MongoOrder, AdminDashboardTab, AdminProductInput, AdminCustomerSummary } from '../../types';
import { ManageProductsTab } from './ManageProductsTab';
import { ManageOrdersTab } from './ManageOrdersTab';
import { ManageCustomersTab } from './ManageCustomersTab';
import { ViewSalesReportsTab } from './ViewSalesReportsTab';
import { 
  Package, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  ArrowLeft, 
  Database, 
  Cloud, 
  LogOut, 
  ShieldAlert, 
  Crown, 
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  Menu,
  X
} from 'lucide-react';

interface AdminDashboardPageProps {
  currentUser: User | null;
  onLogout: () => void;
  onBackToStore: () => void;
  products: Product[];
  onAddProduct: (product: AdminProductInput) => Promise<void>;
  onEditProduct: (id: string, product: AdminProductInput) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onSeedDatabase: () => Promise<void>;
  onOpenMongoDatabase: () => void;
  onOpenAzureStorage: () => void;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info') => void;
  categories: string[];
  initialTab?: AdminDashboardTab;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  onLogout,
  onBackToStore,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSeedDatabase,
  onOpenMongoDatabase,
  onOpenAzureStorage,
  onShowToast,
  categories,
  initialTab = 'products',
}) => {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>(initialTab);
  const [orders, setOrders] = useState<MongoOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch orders and customers on mount and when tab changes
  const refreshAdminData = async () => {
    setLoading(true);
    try {
      // 1. Orders
      const ordRes = await fetch('/api/mongo/orders?limit=100');
      const ordData = await ordRes.json();
      if (ordData.success && ordData.orders) {
        setOrders(ordData.orders);
      }

      // 2. Customers
      const custRes = await fetch('/api/admin/customers');
      const custData = await custRes.json();
      if (custData.success && custData.customers) {
        setCustomers(custData.customers);
      }
    } catch (err) {
      console.warn('Error refreshing admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  const handleUpdateOrderStatus = async (
    orderId: string, 
    status: any, 
    meta?: { trackingNumber?: string; courier?: string; notes?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...meta }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? { ...o, status, ...meta } : o))
        );
      }
    } catch (err) {
      console.warn('Error updating order:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      }
    } catch (err) {
      console.warn('Error deleting order:', err);
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<AdminCustomerSummary>) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
      }
    } catch (err) {
      console.warn('Error updating customer:', err);
    }
  };

  const navItems: Array<{ id: AdminDashboardTab; label: string; icon: React.ComponentType<any>; badge?: string | number }> = [
    {
      id: 'products',
      label: 'Manage Products',
      icon: Package,
      badge: products.length,
    },
    {
      id: 'orders',
      label: 'Manage Orders',
      icon: ClipboardList,
      badge: orders.length > 0 ? orders.length : undefined,
    },
    {
      id: 'customers',
      label: 'Manage Customers',
      icon: Users,
      badge: customers.length > 0 ? customers.length : undefined,
    },
    {
      id: 'sales',
      label: 'View Sales / Reports',
      icon: TrendingUp,
      badge: 'Live',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A0D] text-gray-100 flex flex-col font-sans antialiased selection:bg-[#00ED64] selection:text-black" id="admin-dashboard-page">
      
      {/* Top Universal Master Admin Header */}
      <header className="h-16 bg-[#0B0F13] border-b border-gray-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        
        {/* Left branding & return */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 transition-colors cursor-pointer"
            id="btn-admin-back-to-store"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Storefront</span>
            <span className="sm:hidden">Store</span>
          </button>

          <div className="h-4 w-px bg-gray-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black text-xs shadow-md">
              A
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                <span>AURA Command</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded">MASTER ADMIN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right cloud indicators & session */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Cloud sync buttons */}
          <button
            onClick={onOpenMongoDatabase}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 hover:bg-[#00ED64]/20 text-xs font-semibold transition-colors cursor-pointer"
            title="Open MongoDB Atlas CRUD Console"
          >
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Database</span>
          </button>

          <button
            onClick={onOpenAzureStorage}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/30 hover:bg-[#0078D4]/20 text-xs font-semibold transition-colors cursor-pointer"
            title="Open Azure Blob Storage Explorer"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Azure Blob Storage</span>
          </button>

          <button
            onClick={refreshAdminData}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs border border-gray-700 transition-colors cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ED64]' : ''}`} />
          </button>

          {/* Admin User Chip */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
            <div className="w-8 h-8 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-300 font-bold text-xs">
              👑
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white leading-tight">subby@gmail.com</div>
              <div className="text-[10px] text-amber-400 font-medium">Administrator</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer ml-1"
              title="Sign Out of Admin"
              id="btn-admin-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Body Layout: Left Sidebar + Center View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <aside
          className={`w-64 bg-[#0B0F13] border-r border-gray-800/80 flex flex-col justify-between p-4 z-30 transition-transform duration-200 ease-in-out md:translate-x-0 ${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 pt-20 shadow-2xl translate-x-0' : 'fixed -translate-x-full md:static'
          }`}
          id="admin-left-sidebar"
        >
          {/* Nav List */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-gray-500 uppercase font-bold">
              Core Administration
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00ED64] text-[#001E2B] shadow-lg shadow-[#00ED64]/10 font-extrabold'
                      : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
                  }`}
                  id={`admin-tab-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#001E2B]' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-[#001E2B] text-[#00ED64]'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Cloud Utilities */}
          <div className="pt-4 border-t border-gray-800/80 space-y-2">
            <div className="px-3 text-[10px] font-mono tracking-wider text-gray-500 uppercase font-semibold">
              Storage Integrations
            </div>

            <button
              onClick={onOpenMongoDatabase}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-gray-800/80 hover:text-[#00ED64] transition-colors text-left cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#00ED64]" />
              <span>MongoDB Atlas Browser</span>
            </button>

            <button
              onClick={onOpenAzureStorage}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-gray-800/80 hover:text-[#0078D4] transition-colors text-left cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-[#0078D4]" />
              <span>Azure Blob Storage</span>
            </button>

            {/* Quick System Badge */}
            <div className="mt-2 bg-[#11161B] border border-gray-800/80 rounded-xl p-2.5 text-[10px] text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Cluster State</span>
                <span className="text-[#00ED64] font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-gray-500 font-mono">
                <span>Role</span>
                <span className="text-amber-300">MASTER ADMIN</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070A0D]" id="admin-main-viewport">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'products' && (
              <ManageProductsTab
                products={products}
                onAddProduct={onAddProduct}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                onSeedDatabase={onSeedDatabase}
                onShowToast={onShowToast}
                onOpenAzureStorage={onOpenAzureStorage}
                categories={categories}
              />
            )}

            {activeTab === 'orders' && (
              <ManageOrdersTab
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onShowToast={onShowToast}
                onOpenAzureStorage={onOpenAzureStorage}
              />
            )}

            {activeTab === 'customers' && (
              <ManageCustomersTab
                customers={customers}
                onUpdateCustomer={handleUpdateCustomer}
                onShowToast={onShowToast}
              />
            )}

            {activeTab === 'sales' && (
              <ViewSalesReportsTab
                onShowToast={onShowToast}
              />
            )}
          </div>
        </main>

      </div>

    </div>
  );
};
