import React from 'react';
import { Award, Zap, Lock, Smile } from 'lucide-react';

export const BottomTrust: React.FC = () => {
  const items = [
    {
      icon: Award,
      bg: 'bg-orange-50 text-[#FF5A1F]',
      title: 'Premium Quality',
      description: 'Certified authentic materials and master artisan craftsmanship',
    },
    {
      icon: Zap,
      bg: 'bg-blue-50 text-blue-500',
      title: 'Fast Delivery',
      description: 'Expedited express delivery across 50+ countries with live tracking',
    },
    {
      icon: Lock,
      bg: 'bg-green-50 text-green-500',
      title: 'Secure Checkout',
      description: 'Bank-level 256-bit SSL encrypted zero-risk transaction guarantee',
    },
    {
      icon: Smile,
      bg: 'bg-purple-50 text-purple-500',
      title: 'Customer Happiness',
      description: 'Over 99.4% verified 5-star customer happiness rating',
    },
  ];

  return (
    <section id="trust-bottom" className="w-full bg-[#F8F8F8] py-10 lg:py-14 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.title} 
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col items-start"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <h4 className="text-xs font-bold text-[#1A1A1A] tracking-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
