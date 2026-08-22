import React from 'react';
import { CATEGORIES } from '../data/mockData';

interface CategoryGridProps {
  onSelectCategory: (categoryName: string) => void;
  onViewAllCategories: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  onSelectCategory,
  onViewAllCategories,
}) => {
  return (
    <section id="categories" className="w-full py-10 lg:py-14 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#FF5A1F] rounded-full" />
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight">Shop Categories</h3>
          </div>

          <button
            onClick={onViewAllCategories}
            className="text-xs text-gray-400 hover:text-[#1A1A1A] font-bold tracking-wide transition-colors cursor-pointer"
            id="view-all-categories-btn"
          >
            View All →
          </button>
        </div>

        {/* Categories Grid (6 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              onClick={() => onSelectCategory(category.name)}
              className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/5] bg-gray-100 border border-gray-200/70 shadow-xs hover:shadow-md transition-all"
              id={`cat-card-${category.slug}`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex flex-col justify-end p-3">
                <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider">{category.itemCount} items</span>
                <p className="text-white text-xs sm:text-sm font-bold leading-tight">{category.name}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
