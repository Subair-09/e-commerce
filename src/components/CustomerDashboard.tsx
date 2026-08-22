import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search,
  FileText,
  ShoppingCart,
  CheckSquare,
  CreditCard,
  Truck,
  History,
  ArrowLeft,
  Star,
  Heart,
  Plus,
  Minus,
  Trash2,
  Package,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock,
  Download,
  DollarSign,
  Lock,
  Sparkles,
  SlidersHorizontal,
  X,
  AlertCircle,
  Tag,
  Eye,
  Check,
  User as UserIcon,
  Phone,
  Mail,
  Copy,
  Layers,
  ShoppingBag,
  LogOut,
  Crown
} from 'lucide-react';
import { Product, CartItem, User, MongoOrder, UserAddress } from '../types';
import { ALL_PRODUCTS, CATEGORIES } from '../data/mockData';
import { placeOrderInMongo, getOrdersFromMongo } from '../services/mongoService';
import { backupOrderReceiptToAzure } from '../services/azureStorage';
import { updateCustomerProfile, fetchCustomerOrders, clearSession } from '../services/authService';
import { payWithPaystack, getPaystackConfig } from '../services/paystack';

export type DashboardTab =
  | 'browse'
  | 'search'
  | 'details'
  | 'cart'
  | 'checkout'
  | 'payment'
  | 'track'
  | 'history';

interface CustomerDashboardProps {
  onBackToStore: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  cartItems: CartItem[];
  onUpdateCartItemQuantity: (id: string, qty: number) => void;
  onRemoveCartItem: (id: string) => void;
  onAddToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  onClearCart: () => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info' | 'cart' | 'wishlist') => void;
  onOpenAdminDashboard?: () => void;
  initialTab?: DashboardTab;
  initialProduct?: Product | null;
  catalogProducts?: Product[];
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onBackToStore,
  currentUser,
  onUserChange,
  cartItems,
  onUpdateCartItemQuantity,
  onRemoveCartItem,
  onAddToCart,
  onClearCart,
  wishlist,
  onToggleWishlist,
  onShowToast,
  onOpenAdminDashboard,
  initialTab = 'browse',
  initialProduct = null,
  catalogProducts = ALL_PRODUCTS,
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Selected Product for Details Tab
  const [selectedProduct, setSelectedProduct] = useState<Product>(
    initialProduct || catalogProducts[0] || ALL_PRODUCTS[0]
  );

  // Browse Filters & Sorting
  const [browseCategory, setBrowseCategory] = useState<string>('All');
  const [browseSort, setBrowseSort] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [browsePriceRange, setBrowsePriceRange] = useState<number>(500);

