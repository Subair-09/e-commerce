import React, { useRef } from 'react';
import { 
  Heart, 
  Star, 
  ShoppingBag,
  Eye
} from 'lucide-react';
import { Product } from '../types';

interface NewArrivalsProps {
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onViewAll: () => void;
}

export const NewArrivals: React.FC<NewArrivalsProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  onViewAll,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="new-arrivals" className="w-full py-10 lg:py-14 bg-white border-y border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#FF5A1F] rounded-full" />
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight">New Arrivals</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onViewAll}
              className="text-xs text-gray-400 hover:text-[#1A1A1A] font-bold tracking-wide transition-colors cursor-pointer hidden sm:block"
              id="view-all-new-arrivals-btn"
            >
              View All →
            </button>

            {/* Carousel Navigation Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll('left')}
                className="w-7 h-7 border border-gray-200 hover:border-black rounded-full flex items-center justify-center text-xs text-gray-700 hover:text-black transition-colors cursor-pointer"
                title="Scroll Left"
                aria-label="Previous products"
                id="new-arrivals-scroll-left"
              >
                ←
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-7 h-7 border border-gray-200 hover:border-black rounded-full flex items-center justify-center text-xs text-gray-700 hover:text-black transition-colors cursor-pointer"
                title="Scroll Right"
                aria-label="Next products"
                id="new-arrivals-scroll-right"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory focus:outline-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            return (
              <div
                key={product.id}
                className="min-w-[240px] sm:min-w-[260px] max-w-[280px] flex-shrink-0 snap-start bg-white rounded-2xl p-3.5 shadow-xs hover:shadow-md border border-gray-100 flex flex-col justify-between relative group transition-all"
                id={`product-card-${product.id}`}
              >
                {/* Image Container with Badges */}
                <div 
                  className="relative aspect-square w-full bg-gray-50 rounded-xl overflow-hidden cursor-pointer mb-3"
                  onClick={() => onQuickView(product)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Geometric New Tag */}
                  <span className="absolute top-2.5 left-2.5 bg-[#FF5A1F] text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {product.tag || 'New'}
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
                      className="px-3 py-1.5 bg-white/90 backdrop-blur-xs text-xs font-bold text-[#1A1A1A] rounded-lg shadow-sm flex items-center gap-1 hover:bg-[#1A1A1A] hover:text-white transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 
                        onClick={() => onQuickView(product)}
                        className="text-xs font-bold text-[#1A1A1A] hover:text-[#FF5A1F] transition-colors line-clamp-1 cursor-pointer"
                      >
                        {product.name}
                      </h4>
                      <span className="text-xs font-black text-[#1A1A1A]">
                        ${product.price.toFixed(0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-amber-400 my-1.5">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 ml-1">({product.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-[#1A1A1A] hover:bg-[#FF5A1F] text-white py-2 rounded-lg text-[11px] font-bold mt-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    id={`add-to-cart-${product.id}`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
