import React, { useState } from 'react';
import { X, Star, Heart, ShoppingBag, Truck, ShieldCheck, Check, Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}) => {
  if (!isOpen || !product) return null;

  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);

  const allImages = [product.image, ...(product.secondaryImages || [])];

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor, selectedSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-neutral-100 animate-in zoom-in-95 duration-200 z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-md text-neutral-400 hover:text-neutral-900 rounded-full shadow-sm hover:bg-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left: Image Gallery */}
          <div className="p-6 bg-[#fafafc] flex flex-col justify-between border-r border-neutral-100">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-neutral-200/60 shadow-xs mb-4">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {product.tag && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-neutral-900 text-white text-xs font-bold uppercase rounded-lg shadow-sm">
                  {product.tag}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === img ? 'border-orange-600 scale-105' : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  {product.category}
                </span>
                <div className="flex items-center space-x-1 text-amber-500 font-semibold text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-neutral-400">({product.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 leading-tight">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline space-x-3 mt-3">
                <span className="text-2xl font-black text-neutral-950">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-400 line-through font-medium">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                {product.discountPercent && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md">
                    Save {product.discountPercent}%
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-neutral-600 mt-3 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <div className="flex justify-between text-xs font-semibold text-neutral-800 mb-2">
                    <span>Color:</span>
                    <span className="text-neutral-500">{selectedColor}</span>
                  </div>
                  <div className="flex space-x-2">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`w-7 h-7 rounded-full transition-transform ring-offset-2 ${
                          selectedColor === c.name ? 'ring-2 ring-neutral-900 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <div className="flex justify-between text-xs font-semibold text-neutral-800 mb-2">
                    <span>Size:</span>
                    <span className="text-neutral-500">{selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedSize === s
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features List */}
              {product.features && (
                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1">
                  {product.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-[11px] text-neutral-600">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Quantity + Add To Cart + Wishlist */}
            <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
              <div className="flex items-center space-x-3">
                {/* Quantity */}
                <div className="flex items-center space-x-2 bg-neutral-100 rounded-xl p-1 border border-neutral-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-neutral-900 w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 bg-neutral-950 hover:bg-[#ff5530] text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-black/10 cursor-pointer"
                  id="quickview-add-to-cart-btn"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart • ${(product.price * quantity).toFixed(2)}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isWishlisted
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-neutral-200 text-neutral-600 hover:text-red-600 hover:border-red-200'
                  }`}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600' : ''}`} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center space-x-4 text-[11px] text-neutral-500 pt-2">
                <div className="flex items-center space-x-1">
                  <Truck className="w-3.5 h-3.5 text-orange-600" />
                  <span>Free Express Delivery</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2 Year Warranty</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
