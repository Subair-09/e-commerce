import React from 'react';
import { Star, ShoppingBag, Heart, Eye } from 'lucide-react';
import { BEST_SELLERS } from '../data/mockData';
import { Product } from '../types';

interface BestSellersProps {
  wishlistIds: string[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onViewAll: () => void;
}

export const BestSellers: React.FC<BestSellersProps> = ({
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  onViewAll,
}) => {
  return (
    <section id="best-sellers" className="w-full py-10 lg:py-14 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#FF5A1F] rounded-full" />
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight">Best Sellers</h3>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs text-gray-400 hover:text-[#1A1A1A] font-bold tracking-wide transition-colors cursor-pointer"
            id="view-all-best-sellers-btn"
          >
            View All →
          </button>
        </div>

        {/* 3 Featured Best-Seller Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {BEST_SELLERS.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                id={`bestseller-card-${product.id}`}
              >
                {/* Product Image */}
                <div 
                  className="relative aspect-[16/11] w-full bg-gray-50 rounded-xl overflow-hidden cursor-pointer mb-3.5"
                  onClick={() => onQuickView(product)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Geometric Bestseller Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-[#1A1A1A] text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {product.tag || 'Bestseller'}
                  </span>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product);
                    }}
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isWishlisted
                        ? 'bg-red-50 text-red-600'
                        : 'bg-white/90 text-gray-500 hover:text-black hover:bg-white'
                    }`}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-600' : ''}`} />
                  </button>

                  {/* Quick View Button */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="px-3.5 py-1.5 bg-white text-[#1A1A1A] font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 hover:bg-[#1A1A1A] hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#FF5A1F] uppercase tracking-wider">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <h4 
                      onClick={() => onQuickView(product)}
                      className="text-sm font-bold text-[#1A1A1A] hover:text-[#FF5A1F] transition-colors line-clamp-1 cursor-pointer"
                    >
                      {product.name}
                    </h4>

                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-[#1A1A1A]">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => onAddToCart(product)}
                      className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#FF5A1F] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      id={`quick-add-${product.id}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Quick Add</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
