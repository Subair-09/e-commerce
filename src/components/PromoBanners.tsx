import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';

interface PromoBannersProps {
  onShopFlashSale: () => void;
  onShopNewCollection: () => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({
  onShopFlashSale,
  onShopNewCollection,
}) => {
  // Live ticking countdown timer: 14 hours, 38 mins, 42 secs initial target
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 38,
    seconds: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 24, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNum = (num: number) => String(num).padStart(2, '0');

  return (
    <section id="promo-banners" className="w-full py-10 lg:py-14 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT BANNER: Flash Sale (Geometric Accent Orange) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FF5A1F] p-6 sm:p-8 text-white shadow-md flex flex-col justify-between min-h-[300px] sm:min-h-[340px] group">
            {/* Geometric Circles */}
            <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full border border-white/20 pointer-events-none" />
            <div className="absolute right-10 bottom-0 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />

            {/* Content Top */}
            <div className="relative z-10 max-w-sm">
              <span className="bg-white text-[#FF5A1F] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-3">
                LIMITED OFFER
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Flash Sale
              </h3>
              <p className="text-sm font-bold text-orange-100 mt-1">
                Up To 70% Off Selected Styles
              </p>
            </div>

            {/* Floating Sneaker Image on the Right */}
            <div className="absolute -right-4 sm:right-2 bottom-4 sm:bottom-6 w-40 sm:w-56 md:w-60 aspect-square pointer-events-none z-10">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=85"
                alt="Flash Sale Featured Sneaker"
                className="w-full h-full object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.3)] -rotate-12 group-hover:rotate-0 group-hover:scale-105 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content Bottom: Countdown + CTA */}
            <div className="relative z-10 mt-6">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-orange-100 mb-2">
                <Clock className="w-3 h-3" />
                <span>Ends in:</span>
              </div>

              {/* Countdown Boxes */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex flex-col items-center justify-center bg-black/30 backdrop-blur-md rounded-lg w-10 h-10 border border-white/20">
                  <span className="text-sm font-black text-white leading-none">
                    {formatNum(timeLeft.hours)}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-orange-200 font-bold mt-0.5">
                    H
                  </span>
                </div>
                <span className="text-sm font-bold text-white">:</span>
                <div className="flex flex-col items-center justify-center bg-black/30 backdrop-blur-md rounded-lg w-10 h-10 border border-white/20">
                  <span className="text-sm font-black text-white leading-none">
                    {formatNum(timeLeft.minutes)}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-orange-200 font-bold mt-0.5">
                    M
                  </span>
                </div>
                <span className="text-sm font-bold text-white">:</span>
                <div className="flex flex-col items-center justify-center bg-black/30 backdrop-blur-md rounded-lg w-10 h-10 border border-white/20">
                  <span className="text-sm font-black text-white leading-none">
                    {formatNum(timeLeft.seconds)}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-orange-200 font-bold mt-0.5">
                    S
                  </span>
                </div>
              </div>

              <button
                onClick={onShopFlashSale}
                className="px-5 py-2.5 bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-2 group/btn cursor-pointer"
                id="promo-flash-sale-btn"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5A1F] group-hover/btn:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* RIGHT BANNER: New Collection (Geometric Dark #1A1A1A) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1A1A1A] p-6 sm:p-8 text-white shadow-md flex flex-col justify-between min-h-[300px] sm:min-h-[340px] group">
            {/* Geometric Circles */}
            <div className="absolute top-0 right-0 w-72 h-72 border border-white/10 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

            {/* Content Top */}
            <div className="relative z-10 max-w-xs sm:max-w-sm">
              <span className="bg-[#FF5A1F] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-3">
                EXCLUSIVE DROP
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                Summer 2025
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Discover relaxed cuts, breathable organic fibers, and elevated minimalist aesthetics.
              </p>
            </div>

            {/* Lifestyle Model on the Right */}
            <div className="absolute right-0 bottom-0 w-44 sm:w-56 md:w-64 h-[85%] overflow-hidden pointer-events-none z-10">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=85"
                alt="Summer Collection Editorial"
                className="w-full h-full object-cover object-top opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out rounded-tl-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-transparent to-transparent opacity-90" />
            </div>

            {/* Content Bottom CTA */}
            <div className="relative z-10 mt-6">
              <button
                onClick={onShopNewCollection}
                className="px-5 py-2.5 bg-[#FF5A1F] hover:bg-[#e64e16] text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-2 group/btn cursor-pointer"
                id="promo-new-collection-btn"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
