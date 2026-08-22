import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Server, 
  Layers, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Activity, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Code,
  Search,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { MongoStatusResponse, getMongoDatabaseStatus, getProductsFromMongo, createProductInMongo, deleteProductFromMongo, seedMongoCatalog, getOrdersFromMongo, getMongoActivityLogs } from '../services/mongoService';
import { Product, MongoOrder, MongoActivityLog } from '../types';
import { ALL_PRODUCTS, CATEGORIES } from '../data/mockData';

interface MongoDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'cart' | 'wishlist') => void;
  onRefreshCatalog?: () => void;
}

export const MongoDatabaseModal: React.FC<MongoDatabaseModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onRefreshCatalog,
}) => {
  const [dataStatus, setDataStatus] = useState<MongoStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<'collections' | 'add-product' | 'orders' | 'logs' | 'config'>('collections');
  const [selectedCollection, setSelectedCollection] = useState<'products' | 'orders' | 'logs'>('products');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MongoOrder[]>([]);
  const [logs, setLogs] = useState<MongoActivityLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUriSnippet, setCopiedUriSnippet] = useState(false);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Fashion');
  const [newProdPrice, setNewProdPrice] = useState('149');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('199');
  const [newProdTag, setNewProdTag] = useState('New Arrival');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Load status and initial collection
  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadCollectionData(selectedCollection);
    }
  }, [isOpen, selectedCollection]);

  const loadStatus = async () => {
    setLoadingStatus(true);
    const res = await getMongoDatabaseStatus();
    setDataStatus(res);
    setLoadingStatus(false);
  };

  const loadCollectionData = async (col: 'products' | 'orders' | 'logs') => {
    setLoadingData(true);
    if (col === 'products') {
      const items = await getProductsFromMongo();
      setProducts(items);
    } else if (col === 'orders') {
      const ords = await getOrdersFromMongo();
      setOrders(ords);
    } else if (col === 'logs') {
      const actLogs = await getMongoActivityLogs();
      setLogs(actLogs);
    }
    setLoadingData(false);
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await seedMongoCatalog(ALL_PRODUCTS, CATEGORIES);
      if (res.success) {
        onShowToast('MongoDB Seeded', res.message || 'Catalog seeded into MongoDB collections.', 'success');
        loadStatus();
        loadCollectionData(selectedCollection);
        if (onRefreshCatalog) onRefreshCatalog();
      } else {
        onShowToast('Seed Failed', res.error || 'Could not seed MongoDB', 'info');
      }
    } catch (err: any) {
      onShowToast('Seed Error', err.message, 'info');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}" from MongoDB?`)) return;

    const res = await deleteProductFromMongo(id);
    if (res.success) {
      onShowToast('Product Deleted', `Removed "${name}" from MongoDB 'products' collection.`, 'info');
      setProducts((prev) => prev.filter((p) => p.id !== id));
      loadStatus();
      if (onRefreshCatalog) onRefreshCatalog();
    } else {
      onShowToast('Delete Failed', res.error || 'Could not delete product.', 'info');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      onShowToast('Missing Field', 'Please enter a product name.', 'info');
      return;
    }

    setSubmittingProduct(true);
    try {
      const priceNum = parseFloat(newProdPrice) || 99;
      const origNum = newProdOriginalPrice ? parseFloat(newProdOriginalPrice) : undefined;
      const discount = origNum && origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : undefined;

      const newProductPayload: Partial<Product> = {
        name: newProdName.trim(),
        category: newProdCategory,
        price: priceNum,
        originalPrice: origNum,
        discountPercent: discount,
        tag: newProdTag,
        image: newProdImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop',
        description: newProdDesc.trim() || 'Premium lifestyle modern item crafted with high-durability sustainable materials.',
        rating: 5.0,
        reviewsCount: 1,
        inStock: true,
        colors: [
          { name: 'Onyx Black', hex: '#1A1A1A' },
          { name: 'Vibrant Orange', hex: '#FF5A1F' },
        ],
        sizes: ['S', 'M', 'L'],
      };

      const res = await createProductInMongo(newProductPayload);
      if (res.success && res.product) {
        onShowToast('Product Saved in MongoDB', `"${res.product.name}" inserted into 'products' collection.`, 'success');
        setNewProdName('');
        setNewProdDesc('');
        setActiveTab('collections');
        setSelectedCollection('products');
        loadStatus();
        loadCollectionData('products');
        if (onRefreshCatalog) onRefreshCatalog();
      } else {
        onShowToast('Insert Failed', res.error || 'Failed to save product in MongoDB.', 'info');
      }
    } catch (err: any) {
      onShowToast('Insert Error', err.message, 'info');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const copyConfigSnippet = () => {
    const snippet = `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/aura_ecommerce?retryWrites=true&w=majority\nMONGODB_DB_NAME=aura_ecommerce`;
    navigator.clipboard.writeText(snippet);
    setCopiedUriSnippet(true);
    setTimeout(() => setCopiedUriSnippet(false), 2000);
    onShowToast('Copied', 'MongoDB configuration snippet copied.', 'info');
  };

  if (!isOpen) return null;

  const isLiveConnected = dataStatus?.status.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        id="mongodb-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8F8F8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#001E2B] text-[#00ED64] flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1A1A1A]">MongoDB Database Explorer</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isLiveConnected 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isLiveConnected ? 'MongoDB Live Cluster' : 'MongoDB Ready / Active'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Manage persistent product catalog, live customer orders, subscriber collections, and audit logs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
            id="close-mongodb-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagnostic Metrics Bar */}
        <div className="px-6 py-3 bg-[#F3F4F6] border-b border-gray-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-gray-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Database</p>
              <p className="font-bold text-[#1A1A1A] truncate">{dataStatus?.status.dbName || 'aura_ecommerce'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Latency / Host</p>
              <p className="font-bold text-[#1A1A1A] truncate">
                {dataStatus?.status.pingMs ? `${dataStatus.status.pingMs}ms • ` : ''}{dataStatus?.status.host || 'MongoDB'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Products</p>
              <p className="font-bold text-[#FF5A1F]">{dataStatus?.counts.products ?? products.length} Docs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Orders</p>
              <p className="font-bold text-emerald-600">{dataStatus?.counts.orders ?? orders.length} Orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Customers</p>
              <p className="font-bold text-[#001E2B]">{dataStatus?.counts.users ?? 0} Accounts</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-gray-200 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'collections'
                  ? 'border-[#00ED64] text-[#1A1A1A]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00A35C]" />
              <span>Collections Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('add-product')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'add-product'
                  ? 'border-[#00ED64] text-[#1A1A1A]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#00A35C]" />
              <span>Insert Product</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-[#00ED64] text-[#1A1A1A]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#00A35C]" />
              <span>Customer Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'border-[#00ED64] text-[#1A1A1A]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#00A35C]" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'config'
                  ? 'border-[#00ED64] text-[#1A1A1A]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-[#00A35C]" />
              <span>Connection Guide</span>
            </button>
          </div>

          <div className="flex items-center gap-2 py-2 shrink-0">
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="px-3 py-1.5 bg-[#001E2B] hover:bg-[#003B46] text-[#00ED64] rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Populate MongoDB with default catalog data"
              id="seed-mongodb-btn"
            >
              <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding...' : 'Seed Catalog to MongoDB'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: COLLECTIONS EXPLORER */}
          {activeTab === 'collections' && (
            <div className="space-y-4">
              {/* Collection Pills & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Collection:</span>
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setSelectedCollection('products')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        selectedCollection === 'products' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      <ShoppingBag className="w-3 h-3 text-[#FF5A1F]" />
                      <span>products ({dataStatus?.counts.products ?? products.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedCollection('orders')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        selectedCollection === 'orders' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      <ShoppingCart className="w-3 h-3 text-emerald-600" />
                      <span>orders ({dataStatus?.counts.orders ?? orders.length})</span>
                    </button>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  />
                </div>
              </div>

              {/* Products List View */}
              {selectedCollection === 'products' && (
                <div>
                  {loadingData ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#00ED64] mb-2" />
                      <p className="text-xs">Querying MongoDB 'products' collection...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-700">No products in MongoDB yet</p>
                      <p className="text-[11px] text-gray-400 mt-1 mb-3">Click 'Seed Catalog to MongoDB' to insert curated items or use the Insert tab.</p>
                      <button
                        onClick={handleSeedDatabase}
                        className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#FF5A1F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Seed Default Catalog
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {products
                        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((prod) => (
                          <div
                            key={prod.id}
                            className="p-3 bg-[#FAFAFA] hover:bg-white border border-gray-200 rounded-xl transition-all shadow-xs flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-[#FF5A1F] uppercase tracking-wider">{prod.category}</span>
                                  {prod.tag && (
                                    <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-semibold">{prod.tag}</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-[#1A1A1A] truncate" title={prod.name}>
                                  {prod.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-[#1A1A1A]">${prod.price}</span>
                                  {prod.originalPrice && (
                                    <span className="text-[10px] text-gray-400 line-through">${prod.originalPrice}</span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-mono">id: {prod.id}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                              title="Delete from MongoDB"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders List View */}
              {selectedCollection === 'orders' && (
                <div>
                  {orders.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-700">No orders recorded in MongoDB yet</p>
                      <p className="text-[11px] text-gray-400 mt-1">Add items to cart and complete checkout to record real customer orders in MongoDB.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((ord) => (
                        <div key={ord.orderId} className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1A1A1A]">#{ord.orderId}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase">
                                {ord.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">{new Date(ord.createdAt).toLocaleString()}</span>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1 mb-2">
                            <p><strong>Customer:</strong> {ord.customer.email}</p>
                            <p><strong>Items:</strong> {ord.items.map(i => `${i.quantity}x ${i.name} ($${i.price})`).join(', ')}</p>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A] pt-2 border-t border-gray-100">
                            <span>Total Amount</span>
                            <span className="text-sm font-black text-[#FF5A1F]">${ord.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSERT PRODUCT FORM */}
          {activeTab === 'add-product' && (
            <form onSubmit={handleCreateProduct} className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-start gap-2 text-xs text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Documents created here are directly written to the MongoDB <code className="font-mono bg-white px-1 py-0.5 rounded font-bold">products</code> collection and instantly visible across the storefront.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Minimalist Titanium Watch"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  >
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Home Decor">Home Decor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Price (USD)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="149"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Original / Retail Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    placeholder="199"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Tag / Badge</label>
                  <input
                    type="text"
                    value={newProdTag}
                    onChange={(e) => setNewProdTag(e.target.value)}
                    placeholder="e.g. Best Seller, New, -25%"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Describe the material, ergonomics, and aesthetic pairing..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#00ED64]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('collections')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2 bg-[#001E2B] hover:bg-[#003B46] text-[#00ED64] text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  id="submit-mongo-product-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submittingProduct ? 'Saving to MongoDB...' : 'Save Product to MongoDB'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CUSTOMER ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  MongoDB Orders Collection ({orders.length})
                </h4>
                <button
                  onClick={() => loadCollectionData('orders')}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">No customer orders recorded yet</p>
                  <p className="text-[11px] text-gray-400 mt-1">Orders placed via Cart Drawer checkout will be saved directly into MongoDB.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div key={ord.orderId} className="p-4 bg-[#FAFAFA] border border-gray-200 rounded-xl shadow-xs">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1A1A1A]">#{ord.orderId}</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                            {ord.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500">{new Date(ord.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3 text-gray-600">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                          <p className="font-semibold text-[#1A1A1A]">{ord.customer.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Payment & Security</p>
                          <p className="font-semibold text-[#1A1A1A]">{ord.paymentMethod || 'Encrypted Gateway'}</p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-1 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Purchased Items</p>
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-gray-700">
                            <span>{it.quantity}x {it.name} {it.color ? `(${it.color})` : ''}</span>
                            <span className="font-bold text-[#1A1A1A]">${(it.price * it.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500">Total Charged (USD)</span>
                        <span className="text-base font-black text-[#FF5A1F]">${ord.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  MongoDB Action Audit Stream
                </h4>
                <button
                  onClick={() => loadCollectionData('logs')}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="bg-[#1A1A1A] text-gray-300 font-mono text-xs rounded-xl p-4 space-y-2 overflow-x-auto max-h-[350px]">
                {logs.length === 0 ? (
                  <p className="text-gray-500">// No activity logs recorded yet</p>
                ) : (
                  logs.map((lg, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-b border-gray-800 pb-1.5">
                      <span className="text-gray-500 text-[10px] shrink-0">[{new Date(lg.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-[#00ED64] font-bold shrink-0">{lg.action}</span>
                      <span className="text-gray-400 text-[11px] shrink-0">({lg.collection})</span>
                      <span className="text-white text-[11px]">{lg.details}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CONNECTION GUIDE */}
          {activeTab === 'config' && (
            <div className="space-y-4 max-w-2xl mx-auto text-xs">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <h4 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00ED64]" />
                  <span>Connecting to MongoDB Atlas or Custom Instance</span>
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  AURA Storefront utilizes the native official <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-[#001E2B]">mongodb</code> driver on Node.js. Provide your MongoDB URI in your application environment or secrets settings:
                </p>

                <div className="relative mt-2">
                  <pre className="bg-[#1A1A1A] text-[#00ED64] p-3 rounded-lg font-mono text-xs overflow-x-auto">
{`MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/aura_ecommerce?retryWrites=true&w=majority
MONGODB_DB_NAME=aura_ecommerce`}
                  </pre>
                  <button
                    onClick={copyConfigSnippet}
                    className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded cursor-pointer"
                    title="Copy Snippet"
                  >
                    {copiedUriSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border border-gray-200 rounded-xl bg-[#FAFAFA]">
                  <p className="font-bold text-[#1A1A1A] mb-1">1. MongoDB Atlas</p>
                  <p className="text-gray-500 text-[11px]">
                    Create a free M0 cluster at mongodb.com/cloud/atlas, whitelist 0.0.0.0/0 or Cloud Run IPs, and copy the connection string.
                  </p>
                </div>

                <div className="p-3 border border-gray-200 rounded-xl bg-[#FAFAFA]">
                  <p className="font-bold text-[#1A1A1A] mb-1">2. Zero-Config Fallback</p>
                  <p className="text-gray-500 text-[11px]">
                    If no URI is specified, the application operates in resilient simulation mode supporting full CRUD and live order storage seamlessly.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-[#F8F8F8] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official MongoDB Node.js Driver Integration</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#FF5A1F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
