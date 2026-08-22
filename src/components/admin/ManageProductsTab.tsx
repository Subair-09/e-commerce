import React, { useState, useMemo } from 'react';
import { Product, AdminProductInput } from '../../types';
import { ProductEditModal } from './ProductEditModal';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Layers,
  ArrowUpDown,
  ExternalLink,
  CloudUpload,
  Database
} from 'lucide-react';

interface ManageProductsTabProps {
  products: Product[];
  onAddProduct: (product: AdminProductInput) => Promise<void>;
  onEditProduct: (id: string, product: AdminProductInput) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onSeedDatabase: () => Promise<void>;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info') => void;
  onOpenAzureStorage?: () => void;
  categories: string[];
}

export const ManageProductsTab: React.FC<ManageProductsTabProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSeedDatabase,
  onShowToast,
  onOpenAzureStorage,
  categories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'name'>('newest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      
      let matchesStock = true;
      const stock = p.reviewsCount ? Math.max(12, p.reviewsCount % 45) : 25; // fallback representative stock
      if (stockFilter === 'inStock') matchesStock = p.inStock !== false && stock > 0;
      if (stockFilter === 'lowStock') matchesStock = stock < 15 && stock > 0;
      if (stockFilter === 'outOfStock') matchesStock = p.inStock === false || stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Statistics
  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.inStock !== false).length;
  const lowStockCount = products.filter(p => (p.reviewsCount ? p.reviewsCount % 45 : 25) < 15).length;
  const totalValuation = products.reduce((acc, p) => acc + (p.price * 25), 0);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: AdminProductInput, id?: string) => {
    if (id) {
      await onEditProduct(id, productData);
      onShowToast('Product Updated', `Successfully updated '${productData.name}' in MongoDB.`, 'success');
    } else {
      await onAddProduct(productData);
      onShowToast('Product Created', `Added '${productData.name}' to the live catalog.`, 'success');
    }
  };

  const promptDelete = (id: string, name: string) => {
    setProductToDelete({ id, name });
  };

  const confirmPermanentDelete = async () => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;
    setDeletingId(id);
    try {
      await onDeleteProduct(id);
      onShowToast('Product Permanently Deleted', `Successfully removed '${name}' from MongoDB database and live catalog.`, 'info');
      setProductToDelete(null);
    } catch (err: any) {
      onShowToast('Deletion Error', err.message || 'Failed to delete product from database', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeed = async () => {
    if (confirm('Re-seed catalog in MongoDB with curated luxury presets?')) {
      setSeeding(true);
      try {
        await onSeedDatabase();
        onShowToast('MongoDB Catalog Seeded', 'Default product catalog synchronized with database.', 'success');
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-manage-products-tab">
      
      {/* Header Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Manage Products</h2>
            <span className="bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
              {products.length} Items Live
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Create, update stock, modify pricing, and sync product media across MongoDB & Azure Storage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-colors cursor-pointer"
            id="btn-seed-catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>Reset & Seed Demo Catalog</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00c954] text-[#001E2B] text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#00ED64]/10 transition-all cursor-pointer"
            id="btn-add-product"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#00ED64]/10 border border-[#00ED64]/20 flex items-center justify-center text-[#00ED64]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Total Products</div>
            <div className="text-xl font-bold text-white">{totalProducts}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">In Stock & Active</div>
            <div className="text-xl font-bold text-white">{inStockCount}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Low Stock Alerts</div>
            <div className="text-xl font-bold text-white">{lowStockCount}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Est. Catalog Value</div>
            <div className="text-xl font-bold text-white">${totalValuation.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, ID..."
            className="w-full bg-[#182026] border border-gray-700/80 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ED64]"
            id="input-admin-search-products"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category & Stock Selectors */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#182026] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#00ED64]"
            id="select-admin-category-filter"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-[#182026] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#00ED64]"
            id="select-admin-stock-filter"
          >
            <option value="all">All Inventory</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock (&lt; 15)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#182026] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#00ED64]"
            id="select-admin-sort-by"
          >
            <option value="newest">Sort: Default</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300" id="table-admin-products">
            <thead className="bg-[#0B0F13] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800 text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Product & Thumbnail</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Inventory</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-600 stroke-1" />
                    <p className="text-sm font-semibold text-gray-400">No products match your filters</p>
                    <p className="text-xs text-gray-500 mt-1">Try resetting the search query or category filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.reviewsCount ? Math.max(8, p.reviewsCount % 45) : 25;
                  const isLow = stock < 15;
                  const isOut = p.inStock === false;

                  return (
                    <tr key={p.id} className="hover:bg-gray-800/30 transition-colors" id={`row-product-${p.id}`}>
                      {/* Product Thumbnail & Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden shrink-0 relative group">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                              }}
                            />
                            {p.image?.includes('storage') && (
                              <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#00A4EF] shadow-xs" title="Azure Blob Storage" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[280px]">
                            <div className="font-bold text-white text-sm truncate">{p.name}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-400">ID: {p.id}</span>
                              {p.tag && (
                                <span className="text-[10px] bg-[#00ED64]/10 text-[#00ED64] px-1.5 py-0.2 rounded font-semibold">
                                  {p.tag}
                                </span>
                              )}
                              <span className="text-[9px] text-[#00A4EF] bg-[#0078D4]/10 px-1.5 py-0.2 rounded border border-[#0078D4]/20 font-mono inline-flex items-center gap-0.5">
                                <CloudUpload className="w-2.5 h-2.5" />
                                <span>Azure Blob</span>
                              </span>
                              <span className="text-[9px] text-[#00ED64] bg-[#00ED64]/10 px-1.5 py-0.2 rounded border border-[#00ED64]/20 font-mono inline-flex items-center gap-0.5">
                                <Database className="w-2.5 h-2.5" />
                                <span>MongoDB</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="bg-gray-800/80 border border-gray-700 px-2.5 py-1 rounded-lg text-gray-300 text-xs">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          ${p.price.toFixed(2)}
                        </div>
                        {p.originalPrice && (
                          <div className="text-[11px] text-gray-500 line-through">
                            ${p.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Inventory */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span className="font-bold text-white text-xs">{isOut ? '0 units' : `${stock} units`}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {isOut ? 'Restock needed' : isLow ? 'Low stock threshold' : 'Optimal inventory'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
                            <XCircle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-300 hover:text-[#00ED64] hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                            id={`btn-edit-product-${p.id}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => promptDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product Permanently"
                            id={`btn-delete-product-${p.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-gray-800 bg-[#0B0F13] flex items-center justify-between text-xs text-gray-400">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span className="font-mono text-[#00ED64] text-[11px]">Synced with MongoDB Collection: products</span>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <ProductEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
        onSave={handleSaveProduct}
        onDelete={async (id: string, name: string) => {
          setIsModalOpen(false);
          promptDelete(id, name);
        }}
        categories={categories}
      />

      {/* Permanent Deletion Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#001E2B] border border-red-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanent Product Deletion</h3>
                <p className="text-xs text-gray-400">Action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#001328] border border-gray-800 space-y-2">
              <p className="text-sm text-gray-300">
                Are you sure you want to permanently delete <span className="font-bold text-white">"{productToDelete.name}"</span>?
              </p>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                <li>Removes document from MongoDB database collection</li>
                <li>Immediately delists item from customer catalog and search index</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={Boolean(deletingId)}
                className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors cursor-pointer"
                id="btn-cancel-delete-modal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPermanentDelete}
                disabled={Boolean(deletingId)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                id="btn-confirm-permanent-delete"
              >
                {deletingId ? (
                  <span>Deleting from MongoDB...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
