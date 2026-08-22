import React, { useState, useEffect } from 'react';
import { TopAnnouncement } from './components/TopAnnouncement';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustFeatures } from './components/TrustFeatures';
import { CategoryGrid } from './components/CategoryGrid';
import { NewArrivals } from './components/NewArrivals';
import { BestSellers } from './components/BestSellers';
import { PromoBanners } from './components/PromoBanners';
import { BottomTrust } from './components/BottomTrust';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { QuickViewModal } from './components/QuickViewModal';
import { AccountModal } from './components/AccountModal';
import { AzureStorageModal } from './components/AzureStorageModal';
import { MongoDatabaseModal } from './components/MongoDatabaseModal';
import { AdminLoginSection } from './components/AdminLoginSection';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CustomerDashboard, DashboardTab } from './components/CustomerDashboard';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { ToastContainer } from './components/Toast';
import { NEW_ARRIVALS, BEST_SELLERS, ALL_PRODUCTS, CATEGORIES } from './data/mockData';
import { Product, CartItem, NotificationToast, User, AdminDashboardTab, AdminProductInput } from './types';
import { backupOrderReceiptToAzure } from './services/azureStorage';
import { 
  placeOrderInMongo, 
  getProductsFromMongo, 
  createProductInMongo, 
  updateProductInMongo, 
  deleteProductFromMongo, 
  seedMongoCatalog 
} from './services/mongoService';
import { fetchCurrentUser, getStoredUser, clearSession } from './services/authService';

