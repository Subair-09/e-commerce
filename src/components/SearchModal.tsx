import React, { useState, useMemo } from 'react';
import { Search, X, Star, ShoppingBag, ArrowRight } from 'lucide-react';
import { ALL_PRODUCTS } from '../data/mockData';
import { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  products?: Product[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onQuickView,
  onAddToCart,
  products = ALL_PRODUCTS,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Fashion', 'Electronics', 'Beauty', 'Fitness', 'Home Decor', 'Accessories'];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesQuery = 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-100 animate-in zoom-in-95 duration-200">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center space-x-3">
          <Search className="w-6 h-6 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name, category, or style..."
            className="flex-1 text-base sm:text-lg text-neutral-900 placeholder-neutral-400 bg-transparent focus:outline-none"
            id="search-modal-input"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 sm:px-6 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-200/70 border border-neutral-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <p className="text-sm font-medium text-neutral-700">No products found</p>
              <p className="text-xs text-neutral-500 mt-1">Try searching for "sneakers", "watch", "linen", or "beauty".</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onQuickView(product);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 border border-transparent hover:border-neutral-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-orange-600 uppercase">{product.category}</p>
                    <h4 className="text-sm font-bold text-neutral-900 truncate group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-extrabold text-neutral-950">
                        ${product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center text-[10px] text-amber-500 font-semibold">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" />
                        {product.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="p-2 bg-neutral-900 hover:bg-orange-600 text-white rounded-xl transition-colors"
                    title="Add to cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