  // Search Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Wireless Headphones',
    'Leather Bag',
    'Sunglasses',
    'Silk Dress',
  ]);

  // Product Details Tab Interactive State
  const [detailSelectedSize, setDetailSelectedSize] = useState<string>('M');
  const [detailSelectedColor, setDetailSelectedColor] = useState<string>('Standard');
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [detailActiveSubTab, setDetailActiveSubTab] = useState<'description' | 'specs' | 'reviews' | 'shipping'>('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Cart Management Tab State (Promo codes, notes)
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>({
    code: 'AURA15-WELCOME',
    percent: 15,
  });
  const [orderNote, setOrderNote] = useState('');

  // Place Order (Checkout) Form State - Initialized dynamically from currentUser
  const [shippingName, setShippingName] = useState(currentUser?.name || '');
  const [shippingEmail, setShippingEmail] = useState(currentUser?.email || '');
  const [shippingPhone, setShippingPhone] = useState(currentUser?.phone || '');
  const [shippingStreet, setShippingStreet] = useState(currentUser?.addresses?.[0]?.street || '');
  const [shippingCity, setShippingCity] = useState(currentUser?.addresses?.[0]?.city || '');
  const [shippingPostal, setShippingPostal] = useState(currentUser?.addresses?.[0]?.postalCode || '');
  const [shippingCountry, setShippingCountry] = useState(currentUser?.addresses?.[0]?.country || 'United States');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'overnight'>('express');
  const [saveAddressToMongo, setSaveAddressToMongo] = useState(true);

  // Make Payment (Payment System) State
  const [paymentGateway, setPaymentGateway] = useState<'paystack' | 'card' | 'applepay' | 'paypal' | 'crypto'>('paystack');
  const [paystackStatusMsg, setPaystackStatusMsg] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(currentUser?.name ? currentUser.name.toUpperCase() : 'VALUED CUSTOMER');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<MongoOrder | null>(null);

  // Track Order State
  const [trackQuery, setTrackQuery] = useState('');
  const [activeTrackOrder, setActiveTrackOrder] = useState<MongoOrder | null>(null);

  // View Order History State
  const [orderHistory, setOrderHistory] = useState<MongoOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<MongoOrder | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'confirmed' | 'shipped' | 'delivered'>('all');

  // Sync state and load orders on mount or user change
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) {
        setShippingName(currentUser.name);
        setCardHolder(currentUser.name.toUpperCase());
      }
      if (currentUser.email) {
        setShippingEmail(currentUser.email);
      }
      if (currentUser.phone) {
        setShippingPhone(currentUser.phone);
      }
      if (currentUser.addresses && currentUser.addresses.length > 0) {
        const def = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
        if (def) {
          setShippingStreet(def.street || '');
          setShippingCity(def.city || '');
          setShippingPostal(def.postalCode || '');
          setShippingCountry(def.country || 'United States');
        }
      }
    }
    loadUserOrderHistory();
  }, [currentUser]);

  // Handle Customer Sign Out
  const handleDashboardSignOut = () => {
    clearSession();
    onUserChange(null);
    onShowToast('Signed Out', 'You have been safely signed out.', 'info');
  };

  const loadUserOrderHistory = async () => {
    setHistoryLoading(true);
    try {
      if (currentUser?.email) {
        const orders = await fetchCustomerOrders(currentUser.email);
        setOrderHistory(orders);
        if (orders.length > 0 && !activeTrackOrder) {
          setActiveTrackOrder(orders[0]);
          setTrackQuery(orders[0].orderId);
        }
      } else {
        const allOrders = await getOrdersFromMongo();
        setOrderHistory(allOrders);
        if (allOrders.length > 0 && !activeTrackOrder) {
          setActiveTrackOrder(allOrders[0]);
          setTrackQuery(allOrders[0].orderId);
        }
      }
    } catch (e) {
      console.warn('Could not fetch orders:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Sync details variant state when selectedProduct changes
  useEffect(() => {
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
      setDetailSelectedSize(selectedProduct.sizes[0]);
    }
    if (selectedProduct.colors && selectedProduct.colors.length > 0) {
      setDetailSelectedColor(selectedProduct.colors[0]);
    }
    setDetailQuantity(1);
    setActiveImageIndex(0);
  }, [selectedProduct]);

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    return (cartSubtotal * appliedDiscount.percent) / 100;
  }, [cartSubtotal, appliedDiscount]);

  const shippingCost = useMemo(() => {
    if (cartItems.length === 0) return 0;
    if (shippingMethod === 'overnight') return 25.0;
    if (shippingMethod === 'express') return 12.0;
    return 0.0; // standard is free
  }, [cartItems.length, shippingMethod]);

  const estimatedTax = useMemo(() => {
    const taxable = Math.max(0, cartSubtotal - discountAmount);
    return taxable * 0.08; // 8% sales tax
  }, [cartSubtotal, discountAmount]);

  const orderTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount + shippingCost + estimatedTax);
  }, [cartSubtotal, discountAmount, shippingCost, estimatedTax]);

  // Browse Products Filtered
  const filteredBrowseProducts = useMemo(() => {
    let prods = catalogProducts.filter((p) => {
      const matchCat = browseCategory === 'All' || p.category.toLowerCase() === browseCategory.toLowerCase();
      const matchPrice = p.price <= browsePriceRange;
      return matchCat && matchPrice;
    });

    if (browseSort === 'price-low') {
      prods = [...prods].sort((a, b) => a.price - b.price);
    } else if (browseSort === 'price-high') {
      prods = [...prods].sort((a, b) => b.price - a.price);
    } else if (browseSort === 'rating') {
      prods = [...prods].sort((a, b) => b.rating - a.rating);
    }

    return prods;
  }, [catalogProducts, browseCategory, browsePriceRange, browseSort]);

  // Search Tab Filtered Products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && searchCategory === 'All') {
      return catalogProducts.slice(0, 8);
    }
    const q = searchQuery.toLowerCase().trim();
    return catalogProducts.filter((p) => {
      const matchCat = searchCategory === 'All' || p.category.toLowerCase() === searchCategory.toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [catalogProducts, searchQuery, searchCategory]);

  // Actions
  const handleInspectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setActiveTab('details');
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'AURA15-WELCOME' || code === 'WELCOME15') {
      setAppliedDiscount({ code: 'AURA15-WELCOME', percent: 15 });
      onShowToast('Promo Applied!', '15% discount has been applied to your cart subtotal.', 'success');
      setPromoCodeInput('');
    } else if (code === 'VIP20' || code === 'GOLD20') {
      setAppliedDiscount({ code: 'VIP20', percent: 20 });
      onShowToast('VIP Code Applied!', '20% VIP loyalty discount activated.', 'success');
      setPromoCodeInput('');
    } else if (code === 'FREESHIP') {
      setShippingMethod('standard');
      onShowToast('Free Shipping Code', 'Standard shipping unlocked.', 'info');
      setPromoCodeInput('');
    } else {
      onShowToast('Invalid Promo Code', 'Code not recognized or expired. Try AURA15-WELCOME or VIP20', 'info');
    }
  };

  const handleExecutePayment = async () => {
    if (cartItems.length === 0) {
      onShowToast('Cart is Empty', 'Please add items to your cart before proceeding to payment.', 'info');
      setActiveTab('browse');
      return;
    }

    setIsProcessingPayment(true);
    setPaystackStatusMsg(paymentGateway === 'paystack' ? 'Connecting to Paystack Gateway...' : null);

    try {
      const generatedOrderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      let payRef = `PSTK_${generatedOrderId}_${Date.now()}`;

      // Paystack Gateway Execution
      if (paymentGateway === 'paystack') {
        setPaystackStatusMsg('Opening Paystack checkout modal...');
        const paystackResult = await payWithPaystack({
          email: shippingEmail || currentUser?.email || 'customer@aura.store',
          amount: orderTotal,
          reference: payRef,
          metadata: {
            orderId: generatedOrderId,
            customerName: shippingName || currentUser?.name || 'Customer',
            itemCount: cartItems.length,
          },
        });

        if (paystackResult?.reference) {
          payRef = paystackResult.reference;
        }
        setPaystackStatusMsg('Payment verified. Recording order in MongoDB...');
      }

      const orderPayload: MongoOrder = {
        orderId: generatedOrderId,
        createdAt: new Date().toISOString(),
        customer: {
          name: shippingName || currentUser?.name || 'Valued Customer',
          email: shippingEmail || currentUser?.email || 'customer@aura-luxury.com',
          phone: shippingPhone || currentUser?.phone || '+1 (555) 019-2834',
        },
        items: cartItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          color: item.selectedColor,
          size: item.selectedSize,
          image: item.product.image,
        })),
        totalAmount: orderTotal,
        currency: 'USD',
        status: 'confirmed',
        paymentMethod:
          paymentGateway === 'paystack'
            ? `Paystack (${payRef})`
            : paymentGateway === 'card'
            ? `Credit Card (•••• ${cardNumber.slice(-4)})`
            : paymentGateway === 'applepay'
            ? 'Apple Pay'
            : paymentGateway === 'paypal'
            ? 'PayPal One-Touch'
            : 'Crypto (USDC)',
        shippingAddress: `${shippingStreet}, ${shippingCity}, ${shippingPostal}, ${shippingCountry}`,
      };

      // 1. Record in MongoDB
      const mongoRes = await placeOrderInMongo(orderPayload);
      if (mongoRes.success) {
        onShowToast('MongoDB Stored', `Order #${generatedOrderId} persisted to MongoDB orders collection.`, 'info');
      }

      // 2. Backup to Azure Storage
      backupOrderReceiptToAzure(orderPayload).catch(() => {});

      // 3. Update customer VIP points
      if (currentUser) {
        const earnedPoints = Math.floor(orderTotal * 2);
        updateCustomerProfile(currentUser.id, {
          vipPoints: (currentUser.vipPoints || 0) + earnedPoints,
        }).then((res) => {
          if (res.success && res.user) onUserChange(res.user);
        });
      }

      setLastCompletedOrder(orderPayload);
      setActiveTrackOrder(orderPayload);
      setTrackQuery(generatedOrderId);

      // Refresh order history
      await loadUserOrderHistory();

      // Clear Cart
      onClearCart();

      onShowToast('Payment Successful!', `Order #${generatedOrderId} confirmed! VIP points credited.`, 'success');
      setActiveTab('track');
    } catch (err: any) {
      onShowToast('Payment Error', err.message || 'Transaction failed. Please retry.', 'info');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackQuery.trim().toLowerCase();
    if (!query) return;

    const matched = orderHistory.find(
      (o) =>
        o.orderId.toLowerCase() === query ||
        o.orderId.toLowerCase().includes(query) ||
        query.includes(o.orderId.toLowerCase())
    );

    if (matched) {
      setActiveTrackOrder(matched);
      onShowToast('Order Found', `Tracking details loaded for #${matched.orderId}`, 'success');
    } else {
      // Mock generated fallback tracker
      const fallbackTrack: MongoOrder = {
        orderId: trackQuery.trim().toUpperCase(),
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        customer: {
          name: shippingName,
          email: shippingEmail,
        },
        items: [
          {
            id: 'mock-trk-1',
            name: 'AURA Custom Luxury Package',
            price: 189.0,
            quantity: 1,
            color: 'Signature Black',
            size: 'Standard',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
          },
        ],
        totalAmount: 189.0,
        currency: 'USD',
        status: 'shipped',
        paymentMethod: 'Verified Payment Gateway',
        shippingAddress: `${shippingStreet}, ${shippingCity}, ${shippingPostal}, ${shippingCountry}`,
      };
      setActiveTrackOrder(fallbackTrack);
      onShowToast('Package Located', `Carrier transit information found for ${trackQuery.trim().toUpperCase()}`, 'info');
    }
  };

  const isWishlisted = (id: string) => wishlist.some((w) => w.id === id);

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-neutral-900 flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 text-neutral-700 cursor-pointer"
            title="Toggle Menu"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-all cursor-pointer shadow-2xs group"
            id="back-to-store-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Storefront</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 border-l border-neutral-200 pl-3">
            <span className="font-serif tracking-widest text-base font-black text-neutral-950">AURA</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#001E2B] text-[#00ED64]">
              Customer Portal
            </span>
          </div>
        </div>

        {/* Header Right Tools */}
        <div className="flex items-center gap-3">
          {/* Quick Tab Indicators */}
          <div className="hidden md:flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-semibold text-neutral-600">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'browse' ? 'bg-white text-neutral-950 shadow-2xs' : 'hover:text-neutral-950'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'search' ? 'bg-white text-neutral-950 shadow-2xs' : 'hover:text-neutral-950'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'cart' ? 'bg-white text-neutral-950 shadow-2xs' : 'hover:text-neutral-950'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </button>
          </div>

          {/* User Status / VIP Badge & Sign Out */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs">
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || currentUser.email || 'User')}&backgroundColor=001E2B&textColor=00ED64`
                  }
                  alt={currentUser.name || 'User'}
                  className="w-5 h-5 rounded-full object-cover bg-neutral-900"
                />
                <span className="font-bold text-emerald-900 text-[11px] truncate max-w-[100px] hidden sm:inline">
                  {(currentUser.name ? currentUser.name.split(' ')[0] : (currentUser.email ? currentUser.email.split('@')[0] : 'User'))}
                </span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                  {currentUser.vipTier || 'Member'} • {currentUser.vipPoints ?? 0} pts
                </span>
              </div>
              {currentUser.email && currentUser.email.toLowerCase() === 'subby@gmail.com' && onOpenAdminDashboard && (
                <button
                  onClick={onOpenAdminDashboard}
                  className="flex items-center gap-1 px-3 py-1 bg-[#001E2B] text-[#00ED64] hover:bg-[#002b3d] rounded-full text-xs font-bold transition-all border border-[#00ED64]/30 cursor-pointer shadow-xs"
                  id="btn-customer-dash-to-admin"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>
              )}
              <button
                onClick={handleDashboardSignOut}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer font-semibold border border-neutral-200"
                title="Sign Out of Customer Account"
                id="dash-header-signout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full text-xs font-semibold text-neutral-700">
              <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>Guest Shopper</span>
            </div>
          )}

          {/* Cart Floating Button */}
          <button
            onClick={() => setActiveTab('cart')}
            className="p-2 rounded-xl bg-neutral-900 text-white hover:bg-emerald-600 transition-colors relative cursor-pointer shadow-xs"
            title="Cart"
            id="dash-header-cart-btn"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00ED64] text-neutral-950 font-black text-[9px] rounded-full flex items-center justify-center border border-white">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN DASHBOARD CONTAINER: LEFT SIDEBAR + RIGHT CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ======================================================================= */}
        {/* LEFT NAVIGATION SIDEBAR (8 REQUESTED TABS) */}
        {/* ======================================================================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Header (Mobile close) */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between lg:hidden">
            <span className="font-bold text-sm text-neutral-900">Dashboard Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer Overview Card in Sidebar */}
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={
                    currentUser?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      currentUser?.name || 'Customer'
                    )}&backgroundColor=001E2B&textColor=00ED64`
                  }
                  alt={currentUser?.name || 'Customer'}
                  className="w-10 h-10 rounded-xl object-cover border border-neutral-200 bg-neutral-900"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-neutral-900 truncate">
                  {currentUser?.name || 'Customer Account'}
                </h4>
                <p className="text-[11px] text-neutral-500 truncate">{currentUser?.email || 'Guest Session'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-bold text-[#00ED64] bg-[#001E2B] px-1.5 py-0.2 rounded">
                    {currentUser?.vipTier || 'Bronze'} Member
                  </span>
                  <span className="text-[9px] text-neutral-500 font-semibold">
                    {currentUser?.vipPoints || 250} Pts
                  </span>
                </div>
              </div>
              {currentUser && (
                <button
                  onClick={handleDashboardSignOut}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                  id="dash-sidebar-signout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Shopping & Catalog
            </div>

            {/* 1. Browse Products */}
            <button
              onClick={() => {
                setActiveTab('browse');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-browse-products"
            >
              <div className="flex items-center gap-3">
                <Compass className={`w-4 h-4 ${activeTab === 'browse' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>Browse Products</span>
              </div>
              <span className="text-[10px] opacity-70 bg-neutral-200/40 text-current px-1.5 py-0.2 rounded-md">
                {catalogProducts.length}
              </span>
            </button>

            {/* 2. Search Products */}
            <button
              onClick={() => {
                setActiveTab('search');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-search-products"
            >
              <div className="flex items-center gap-3">
                <Search className={`w-4 h-4 ${activeTab === 'search' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>Search Products</span>
              </div>
            </button>

            {/* 3. View Product Details */}
            <button
              onClick={() => {
                setActiveTab('details');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-view-product-details"
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${activeTab === 'details' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>View Product Details</span>
              </div>
              {selectedProduct?.name && (
                <span className="text-[9px] truncate max-w-[70px] opacity-70">
                  {selectedProduct.name.split(' ')[0]}
                </span>
              )}
            </button>

            {/* 4. Add to Cart (Cart Management) */}
            <button
              onClick={() => {
                setActiveTab('cart');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-add-to-cart"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className={`w-4 h-4 ${activeTab === 'cart' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>Add to Cart</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'cart' ? 'bg-[#00ED64] text-neutral-950' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </button>

            <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Checkout & Payment System
            </div>

            {/* 5. Place Order (Checkout Form) */}
            <button
              onClick={() => {
                setActiveTab('checkout');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'checkout'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-place-order"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className={`w-4 h-4 ${activeTab === 'checkout' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>Place Order</span>
              </div>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Phase 1</span>
            </button>

            {/* 6. Make Payment (Payment System) */}
            <button
              onClick={() => {
                setActiveTab('payment');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'payment'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-make-payment"
            >
              <div className="flex items-center gap-3">
                <CreditCard className={`w-4 h-4 ${activeTab === 'payment' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>Make Payment</span>
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Phase 2</span>
            </button>

            <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Orders & Tracking
            </div>

            {/* 7. Track Order */}
            <button
              onClick={() => {
                setActiveTab('track');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-track-order"
            >
              <div className="flex items-center gap-3">
                <Truck className={`w-4 h-4 ${activeTab === 'track' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>Track Order</span>
              </div>
              {activeTrackOrder && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Delivery" />
              )}
            </button>

            {/* 8. View Order History */}
            <button
              onClick={() => {
                setActiveTab('history');
                loadUserOrderHistory();
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
              id="tab-view-order-history"
            >
              <div className="flex items-center gap-3">
                <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-[#00ED64]' : 'text-neutral-500'}`} />
                <span>View Order History</span>
              </div>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 font-bold px-1.5 py-0.2 rounded-md">
                {orderHistory.length}
              </span>
            </button>
          </div>

          {/* Sidebar Footer Support Card */}
          <div className="p-3.5 m-3 rounded-2xl bg-neutral-900 text-white text-xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00ED64]" />
              <span className="font-bold text-neutral-100">MongoDB Synchronized</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              All cart items, checkouts, and customer profiles are secured & persisted.
            </p>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ======================================================================= */}
        {/* RIGHT MAIN CONTENT AREA - SWITCHES ACCORDING TO ACTIVE TAB */}
        {/* ======================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FBFBFB]">
          
          {/* ===================================================================== */}
          {/* TAB 1: BROWSE PRODUCTS */}
          {/* ===================================================================== */}
          {activeTab === 'browse' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header & Filter Controls */}
              <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                    <Compass className="w-4 h-4" />
                    <span>Catalog Explorer</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Browse Products</h2>
                  <p className="text-xs text-neutral-500">
                    Showing {filteredBrowseProducts.length} items from MongoDB catalog
                  </p>
                </div>

                {/* Filter and Sort Bar */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {/* Category Filter */}
                  <select
                    value={browseCategory}
                    onChange={(e) => setBrowseCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Price Filter Slider */}
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[11px] text-neutral-500 font-medium">Max:</span>
                    <span className="font-bold text-neutral-900">${browsePriceRange}</span>
                    <input
                      type="range"
                      min={20}
                      max={500}
                      step={10}
                      value={browsePriceRange}
                      onChange={(e) => setBrowsePriceRange(Number(e.target.value))}
                      className="w-20 accent-neutral-900 cursor-pointer"
                    />
                  </div>

                  {/* Sort Filter */}
                  <select
                    value={browseSort}
                    onChange={(e) => setBrowseSort(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {filteredBrowseProducts.map((product) => {
                  const inWish = isWishlisted(product.id);
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col group"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Wishlist Button */}
                        <button
                          onClick={() => onToggleWishlist(product)}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                            inWish
                              ? 'bg-red-500 text-white'
                              : 'bg-white/80 text-neutral-700 hover:bg-white hover:text-red-500'
                          }`}
                          title="Wishlist"
                        >
                          <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
                        </button>

                        {/* Category Badge */}
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>

                      {/* Info & Actions */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{product.rating}</span>
                            <span className="text-neutral-400 font-normal">({product.reviewsCount || 48})</span>
                          </div>
                          <h3 className="font-bold text-sm text-neutral-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                          <div className="text-base font-extrabold text-neutral-950">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Inspect Details */}
                            <button
                              onClick={() => handleInspectProduct(product)}
                              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Add to Cart */}
                            <button
                              onClick={() => {
                                onAddToCart(product, 1);
                                onShowToast('Added to Cart', `${product.name} has been added to your cart.`, 'cart');
                              }}
                              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Add to Cart"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: SEARCH PRODUCTS */}
          {/* ===================================================================== */}
          {activeTab === 'search' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Search Header Banner */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                    <Search className="w-4 h-4" />
                    <span>Real-time Catalog Search</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Search Products</h2>
                  <p className="text-xs text-neutral-500">
                    Instant full-text lookup across names, descriptions, SKU attributes, and tags
                  </p>
                </div>

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by keywords, e.g. 'Leather', 'Headphones', 'Silk', 'Watch'..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all shadow-inner"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Chips & Recent Searches */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-neutral-400 mr-1">Filter:</span>
                    {['All', 'Fashion', 'Electronics', 'Beauty', 'Fitness', 'Accessories'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSearchCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          searchCategory === cat
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Recent Searches Suggestions */}
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <span>Popular:</span>
                    {recentSearches.map((rec, i) => (
                      <button
                        key={i}
                        onClick={() => setSearchQuery(rec)}
                        className="underline hover:text-emerald-700 cursor-pointer"
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Results Count */}
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 px-1">
                <span>Matching Results: {searchResults.length} Products</span>
                {searchQuery && (
                  <span>
                    Query: "<span className="text-neutral-950 font-bold">{searchQuery}</span>"
                  </span>
                )}
              </div>

              {/* Search Results Grid */}
              {searchResults.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-neutral-200 text-center space-y-3">
                  <Search className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h3 className="text-base font-bold text-neutral-800">No matching products found</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Try adjusting your search keywords or browsing our complete collection categories.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchCategory('All');
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
                    >
                      <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{product.rating}</span>
                          </div>
                          <h4 className="font-bold text-sm text-neutral-900 line-clamp-1">{product.name}</h4>
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{product.description}</p>
                        </div>

                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                          <span className="text-base font-extrabold text-neutral-950">${product.price.toFixed(2)}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleInspectProduct(product)}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => {
                                onAddToCart(product, 1);
                                onShowToast('Added to Cart', `${product.name} added to cart!`, 'cart');
                              }}
                              className="p-2 bg-neutral-900 hover:bg-emerald-600 text-white rounded-xl cursor-pointer"
                              title="Add to Cart"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: VIEW PRODUCT DETAILS */}
          {/* ===================================================================== */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Product Detailed Workspace */}
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Gallery & Images (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="aspect-square rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-inner relative group">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#001E2B] text-[#00ED64] text-[10px] font-bold uppercase tracking-wider">
                        {selectedProduct.category}
                      </span>
                    </div>

                    {/* Thumbnails row */}
                    <div className="grid grid-cols-4 gap-2.5">
                      {[selectedProduct.image, selectedProduct.image, selectedProduct.image, selectedProduct.image].map(
                        (img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                              activeImageIndex === idx ? 'border-neutral-950 shadow-xs' : 'border-neutral-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Right Column: Information, Variants & Actions (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                          In Stock ({selectedProduct.stockCount || 18} units left)
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{selectedProduct.rating}</span>
                          <span className="text-neutral-400 font-normal">
                            ({selectedProduct.reviewsCount || 64} Customer Reviews)
                          </span>
                        </div>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-serif font-black text-neutral-950">
                        {selectedProduct.name}
                      </h1>

                      <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-3xl font-black text-neutral-950 font-sans">
                          ${selectedProduct.price.toFixed(2)}
                        </span>
                        {selectedProduct.originalPrice && (
                          <span className="text-lg text-neutral-400 line-through">
                            ${selectedProduct.originalPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                          Free Express Shipping
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {selectedProduct.description}
                    </p>

                    {/* Color Variant Selector */}
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-2">
                          Select Color: <span className="font-normal text-neutral-600">{detailSelectedColor}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {selectedProduct.colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setDetailSelectedColor(color)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                detailSelectedColor === color
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size Variant Selector */}
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-2">
                          Select Size: <span className="font-normal text-neutral-600">{detailSelectedSize}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {selectedProduct.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setDetailSelectedSize(size)}
                              className={`w-10 h-10 rounded-xl text-xs font-bold border flex items-center justify-center transition-all cursor-pointer ${
                                detailSelectedSize === size
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector & Action Buttons */}
                    <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-200 rounded-xl bg-neutral-50 p-1">
                        <button
                          onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-extrabold text-neutral-900">
                          {detailQuantity}
                        </span>
                        <button
                          onClick={() => setDetailQuantity(detailQuantity + 1)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => {
                          onAddToCart(selectedProduct, detailQuantity, detailSelectedSize, detailSelectedColor);
                          onShowToast(
                            'Added to Cart',
                            `Added ${detailQuantity}x ${selectedProduct.name} (${detailSelectedSize}/${detailSelectedColor})`,
                            'cart'
                          );
                        }}
                        className="flex-1 py-3 px-5 rounded-xl bg-neutral-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        id="details-add-cart-btn"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#00ED64]" />
                        <span>Add to Cart • ${(selectedProduct.price * detailQuantity).toFixed(2)}</span>
                      </button>

                      {/* Buy Now -> Jump to Checkout */}
                      <button
                        onClick={() => {
                          onAddToCart(selectedProduct, detailQuantity, detailSelectedSize, detailSelectedColor);
                          setActiveTab('checkout');
                        }}
                        className="py-3 px-5 rounded-xl bg-[#001E2B] hover:bg-neutral-800 text-[#00ED64] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Buy Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Tabs: Description, Specs, Shipping */}
                    <div className="pt-4 border-t border-neutral-100">
                      <div className="flex border-b border-neutral-100 text-xs font-semibold">
                        <button
                          onClick={() => setDetailActiveSubTab('description')}
                          className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                            detailActiveSubTab === 'description'
                              ? 'border-neutral-900 text-neutral-950 font-bold'
                              : 'border-transparent text-neutral-400 hover:text-neutral-700'
                          }`}
                        >
                          Overview
                        </button>
                        <button
                          onClick={() => setDetailActiveSubTab('specs')}
                          className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                            detailActiveSubTab === 'specs'
                              ? 'border-neutral-900 text-neutral-950 font-bold'
                              : 'border-transparent text-neutral-400 hover:text-neutral-700'
                          }`}
                        >
                          Specifications
                        </button>
                        <button
                          onClick={() => setDetailActiveSubTab('reviews')}
                          className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                            detailActiveSubTab === 'reviews'
                              ? 'border-neutral-900 text-neutral-950 font-bold'
                              : 'border-transparent text-neutral-400 hover:text-neutral-700'
                          }`}
                        >
                          Reviews (4.9/5)
                        </button>
                      </div>

                      <div className="py-3 text-xs text-neutral-600 leading-relaxed">
                        {detailActiveSubTab === 'description' && (
                          <p>
                            Expertly handcrafted with sustainable materials and engineered for longevity. Comes in our
                            eco-friendly AURA signature gift packaging with certificates of authenticity.
                          </p>
                        )}
                        {detailActiveSubTab === 'specs' && (
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Material: Premium Grade A sustainably sourced composite</li>
                            <li>Origin: Designed in Milan & London Atelier</li>
                            <li>Warranty: 2-Year International Replacement Warranty</li>
                            <li>SKU: AUR-{selectedProduct.id.slice(0, 8).toUpperCase()}</li>
                          </ul>
                        )}
                        {detailActiveSubTab === 'reviews' && (
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-800">
                                <span>Sarah L. (Verified Buyer)</span>
                                <span className="text-amber-500">★★★★★</span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5">
                                "Exceeded all expectations! The quality and finish are absolutely sublime."
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: ADD TO CART (CART MANAGEMENT WORKSPACE) */}
          {/* ===================================================================== */}
          {activeTab === 'cart' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Cart Management</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Add to Cart & Bag</h2>
                  <p className="text-xs text-neutral-500">
                    Review selected items, apply promo codes, and configure quantities
                  </p>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty Cart</span>
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-800">Your shopping bag is empty</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Explore our luxury catalog and add your favorite pieces to manage your cart and proceed to checkout.
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    Browse Catalog Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Cart Items List (7 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-3xl border border-neutral-200/80 p-4 sm:p-5 flex gap-4 items-center shadow-xs"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-2xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                                {item.product.name}
                              </h4>
                              <p className="text-[11px] text-neutral-500 mt-0.5">
                                Variant: {item.selectedSize || 'M'} / {item.selectedColor || 'Standard'}
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveCartItem(item.id)}
                              className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 p-0.5">
                              <button
                                onClick={() => onUpdateCartItemQuantity(item.id, item.quantity - 1)}
                                className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-neutral-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateCartItemQuantity(item.id, item.quantity + 1)}
                                className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-neutral-400 font-normal">
                                ${item.product.price.toFixed(2)} each
                              </div>
                              <div className="text-sm font-black text-neutral-950">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Promo Code Input Box */}
                    <form
                      onSubmit={handleApplyPromo}
                      className="bg-white p-4 rounded-3xl border border-neutral-200/80 flex gap-2"
                    >
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="Promo code (e.g. AURA15-WELCOME, VIP20)"
                          className="w-full pl-10 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs uppercase font-semibold focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Order Summary & Proceed to Place Order (5 cols) */}
                  <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-neutral-900">Order Summary</h3>

                    <div className="space-y-2.5 text-xs text-neutral-600 pb-4 border-b border-neutral-100">
                      <div className="flex justify-between">
                        <span>Cart Subtotal</span>
                        <span className="font-bold text-neutral-900">${cartSubtotal.toFixed(2)}</span>
                      </div>

                      {appliedDiscount && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Discount ({appliedDiscount.code})</span>
                          </span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Estimated Shipping</span>
                        <span className="font-bold text-emerald-700">
                          {shippingCost === 0 ? 'FREE (Standard)' : `$${shippingCost.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Estimated Tax (8%)</span>
                        <span className="font-bold text-neutral-900">${estimatedTax.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-sm font-bold text-neutral-900">Total Due</span>
                      <span className="text-2xl font-black text-neutral-950">${orderTotal.toFixed(2)}</span>
                    </div>

                    {/* Action Button: Proceed to Place Order */}
                    <button
                      onClick={() => setActiveTab('checkout')}
                      className="w-full py-3.5 rounded-xl bg-[#001E2B] hover:bg-[#00A35C] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      id="cart-proceed-checkout-btn"
                    >
                      <span>Proceed to Place Order (Phase 1)</span>
                      <ArrowRight className="w-4 h-4 text-[#00ED64]" />
                    </button>

                    <p className="text-[11px] text-center text-neutral-400">
                      🔒 Guaranteed safe checkout with MongoDB persistence
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: PLACE ORDER (CHECKOUT & SHIPPING INFORMATION) */}
          {/* ===================================================================== */}
          {activeTab === 'checkout' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                  <CheckSquare className="w-4 h-4" />
                  <span>Phase 1 of Payment System</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Place Order & Delivery Info</h2>
                <p className="text-xs text-neutral-500">
                  Verify shipping address and courier dispatch method before finalizing payment
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Shipping Details Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>1. Shipping & Customer Details</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={shippingEmail}
                        onChange={(e) => setShippingEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Country / Region</label>
                      <input
                        type="text"
                        value={shippingCountry}
                        onChange={(e) => setShippingCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-neutral-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={shippingStreet}
                      onChange={(e) => setShippingStreet(e.target.value)}
                      placeholder="Street number, building, suite..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={shippingPostal}
                        onChange={(e) => setShippingPostal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Courier Method Selection */}
                  <div className="pt-3 border-t border-neutral-100">
                    <h4 className="text-xs font-bold text-neutral-900 mb-2.5">2. Select Shipping Courier</h4>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                          shippingMethod === 'standard'
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'standard'}
                            onChange={() => setShippingMethod('standard')}
                            className="accent-neutral-950"
                          />
                          <div>
                            <div className="font-bold text-neutral-900">Standard Insured Delivery (3-5 Days)</div>
                            <div className="text-[11px] text-neutral-500">FedEx Ground with carbon-neutral tracking</div>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-700">FREE</span>
                      </label>

                      <label
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                          shippingMethod === 'express'
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'express'}
                            onChange={() => setShippingMethod('express')}
                            className="accent-neutral-950"
                          />
                          <div>
                            <div className="font-bold text-neutral-900">AURA Express Courier (1-2 Days)</div>
                            <div className="text-[11px] text-neutral-500">DHL Express Priority with direct hand-off</div>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-900">$12.00</span>
                      </label>

                      <label
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                          shippingMethod === 'overnight'
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'overnight'}
                            onChange={() => setShippingMethod('overnight')}
                            className="accent-neutral-950"
                          />
                          <div>
                            <div className="font-bold text-neutral-900">Next-Morning VIP Priority (Next Day)</div>
                            <div className="text-[11px] text-neutral-500">White-glove guaranteed AM delivery</div>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-900">$25.00</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Checkout Summary & Move to Phase 2 (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900">Review & Continue</h3>

                  {/* Items in Checkout Preview */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-neutral-500">{item.quantity}x</span>
                          <span className="text-neutral-800 truncate max-w-[170px]">{item.product.name}</span>
                        </div>
                        <span className="font-bold text-neutral-950">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-neutral-900">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping ({shippingMethod})</span>
                      <span className="font-bold text-neutral-900">
                        {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Tax (8%)</span>
                      <span className="font-bold text-neutral-900">${estimatedTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-neutral-100 text-sm font-extrabold text-neutral-950">
                      <span>Total Amount</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Transition to Phase 2: Make Payment */}
                  <button
                    onClick={() => {
                      if (!shippingName.trim() || !shippingStreet.trim()) {
                        onShowToast('Missing Fields', 'Please complete the shipping name and address.', 'info');
                        return;
                      }
                      setActiveTab('payment');
                    }}
                    className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="checkout-proceed-payment-btn"
                  >
                    <span>Proceed to Make Payment (Phase 2)</span>
                    <ArrowRight className="w-4 h-4 text-[#00ED64]" />
                  </button>

                  <button
                    onClick={() => setActiveTab('cart')}
                    className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-900 font-semibold text-center cursor-pointer"
                  >
                    Back to Edit Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 6: MAKE PAYMENT (PAYMENT SYSTEM PHASE 2) */}
          {/* ===================================================================== */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Phase 2 Payment Gateway Console</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Make Payment</h2>
                <p className="text-xs text-neutral-500">
                  Select payment gateway, verify end-to-end encrypted transaction, and persist order to MongoDB
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Gateway Selection & Card Simulation (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
                  
                  {/* Gateway Selector Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
                    <button
                      onClick={() => setPaymentGateway('paystack')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                        paymentGateway === 'paystack'
                          ? 'border-[#00C3F7] bg-[#001328] text-white ring-2 ring-[#00C3F7]/50 shadow-md'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mx-auto mb-1 text-[#00C3F7]" />
                      <span className="font-extrabold text-[#00C3F7]">Paystack</span>
                      <span className="absolute -top-2 right-1 px-1.5 py-0.2 bg-[#00ED64] text-[#001E2B] text-[8px] font-black rounded-full shadow-xs">
                        FAST
                      </span>
                    </button>
                    <button
                      onClick={() => setPaymentGateway('card')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentGateway === 'card'
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      <span>Credit Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentGateway('applepay')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentGateway === 'applepay'
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 mx-auto mb-1" />
                      <span>Apple Pay</span>
                    </button>
                    <button
                      onClick={() => setPaymentGateway('paypal')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentGateway === 'paypal'
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mx-auto mb-1" />
                      <span>PayPal</span>
                    </button>
                    <button
                      onClick={() => setPaymentGateway('crypto')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentGateway === 'crypto'
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Lock className="w-4 h-4 mx-auto mb-1" />
                      <span>Crypto</span>
                    </button>
                  </div>

                  {/* Paystack Payment View */}
                  {paymentGateway === 'paystack' && (
                    <div className="p-5 rounded-2xl bg-linear-to-br from-[#001E2B] via-[#001328] to-[#00283b] text-white border border-[#00C3F7]/40 shadow-lg space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-ping" />
                          <span className="text-xs font-mono font-bold tracking-widest text-[#00C3F7]">
                            PAYSTACK SECURE CHECKOUT
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00C3F7]/20 text-[#00C3F7] border border-[#00C3F7]/40 font-bold">
                          PCI-DSS LEVEL 1
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs text-neutral-200 leading-relaxed">
                          Pay directly with <strong className="text-white">Debit/Credit Card (Visa, Mastercard, Verve)</strong>, <strong className="text-white">Bank Transfer</strong>, <strong className="text-white">USSD</strong>, or <strong className="text-white">Mobile Money</strong>.
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Clicking the authorize button below will launch the official encrypted Paystack popup modal.
                        </p>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Account billing email:</span>
                        <span className="font-mono text-[#00ED64] font-semibold">
                          {shippingEmail || currentUser?.email || 'customer@aura.store'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Credit Card Input Form with Live Card Preview */}
                  {paymentGateway === 'card' && (
                    <div className="space-y-4">
                      {/* Virtual Card Graphic */}
                      <div className="p-5 rounded-2xl bg-linear-to-br from-neutral-900 via-neutral-800 to-[#001E2B] text-white shadow-lg space-y-4 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono tracking-widest text-[#00ED64]">AURA PLATINUM</span>
                          <span className="text-xs font-bold">VISA / MASTERCARD</span>
                        </div>
                        <div className="text-lg sm:text-xl font-mono tracking-wider pt-2">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className="flex justify-between text-xs text-neutral-300 font-mono">
                          <div>
                            <div className="text-[9px] uppercase text-neutral-400">Card Holder</div>
                            <div>{cardHolder || 'VALUED CUSTOMER'}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase text-neutral-400">Expires</div>
                            <div>{cardExpiry || 'MM/YY'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Card Input Fields */}
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-semibold text-neutral-700 mb-1">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs focus:outline-none focus:border-neutral-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-neutral-700 mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              placeholder="Alex Morgan"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-neutral-700 mb-1">Expires</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12/28"
                                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs focus:outline-none focus:border-neutral-900 text-center"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-neutral-700 mb-1">CVC / CVV</label>
                              <input
                                type="text"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="888"
                                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs focus:outline-none focus:border-neutral-900 text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alternative Gateway Placeholders */}
                  {paymentGateway === 'applepay' && (
                    <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
                      <DollarSign className="w-8 h-8 text-neutral-900 mx-auto" />
                      <h4 className="text-xs font-bold text-neutral-900">Apple Pay Express Touch ID</h4>
                      <p className="text-[11px] text-neutral-500">
                        Authenticate directly with your Apple Wallet pass or Touch ID biometrics.
                      </p>
                    </div>
                  )}

                  {paymentGateway === 'paypal' && (
                    <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
                      <h4 className="text-xs font-bold text-neutral-900">PayPal One-Touch Checkout</h4>
                      <p className="text-[11px] text-neutral-500">
                        Pay with PayPal Buyer Protection and deferred 0% interest financing.
                      </p>
                    </div>
                  )}

                  {paymentGateway === 'crypto' && (
                    <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
                      <Lock className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="text-xs font-bold text-neutral-900">Web3 USDC / Bitcoin Direct</h4>
                      <p className="text-[11px] text-neutral-500">
                        Zero gas fee instantaneous settlement via Solana or Ethereum L2 networks.
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>256-Bit SSL Encryption • PCI-DSS Level 1 Certified Transaction Engine</span>
                  </div>
                </div>

                {/* Right Column: Final Payment Confirmation & MongoDB Trigger (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900">Payment Authorization</h3>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
                    <div className="font-bold text-neutral-900">Shipping To:</div>
                    <div className="text-neutral-700">{shippingName}</div>
                    <div className="text-neutral-500 text-[11px]">
                      {shippingStreet}, {shippingCity}, {shippingPostal}, {shippingCountry}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-bold text-neutral-900">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Discount ({appliedDiscount.code})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Courier Shipping</span>
                      <span className="font-bold text-neutral-900">${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span className="font-bold text-neutral-900">${estimatedTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-neutral-100 text-base font-black text-neutral-950">
                      <span>Grand Total</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Primary Trigger Button: Authorize Payment */}
                  {paystackStatusMsg && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00C3F7] shrink-0" />
                      <span>{paystackStatusMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleExecutePayment}
                    disabled={isProcessingPayment}
                    className="w-full py-4 rounded-xl bg-[#001E2B] hover:bg-[#00A35C] text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    id="execute-payment-btn"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00ED64]" />
                        <span>{paymentGateway === 'paystack' ? 'Processing Paystack Payment...' : 'Processing & Storing in MongoDB...'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#00ED64]" />
                        <span>{paymentGateway === 'paystack' ? 'Pay with Paystack' : 'Authorize & Pay'} ${orderTotal.toFixed(2)}</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-neutral-400 text-center">
                    By clicking Authorize, your order is recorded in MongoDB and tracked in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 7: TRACK ORDER */}
          {/* ===================================================================== */}
          {activeTab === 'track' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Tracker Search Header */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                    <Truck className="w-4 h-4" />
                    <span>Real-time Courier Dispatch Tracker</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Track Order</h2>
                  <p className="text-xs text-neutral-500">
                    Live GPS courier telemetry and milestone checkpoint timestamps
                  </p>
                </div>

                <form onSubmit={handleSearchTracking} className="flex gap-2">
                  <div className="relative flex-1">
                    <Package className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      placeholder="Enter Tracking ID or Order # (e.g. ORD-198234 or TRK-AURA-9821)"
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono font-semibold focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-neutral-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Track Package
                  </button>
                </form>
              </div>

              {/* Active Tracking Details */}
              {activeTrackOrder ? (
                <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Order Top Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Order Reference</span>
                      <h3 className="text-lg font-black text-neutral-950 font-mono">#{activeTrackOrder.orderId}</h3>
                      <p className="text-xs text-neutral-500">
                        Placed on {new Date(activeTrackOrder.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Carrier</span>
                        <div className="text-xs font-bold text-neutral-900">DHL Express Priority Air</div>
                        <div className="text-[10px] text-emerald-600 font-mono">AWB: DHL-9842109482-US</div>
                      </div>
                      <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                        {activeTrackOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Visual Step-by-Step Progress Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 mb-6">Shipment Milestones</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                      {/* Step 1: Confirmed */}
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs relative">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 font-bold shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-emerald-950">1. Order Placed</div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">Payment Verified</div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-2">MongoDB Stored</div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs relative">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 font-bold shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-emerald-950">2. Quality Inspected</div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">AURA Atelier Packing</div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-2">Sealed in Milan</div>
                      </div>

                      {/* Step 3: In Transit */}
                      <div className="p-4 rounded-2xl bg-neutral-900 text-white text-xs relative shadow-md">
                        <div className="w-7 h-7 rounded-full bg-[#00ED64] text-neutral-950 flex items-center justify-center mb-2 font-bold shadow-xs">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-white">3. In Transit</div>
                        <div className="text-[11px] text-neutral-300 mt-0.5">En Route via DHL Express</div>
                        <div className="text-[10px] text-[#00ED64] font-mono mt-2">Active Telemetry</div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs relative opacity-70">
                        <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center mb-2 font-bold">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-neutral-700">4. Out for Delivery</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Estimated Tomorrow 10 AM</div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-2">Signature Required</div>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items in Tracked Package */}
                  <div className="pt-4 border-t border-neutral-100">
                    <h4 className="text-xs font-bold text-neutral-900 mb-3">Package Contents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeTrackOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3 text-xs"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover bg-neutral-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-neutral-900 truncate">{item.name}</div>
                            <div className="text-[11px] text-neutral-500">
                              Qty: {item.quantity} • ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination Address */}
                  {activeTrackOrder.shippingAddress && (
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-neutral-900">Destination Delivery Address: </span>
                        <span className="text-neutral-600">{activeTrackOrder.shippingAddress}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
                  <Truck className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h3 className="text-base font-bold text-neutral-800">No active tracking selected</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Place an order or select an order from your history to track real-time delivery status.
                  </p>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                  >
                    View Order History
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 8: VIEW ORDER HISTORY */}
          {/* ===================================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                    <History className="w-4 h-4" />
                    <span>MongoDB Persistent Order History</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-950">Order History</h2>
                  <p className="text-xs text-neutral-500">
                    {orderHistory.length} orders retrieved directly from MongoDB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadUserOrderHistory}
                    className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {historyLoading ? (
                <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center text-xs text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  <span>Querying MongoDB orders collection...</span>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-4">
                  <History className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h3 className="text-base font-bold text-neutral-800">No previous orders recorded</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    When you place orders through our portal, your official receipts and tracking IDs are stored here.
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs hover:border-neutral-300 transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-neutral-900 text-[#00ED64]">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-neutral-950">Order #{order.orderId}</div>
                            <div className="text-[11px] text-neutral-500">
                              {new Date(order.createdAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                            {order.status}
                          </span>
                          <span className="text-sm font-black text-neutral-950">
                            ${order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center gap-3 text-xs"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover bg-neutral-200 shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-neutral-900 truncate">{item.name}</div>
                              <div className="text-[11px] text-neutral-500">
                                {item.quantity}x • ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-neutral-500 text-[11px]">
                          Payment: <span className="font-semibold text-neutral-800">{order.paymentMethod || 'Credit Card'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Track Button */}
                          <button
                            onClick={() => {
                              setActiveTrackOrder(order);
                              setTrackQuery(order.orderId);
                              setActiveTab('track');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track Package</span>
                          </button>

                          {/* Re-Order Button */}
                          <button
                            onClick={() => {
                              order.items.forEach((it) => {
                                const found = catalogProducts.find((p) => p.id === it.id) || {
                                  id: it.id,
                                  name: it.name,
                                  price: it.price,
                                  image: it.image || '',
                                  category: 'Fashion',
                                  rating: 5.0,
                                  description: 'Re-ordered luxury item',
                                };
                                onAddToCart(found as Product, it.quantity, it.size, it.color);
                              });
                              onShowToast('Items Added', 'Order items added to your cart.', 'cart');
                              setActiveTab('cart');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-[#00ED64]" />
                            <span>Re-Order</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