export default function App() {
  // Page View State ('store' | 'dashboard' | 'admin')
  const [currentView, setCurrentView] = useState<'store' | 'dashboard' | 'admin'>('store');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('browse');
  const [dashboardProduct, setDashboardProduct] = useState<Product | null>(null);
  const [adminTab, setAdminTab] = useState<AdminDashboardTab>('products');

  // Navigation State
  const [activeNav, setActiveNav] = useState('home');

  // Customer Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());

  // Dynamic Catalog State (backed by MongoDB)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(ALL_PRODUCTS);
  const [newArrivals, setNewArrivals] = useState<Product[]>(NEW_ARRIVALS);
  const [bestSellers, setBestSellers] = useState<Product[]>(BEST_SELLERS);

  // Cart State (Initialized with 1 sample item for immediate delight)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'cart-init-1',
      product: NEW_ARRIVALS[0],
      quantity: 1,
      selectedSize: 'M',
      selectedColor: 'Oatmeal',
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist State (Initialized with 1 sample item)
  const [wishlist, setWishlist] = useState<Product[]>([
    NEW_ARRIVALS[3] // Classic Polarized Wayfarer
  ]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAzureStorageOpen, setIsAzureStorageOpen] = useState(false);
  const [isMongoDbOpen, setIsMongoDbOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync products from MongoDB on load
  const loadMongoCatalog = async () => {
    try {
      const prods = await getProductsFromMongo();
      if (prods && prods.length > 0) {
        setCatalogProducts(prods);
        setNewArrivals(prods.slice(0, 4));
        setBestSellers(prods.slice(4, 8).length > 0 ? prods.slice(4, 8) : prods.slice(0, 4));
      }
    } catch (e) {
      console.warn('Could not load MongoDB products initially', e);
    }
  };

  useEffect(() => {
    loadMongoCatalog();
    fetchCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Toast Notifications
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'cart' | 'wishlist' = 'success') => {
    const newToast: NotificationToast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart Handlers
  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    color?: string,
    size?: string
  ) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `cart-${product.id}-${Date.now()}`,
            product,
            quantity,
            selectedColor: color || product.colors?.[0]?.name,
            selectedSize: size || product.sizes?.[0],
          }
        ];
      }
    });

    addToast('Added to Cart', `${product.name} (x${quantity}) has been added to your shopping cart.`, 'cart');
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    const item = cartItems.find((i) => i.id === cartItemId);
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
    if (item) {
      addToast('Item Removed', `${item.product.name} was removed from your cart.`, 'info');
    }
  };

  // Open Customer Dashboard helper
  const openCustomerDashboard = (tab: DashboardTab = 'browse', product?: Product) => {
    setDashboardTab(tab);
    if (product) {
      setDashboardProduct(product);
    }
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdminDashboard = (tab: AdminDashboardTab = 'products') => {
    setAdminTab(tab);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Catalog CRUD Operations
  const handleAddProduct = async (productInput: AdminProductInput) => {
    const res = await createProductInMongo(productInput);
    if (res.success && res.product) {
      setCatalogProducts((prev) => [res.product!, ...prev]);
      setNewArrivals((prev) => [res.product!, ...prev.slice(0, 3)]);
    } else {
      throw new Error(res.error || 'Failed to create product');
    }
  };

  const handleEditProduct = async (id: string, productInput: AdminProductInput) => {
    const res = await updateProductInMongo(id, productInput);
    if (res.success && res.product) {
      setCatalogProducts((prev) => prev.map((p) => (p.id === id ? res.product! : p)));
      setNewArrivals((prev) => prev.map((p) => (p.id === id ? res.product! : p)));
      setBestSellers((prev) => prev.map((p) => (p.id === id ? res.product! : p)));
    } else {
      throw new Error(res.error || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await deleteProductFromMongo(id);
    if (res.success) {
      setCatalogProducts((prev) => prev.filter((p) => p.id !== id));
      setNewArrivals((prev) => prev.filter((p) => p.id !== id));
      setBestSellers((prev) => prev.filter((p) => p.id !== id));
    } else {
      throw new Error(res.error || 'Failed to delete product');
    }
  };

  const handleSeedDatabase = async () => {
    const res = await seedMongoCatalog(ALL_PRODUCTS, CATEGORIES);
    if (res.success) {
      await loadMongoCatalog();
    } else {
      throw new Error(res.error || 'Failed to seed database');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    openCustomerDashboard('checkout');
    addToast('Checkout Portal', 'Review your cart and proceed with order placement in the Customer Dashboard.', 'info');
  };

  // Wishlist Handlers
  const handleToggleWishlist = (product: Product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      addToast('Removed from Wishlist', `${product.name} was removed from your wishlist.`, 'info');
    } else {
      setWishlist((prev) => [...prev, product]);
      addToast('Added to Wishlist', `${product.name} has been saved to your wishlist.`, 'wishlist');
    }
  };

  const handleRemoveFromWishlist = (product: Product) => {
    setWishlist((prev) => prev.filter((item) => item.id !== product.id));
  };

  // Category Filtering / Jump
  const handleSelectCategory = (categoryName: string) => {
    const catElem = document.getElementById('new-arrivals');
    if (catElem) {
      catElem.scrollIntoView({ behavior: 'smooth' });
    }
    addToast('Category Selected', `Showing latest picks for ${categoryName}.`, 'info');
  };

  // Scroll to section helper
  const scrollTo = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveNav(id);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // If user navigated to Customer Dashboard, render the full separate dashboard page
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFB] selection:bg-[#FF5A1F] selection:text-white">
        <CustomerDashboard
          onBackToStore={() => setCurrentView('store')}
          currentUser={currentUser}
          onUserChange={(user) => setCurrentUser(user)}
          cartItems={cartItems}
          onUpdateCartItemQuantity={handleUpdateCartQuantity}
          onRemoveCartItem={handleRemoveCartItem}
          onAddToCart={handleAddToCart}
          onClearCart={() => setCartItems([])}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onShowToast={(title, msg, type) => addToast(title, msg, type)}
          onOpenAdminDashboard={() => openAdminDashboard('products')}
          initialTab={dashboardTab}
          initialProduct={dashboardProduct}
          catalogProducts={catalogProducts}
        />

        {/* Global Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // If user navigated to Dedicated Admin Dashboard, render the full separate admin dashboard page
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-[#070A0D] text-slate-100">
        <AdminDashboardPage
          currentUser={currentUser}
          onLogout={() => {
            clearSession();
            setCurrentUser(null);
            setCurrentView('store');
            addToast('Admin Session Ended', 'You have been safely signed out.', 'info');
          }}
          onBackToStore={() => setCurrentView('store')}
          products={catalogProducts}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onSeedDatabase={handleSeedDatabase}
          onOpenMongoDatabase={() => setIsMongoDbOpen(true)}
          onOpenAzureStorage={() => setIsAzureStorageOpen(true)}
          onShowToast={(title, msg, type) => addToast(title, msg, type)}
          categories={Array.from(new Set(catalogProducts.map((p) => p.category)))}
          initialTab={adminTab}
        />

        {/* Global Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8] selection:bg-[#FF5A1F] selection:text-white">
      
      {/* 1. Top Announcement Bar */}
      <TopAnnouncement />

      {/* 2. Main Navigation Bar */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenAdminDashboard={() => openAdminDashboard('products')}
        onOpenAzureStorage={() => setIsAzureStorageOpen(true)}
        onOpenMongoDatabase={() => setIsMongoDbOpen(true)}
        onOpenCustomerDashboard={openCustomerDashboard}
        activeNav={activeNav}
        onSelectNav={scrollTo}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 3. Hero Section */}
        <Hero
          onShopNow={() => scrollTo('new-arrivals')}
          onExplore={() => scrollTo('categories')}
          onQuickView={(p) => setQuickViewProduct(p)}
          onAddToCart={handleAddToCart}
        />

        {/* 4. Service/Trust Features Row (First Trust Row) */}
        <TrustFeatures />

        {/* 5. Shop by Categories */}
        <CategoryGrid
          onSelectCategory={handleSelectCategory}
          onViewAllCategories={() => scrollTo('categories')}
        />

        {/* 6. New Arrivals Section */}
        <NewArrivals
          products={newArrivals}
          wishlistIds={wishlist.map((w) => w.id)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onQuickView={(p) => setQuickViewProduct(p)}
          onViewAll={() => scrollTo('best-sellers')}
        />

        {/* 7. Best Sellers Section */}
        <BestSellers
          wishlistIds={wishlist.map((w) => w.id)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onQuickView={(p) => setQuickViewProduct(p)}
          onViewAll={() => scrollTo('new-arrivals')}
        />

        {/* 8. Promotional Banner Section (Flash Sale & New Collection) */}
        <PromoBanners
          onShopFlashSale={() => {
            const product = bestSellers[0] || BEST_SELLERS[0];
            setQuickViewProduct(product);
          }}
          onShopNewCollection={() => scrollTo('new-arrivals')}
        />

        {/* 9. Dedicated Master Administrator Gateway on Landing Page */}
        <AdminLoginSection
          currentUser={currentUser}
          onUserChange={(user) => setCurrentUser(user)}
          onOpenMongoDatabase={() => setIsMongoDbOpen(true)}
          onOpenAzureStorage={() => setIsAzureStorageOpen(true)}
          onOpenCustomerDashboard={openCustomerDashboard}
          onOpenAdminDashboard={() => openAdminDashboard('products')}
          onShowToast={(title, msg, type) => addToast(title, msg, type)}
        />

        {/* 10. Bottom Trust Features (Second Trust Row) */}
        <BottomTrust />
      </main>

      {/* 11. Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onShowToast={(title, msg) => addToast(title, msg, 'info')}
        onOpenAzureStorage={() => setIsAzureStorageOpen(true)}
        onOpenMongoDatabase={() => setIsMongoDbOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenAdminDashboard={() => openAdminDashboard('products')}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />

      {/* Slide-over Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemove={handleRemoveFromWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onQuickView={(p) => setQuickViewProduct(p)}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        products={catalogProducts}
      />

      {/* Quick View Product Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        isWishlisted={quickViewProduct ? wishlist.some((w) => w.id === quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      {/* Account / Sign In Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
        onShowToast={(title, msg, type) => addToast(title, msg, type)}
        onOpenCustomerDashboard={openCustomerDashboard}
      />

      {/* Dedicated Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
        onShowToast={(title, msg, type) => addToast(title, msg, type)}
        onOpenMongoDatabase={() => setIsMongoDbOpen(true)}
        onOpenAdminDashboard={() => openAdminDashboard('products')}
      />

      {/* Azure Storage Account Modal */}
      <AzureStorageModal
        isOpen={isAzureStorageOpen}
        onClose={() => setIsAzureStorageOpen(false)}
        onShowToast={(title, msg, type) => addToast(title, msg, type)}
      />

      {/* MongoDB Database Explorer Modal */}
      <MongoDatabaseModal
        isOpen={isMongoDbOpen}
        onClose={() => setIsMongoDbOpen(false)}
        onShowToast={(title, msg, type) => addToast(title, msg, type)}
        onRefreshCatalog={loadMongoCatalog}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
