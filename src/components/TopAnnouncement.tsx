import React from 'react';
import { Truck, Flame, Zap } from 'lucide-react';

export const TopAnnouncement: React.FC = () => {
  return (
    <div className="w-full h-8 bg-black flex items-center justify-between px-4 sm:px-10 text-[10px] sm:text-[11px] text-white uppercase tracking-widest font-medium border-b border-neutral-900">
      <div className="flex items-center gap-2">
        <Truck className="w-3.5 h-3.5 text-[#FF5A1F]" />
        <span>Free Worldwide Shipping Over $50</span>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <Flame className="w-3.5 h-3.5 text-[#FF5A1F]" />
        <span>Summer Sale Up To 70% Off</span>
      </div>

      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-[#FF5A1F]" />
        <span>Limited Time Deals</span>
      </div>
    </div>
  );
};

