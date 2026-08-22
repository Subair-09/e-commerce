import React from 'react';
import { ArrowRight, Star, ShoppingBag } from 'lucide-react';
import { HERO_FLOATING_PRODUCTS } from '../data/mockData';
import { Product } from '../types';

interface HeroProps {
  onShopNow: () => void;
  onExplore: () => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onShopNow,
  onExplore,
  onQuickView,
  onAddToCart,
}) => {
  return (
    <section id="hero" className="relative w-full bg-[#F1F1F1] overflow-hidden py-12 lg:py-16 border-b border-gray-200">
      {/* Geometric circular background elements */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF5A1F] rounded-full opacity-5 -right-20 top-0 translate-y-[-20%] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] border border-[#FF5A1F]/20 rounded-full right-10 top-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column Content */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">
            {/* Small uppercase label */}
            <span className="text-[#FF5A1F] font-bold text-[11px] tracking-[0.2em] mb-3 uppercase">
              Trending Now
            </span>

            {/* Large Bold Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mb-5">
              Discover Products <br className="hidden sm:inline" />
              You'll Love
            </h1>

            {/* Supporting Description */}
            <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-md leading-relaxed">
              Curated collections designed for modern living. Elevate your everyday with premium essentials.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8 w-full sm:w-auto">
              <button
                onClick={onShopNow}
                className="bg-[#FF5A1F] text-white px-8 py-3.5 rounded-md text-xs font-bold shadow-lg shadow-orange-200 hover:bg-[#e64e16] transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                id="hero-shop-now-btn"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExplore}
                className="border border-gray-300 bg-white/60 text-[#1A1A1A] px-8 py-3.5 rounded-md text-xs font-bold hover:bg-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                id="hero-explore-collection-btn"
              >
                <span>Explore Collection</span>
              </button>
            </div>

            {/* Customer Avatar Group & Social Proof */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop" alt="User" referrerPolicy="no-referrer" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50&h=50&fit=crop" alt="User" referrerPolicy="no-referrer" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FF5A1F] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                  12K+
                </div>
              </div>
              <span className="text-[11px] text-gray-600 font-medium">
                Trusted by 12,000+ Happy Customers
              </span>
            </div>
          </div>

          {/* Right Column: Main Lifestyle Model & Floating Product Cards */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] sm:min-h-[520px]">
            
            {/* Geometric Circles */}
            <div className="absolute w-[420px] h-[420px] bg-[#FF5A1F]/10 rounded-full blur-2xl -z-10" />
            <div className="absolute w-[360px] h-[360px] border border-[#FF5A1F]/25 rounded-full -z-10" />

            {/* Main Lifestyle Model Image */}
            <div className="relative z-10 w-full max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&fit=crop"
                alt="Modern Fashion Model"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* FLOATING CARD 1: Upper Left */}
            <div 
              className="absolute top-8 left-0 sm:-left-4 z-20 bg-white p-2.5 rounded-xl shadow-xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-gray-100"
              onClick={() => onQuickView({
                id: HERO_FLOATING_PRODUCTS[0].id,
                name: HERO_FLOATING_PRODUCTS[0].name,
                category: HERO_FLOATING_PRODUCTS[0].category,
                price: HERO_FLOATING_PRODUCTS[0].price,
                rating: HERO_FLOATING_PRODUCTS[0].rating,
                reviewsCount: 142,
                image: HERO_FLOATING_PRODUCTS[0].image,
                description: 'Classic minimalist watch with premium leather strap and precision quartz movement.'
              })}
              id="hero-floating-card-1"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs overflow-hidden">
                <img src={HERO_FLOATING_PRODUCTS[0].image} alt="Watch" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#1A1A1A]">Smart Watch Pro</p>
                <p className="text-[11px] text-[#FF5A1F] font-bold">$199.00</p>
              </div>
            </div>

            {/* FLOATING CARD 2: Bottom Right */}
            <div 
              className="absolute bottom-12 right-0 sm:-right-4 z-20 bg-white p-2.5 rounded-xl shadow-xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-gray-100"
              onClick={() => onQuickView({
                id: HERO_FLOATING_PRODUCTS[1].id,
                name: HERO_FLOATING_PRODUCTS[1].name,
                category: HERO_FLOATING_PRODUCTS[1].category,
                price: HERO_FLOATING_PRODUCTS[1].price,
                rating: HERO_FLOATING_PRODUCTS[1].rating,
                reviewsCount: 98,
                image: HERO_FLOATING_PRODUCTS[1].image,
                description: 'Timeless saddle crossbody bag handcrafted from rich full-grain calfskin leather.'
              })}
              id="hero-floating-card-2"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs overflow-hidden">
                <img src={HERO_FLOATING_PRODUCTS[1].image} alt="Tote" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#1A1A1A]">Classic Tote</p>
                <p className="text-[11px] text-[#FF5A1F] font-bold">$85.00</p>
              </div>
            </div>

            {/* FLOATING CARD 3: Geometric Match Badge Top Right */}
            <div className="absolute top-24 -right-2 sm:-right-6 bg-white p-2.5 rounded-xl shadow-xl z-20 flex flex-col items-center border border-gray-100">
              <div className="w-12 h-12 rounded-full border-4 border-[#FF5A1F] flex items-center justify-center text-[11px] font-black text-[#1A1A1A]">
                98%
              </div>
              <p className="text-[9px] mt-1 text-gray-500 font-bold uppercase tracking-wider">Match</p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
