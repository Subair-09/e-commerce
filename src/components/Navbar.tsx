import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  User, 
  ShoppingBag, 
  ChevronDown, 
  Menu, 
  X,
  Sparkles,
  ArrowRight,
  Cloud,
  Database,
  LayoutDashboard,
  Crown,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { User as UserType } from '../types';
import { isUserAdmin, MASTER_ADMIN_EMAIL } from '../services/authService';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  currentUser?: UserType | null;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenAzureStorage: () => void;
  onOpenMongoDatabase: () => void;
  onOpenCustomerDashboard?: (tab?: string) => void;
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onSelectCategory: (categoryName: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  currentUser,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenAccount,
  onOpenAdminLogin,
  onOpenAdminDashboard,
  onOpenAzureStorage,
  onOpenMongoDatabase,
  onOpenCustomerDashboard,
  activeNav,
  onSelectNav,
  onSelectCategory,
}) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = isUserAdmin(currentUser || null);

  const handleAdminAction = () => {
    if (isAdmin && onOpenAdminDashboard) {
      onOpenAdminDashboard();
    } else if (onOpenAdminLogin) {
      onOpenAdminLogin();
    } else {
      const el = document.getElementById('admin-portal');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Home', href: '#hero', id: 'home' },
    { name: 'Shop', href: '#categories', id: 'shop' },
    { name: 'New Arrivals', href: '#new-arrivals', id: 'new-arrivals' },
    { name: 'Best Sellers', href: '#best-sellers', id: 'best-sellers' },
    { name: 'Categories', isDropdown: true, id: 'categories' },
    { name: 'About', href: '#trust-bottom', id: 'about' },
    { name: 'Blog', href: '#promo-banners', id: 'blog' },
    { name: 'Contact', href: '#footer', id: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Geometric Balance styling */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onSelectNav('home')}
              className="flex items-center space-x-2 text-left group cursor-pointer"
              id="brand-logo-btn"
            >
              <span className="text-2xl font-black tracking-tighter text-[#1A1A1A]">
                AURA<span className="text-[#FF5A1F]">.</span>
              </span>
            </button>
          </div>

          {/* Desktop Center Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-[13px] font-medium text-gray-600">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <div key={item.name} className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className={`flex items-center gap-1 cursor-pointer transition-colors ${
                        categoriesOpen || activeNav === 'categories'
                          ? 'text-[#FF5A1F] font-semibold'
                          : 'text-gray-600 hover:text-black'
                      }`}
                      id="nav-categories-dropdown-btn"
                    >
                      <span>Categories</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {categoriesOpen && (
                      <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 px-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 border-b border-gray-100 mb-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Collections</span>
                          <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" />
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                onSelectCategory(cat.name);
                                setCategoriesOpen(false);
                              }}
                              className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl transition-all text-left group"
                              id={`dropdown-cat-${cat.slug}`}
                            >
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={cat.image} 
                                  alt={cat.name} 
                                  className="w-8 h-8 rounded-lg object-cover group-hover:scale-105 transition-transform" 
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="font-bold text-gray-900 text-xs">{cat.name}</p>
                                  <p className="text-[10px] text-gray-400">{cat.itemCount} items</p>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#FF5A1F] group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => onSelectNav(item.id)}
                  className={`transition-colors ${
                    isActive
                      ? 'text-[#FF5A1F] border-b-2 border-[#FF5A1F] pb-1 font-bold'
                      : 'text-gray-600 hover:text-black pb-1'
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center gap-5 text-gray-700">
            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="p-1.5 text-gray-700 hover:text-black transition-colors cursor-pointer"
              title="Search products"
              aria-label="Search"
              id="header-search-btn"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="p-1.5 text-gray-700 hover:text-black transition-colors relative cursor-pointer"
              title="View Wishlist"
              aria-label="Wishlist"
              id="header-wishlist-btn"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#FF5A1F] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* MongoDB Database Manager */}
            <button
              onClick={onOpenMongoDatabase}
              className="p-1.5 text-gray-700 hover:text-[#00A35C] transition-colors cursor-pointer relative group"
              title="MongoDB Database Explorer & Catalog"
              aria-label="MongoDB Database"
              id="header-mongodb-btn"
            >
              <Database className="w-5 h-5" />
              <span className="hidden sm:inline-block absolute -bottom-7 right-0 bg-[#001E2B] text-[#00ED64] text-[10px] font-bold py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                MongoDB
              </span>
            </button>

            {/* Azure Storage Manager */}
            <button
              onClick={onOpenAzureStorage}
              className="p-1.5 text-gray-700 hover:text-[#0078D4] transition-colors cursor-pointer relative group"
              title="Azure Storage Account & Media Assets"
              aria-label="Azure Storage"
              id="header-azure-storage-btn"
            >
              <Cloud className="w-5 h-5" />
              <span className="hidden sm:inline-block absolute -bottom-7 right-0 bg-[#1A1A1A] text-white text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Azure Storage
              </span>
            </button>

            {/* Admin Gateway / Command Center Button */}
            <button
              onClick={handleAdminAction}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-950 text-[#00ED64] border border-emerald-500/50 hover:bg-emerald-900 shadow-[0_0_12px_rgba(0,237,100,0.2)]'
                  : 'bg-slate-900 text-slate-200 hover:text-[#00ED64] hover:bg-slate-800 border border-slate-700'
              }`}
              title={isAdmin ? "Master Administrator Dashboard (Active)" : "Administrator Gateway Sign In"}
              id="header-admin-btn"
            >
              {isAdmin ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-[#00ED64] animate-bounce" />
                  <span>Admin Hub</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin</span>
                </>
              )}
            </button>

            {/* Customer Dashboard Portal Button */}
            {onOpenCustomerDashboard && (
              <button
                onClick={() => onOpenCustomerDashboard('browse')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#001E2B] text-[#00ED64] hover:bg-[#002e40] text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#00ED64]/30 group"
                title="Open Dedicated Customer Dashboard"
                id="header-customer-dashboard-btn"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#00ED64] group-hover:rotate-12 transition-transform" />
                <span>Portal</span>
              </button>
            )}

            {/* Account / Customer Auth */}
            <button
              onClick={currentUser ? () => onOpenCustomerDashboard?.('browse') : onOpenAccount}
              className="p-1 text-gray-700 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5 rounded-full hover:bg-neutral-100 pr-2"
              title={currentUser ? `Logged in as ${currentUser.name || currentUser.email || 'User'} - Open Customer Dashboard` : "Customer Sign In & Registration"}
              aria-label="Account"
              id="header-account-btn"
            >
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <img 
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || currentUser.email || 'User')}&backgroundColor=001E2B&textColor=00ED64`}
                      alt={currentUser.name || 'User'} 
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500 bg-[#001E2B]" 
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                  </div>
                  <span className="hidden xl:inline-block text-xs font-bold text-neutral-900 max-w-[90px] truncate">
                    {(currentUser.name ? currentUser.name.split(' ')[0] : (currentUser.email ? currentUser.email.split('@')[0] : 'User'))}
                  </span>
                </div>
              ) : (
                <User className="w-5 h-5 p-0.5" />
              )}
            </button>

            {/* Cart with Notification Badge */}
            <button
              onClick={onOpenCart}
              className="p-1.5 text-gray-700 hover:text-black transition-colors relative cursor-pointer"
              title="Shopping Cart"
              aria-label="Shopping Cart"
              id="header-cart-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#FF5A1F] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-gray-700 hover:text-black transition-colors ml-1"
              aria-label="Toggle menu"
              id="header-mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 px-2 space-y-1 animate-in slide-in-from-top-2 bg-white">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href || '#categories'}
                onClick={() => {
                  onSelectNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg ${
                  activeNav === item.id
                    ? 'bg-orange-50 text-[#FF5A1F] font-bold'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {item.name}
              </a>
            ))}
            {/* Mobile Customer Dashboard */}
            {onOpenCustomerDashboard && (
              <button
                onClick={() => {
                  onOpenCustomerDashboard('browse');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center justify-between px-4 py-2.5 text-sm font-bold bg-[#001E2B] text-[#00ED64] rounded-xl cursor-pointer mt-1"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-[#00ED64]" />
                  <span>Customer Dashboard (8 Tabs)</span>
                </div>
                <span className="text-[10px] bg-[#00ED64] text-neutral-950 font-black px-2 py-0.5 rounded-full">
                  Portal
                </span>
              </button>
            )}

            {/* Mobile Account Option */}
            <button
              onClick={() => {
                if (currentUser && onOpenCustomerDashboard) {
                  onOpenCustomerDashboard('browse');
                } else {
                  onOpenAccount();
                }
                setMobileMenuOpen(false);
              }}
              className="w-full text-left flex items-center justify-between px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 rounded-lg cursor-pointer border-t border-neutral-100 mt-2 pt-3"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{currentUser ? `Customer Dashboard (${currentUser.name})` : 'Sign In / Register'}</span>
              </div>
              {currentUser && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {currentUser.vipTier} VIP
                </span>
              )}
            </button>

            {/* Mobile Admin Portal Option */}
            <button
              onClick={() => {
                if (onOpenAdminLogin) {
                  onOpenAdminLogin();
                } else {
                  const el = document.getElementById('admin-portal');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
                setMobileMenuOpen(false);
              }}
              className="w-full text-left flex items-center justify-between px-4 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-lg cursor-pointer border border-slate-700"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#00ED64]" />
                <span>Admin Gateway ({MASTER_ADMIN_EMAIL})</span>
              </div>
              <span className="text-[10px] bg-[#00ED64] text-slate-950 font-bold px-2 py-0.5 rounded">
                Admin
              </span>
            </button>

            {/* Mobile MongoDB Option */}
            <button
              onClick={() => {
                onOpenMongoDatabase();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#00A35C] hover:bg-emerald-50 rounded-lg cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>MongoDB Database Explorer</span>
            </button>

            {/* Mobile Azure Storage Option */}
            <button
              onClick={() => {
                onOpenAzureStorage();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0078D4] hover:bg-blue-50 rounded-lg cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Azure Storage Cloud Account</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
