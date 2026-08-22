import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

export const TrustFeatures: React.FC = () => {
  const features = [
    {
      icon: Truck,
      bg: 'bg-orange-50 text-[#FF5A1F]',
      title: 'Free Shipping',
      description: 'On orders over $50',
    },
    {
      icon: ShieldCheck,
      bg: 'bg-blue-50 text-blue-500',
      title: 'Secure Payment',
      description: '100% protected',
    },
    {
      icon: RefreshCw,
      bg: 'bg-green-50 text-green-500',
      title: 'Easy Returns',
      description: '30-day window',
    },
    {
      icon: Headphones,
      bg: 'bg-purple-50 text-purple-500',
      title: '24/7 Support',
      description: 'Always online',
    },
  ];

  return (
    <section className="w-full bg-white border-b border-gray-100 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 justify-items-start sm:justify-items-center">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title} 
                className="flex items-center gap-3"
              >
                <div className={`w-8 h-8 ${feature.bg} rounded-full flex items-center justify-center text-xs shrink-0`}>
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#1A1A1A]">{feature.title}</p>
                  <p className="text-[9px] text-gray-400 leading-none mt-0.5">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
