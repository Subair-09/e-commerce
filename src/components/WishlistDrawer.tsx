import React from 'react';
import { X, Trash2, ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemove: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemove,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h2 className="text-lg font-bold text-neutral-900">Your Wishlist</h2>
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {wishlist.length} saved
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Close wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wishlist Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">No items saved yet</h3>
                <p className="text-xs text-neutral-500 max-w-xs mt-1 mb-6">
                  Click the heart icon on any product to save items you love for later.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              wishlist.map((product) => (
                <div
                  key={product.id}
                  className="flex space-x-3.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 items-center justify-between"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-neutral-200/50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500">{product.category}</p>
                    <span className="text-xs font-extrabold text-neutral-900 mt-1 block">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onAddToCart(product);
                        onRemove(product);
                      }}
                      className="p-2 bg-neutral-900 hover:bg-orange-600 text-white rounded-xl transition-colors"
                      title="Move to Cart"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemove(product)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded-xl transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
