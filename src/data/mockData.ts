import { Product, Category } from '../types';

export const HERO_FLOATING_PRODUCTS = [
  {
    id: 'hero-float-1',
    name: 'Minimalist Chrono Watch',
    category: 'Accessories',
    price: 189.00,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
    position: 'top-left'
  },
  {
    id: 'hero-float-2',
    name: 'Leather Saddle Crossbody',
    category: 'Fashion',
    price: 145.00,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
    position: 'top-right'
  },
  {
    id: 'hero-float-3',
    name: 'Spatial ANC Headphones',
    category: 'Electronics',
    price: 260.00,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    position: 'mid-left'
  },
  {
    id: 'hero-float-4',
    name: 'Aroma Botanical Mist',
    category: 'Beauty',
    price: 38.00,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1608248597359-00f8983ecb70?auto=format&fit=crop&w=400&q=80',
    position: 'bottom-right'
  }
];

export const CATEGORIES: Category[] = [
  {
    id: 'cat-fashion',
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    itemCount: 340,
    description: 'Contemporary apparel, outerwear and seasonal essentials.'
  },
  {
    id: 'cat-electronics',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    itemCount: 180,
    description: 'Cutting-edge audio gear, smart wearables, and devices.'
  },
  {
    id: 'cat-beauty',
    name: 'Beauty',
    slug: 'beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
    itemCount: 220,
    description: 'Organic skincare, fragrances, and daily wellness rituals.'
  },
  {
    id: 'cat-fitness',
    name: 'Fitness',
    slug: 'fitness',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    itemCount: 115,
    description: 'Performance activewear, mats, and recovery tools.'
  },
  {
    id: 'cat-home',
    name: 'Home Decor',
    slug: 'home-decor',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    itemCount: 195,
    description: 'Artisanal ceramics, ambient lighting, and textiles.'
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    itemCount: 260,
    description: 'Handcrafted jewelry, sunglasses, and leather goods.'
  }
];

export const NEW_ARRIVALS: Product[] = [
  {
    id: 'prod-na-1',
    name: 'Tailored Linen Overshirt',
    category: 'Fashion',
    price: 110.00,
    originalPrice: 140.00,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 84,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80'
    ],
    isNew: true,
    tag: 'NEW',
    description: 'Breathable, structured organic French linen shirt designed for casual layering and year-round breathability.',
    features: ['100% Organic Linen', 'Mother-of-pearl buttons', 'Relaxed tailored drape', 'Machine washable'],
    colors: [
      { name: 'Oatmeal', hex: '#d9cdb8' },
      { name: 'Navy', hex: '#1c2833' },
      { name: 'Olive', hex: '#5b6348' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true
  },
  {
    id: 'prod-na-2',
    name: 'Acoustic Studio Wireless Pods',
    category: 'Electronics',
    price: 195.00,
    originalPrice: 220.00,
    discountPercent: 12,
    rating: 4.8,
    reviewsCount: 162,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=600&q=80'
    ],
    isNew: true,
    tag: 'HOT',
    description: 'Custom high-excursion driver with personalized active noise cancellation and transparency audio mode.',
    features: ['32hr battery life with case', 'IPX4 sweat resistance', 'Multipoint Bluetooth 5.3', 'Fast Qi wireless charging'],
    colors: [
      { name: 'Matte White', hex: '#f3f4f6' },
      { name: 'Midnight', hex: '#111827' }
    ],
    inStock: true
  },
  {
    id: 'prod-na-3',
    name: 'Sculpted Ceramic Pouring Vase',
    category: 'Home Decor',
    price: 68.00,
    rating: 4.7,
    reviewsCount: 47,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80'
    ],
    isNew: true,
    tag: 'NEW',
    description: 'Hand-thrown textured stoneware vase crafted with matte chalk finish and contemporary asymmetric handle.',
    features: ['Water-tight interior glazing', 'Handcrafted in Portugal', 'Unique organic variations'],
    colors: [
      { name: 'Chalk White', hex: '#f0ede6' },
      { name: 'Terracotta', hex: '#c86d51' }
    ],
    inStock: true
  },
  {
    id: 'prod-na-4',
    name: 'Classic Polarized Wayfarer',
    category: 'Accessories',
    price: 135.00,
    originalPrice: 160.00,
    discountPercent: 15,
    rating: 5.0,
    reviewsCount: 96,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80'
    ],
    isNew: true,
    tag: '-15%',
    description: 'Premium Italian acetate sunglasses with 100% UV400 polarized crystal optics and stainless steel 5-barrel hinges.',
    features: ['Hand-polished Italian acetate', 'Scratch-resistant lenses', 'Microfiber case included'],
    colors: [
      { name: 'Havana Tortoise', hex: '#543d2b' },
      { name: 'Obsidian Black', hex: '#111827' }
    ],
    inStock: true
  },
  {
    id: 'prod-na-5',
    name: 'Botanical Hydrating Elixir',
    category: 'Beauty',
    price: 54.00,
    rating: 4.9,
    reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1608248597359-00f8983ecb70?auto=format&fit=crop&w=600&q=80'
    ],
    isNew: true,
    tag: 'NEW',
    description: 'Multi-peptide facial serum formulated with squalane, niacinamide, and blue tansy for radiant barrier replenishment.',
    features: ['Clean vegan formulation', 'Dermatologist tested', 'Cruelty-free glass bottle 50ml'],
    inStock: true
  },
  {
    id: 'prod-na-6',
    name: 'Merino Wool Knit Beanie',
    category: 'Fashion',
    price: 45.00,
    originalPrice: 55.00,
    discountPercent: 18,
    rating: 4.8,
    reviewsCount: 65,
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80',
    isNew: true,
    tag: 'SALE',
    description: 'Superfine non-itch Australian merino wool rib knit cap with comfortable double-cuff styling.',
    features: ['100% Merino Wool', 'Temperature regulating', 'One size fits all'],
    colors: [
      { name: 'Heather Charcoal', hex: '#374151' },
      { name: 'Camel', hex: '#c19a6b' },
      { name: 'Forest Green', hex: '#2d4a3e' }
    ],
    inStock: true
  }
];

export const BEST_SELLERS: Product[] = [
  {
    id: 'prod-bs-1',
    name: 'Velocity Aero Leather Runner',
    category: 'Fashion',
    price: 165.00,
    originalPrice: 210.00,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 382,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80'
    ],
    tag: 'BESTSELLER #1',
    description: 'Engineered lightweight ergonomic silhouette featuring responsive ultra-foam cushion and premium calfskin upper trims.',
    features: ['Responsive CloudFoam sole', 'Supple Italian suede & leather', 'Reinforced heel cage', 'Ortholite insole'],
    colors: [
      { name: 'Crimson Red / White', hex: '#e11d48' },
      { name: 'Stealth Noir', hex: '#18181b' },
      { name: 'Chalk Grey', hex: '#9ca3af' }
    ],
    sizes: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
    inStock: true
  },
  {
    id: 'prod-bs-2',
    name: 'Nordic Heritage Travel Duffel',
    category: 'Accessories',
    price: 198.00,
    originalPrice: 245.00,
    discountPercent: 19,
    rating: 4.8,
    reviewsCount: 245,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=700&q=80'
    ],
    tag: 'TOP PICK',
    description: 'Weather-resistant 45L waxed canvas holdall with full-grain vegetable-tanned leather handles and brass hardware.',
    features: ['Water-repellent 18oz canvas', 'Padded 16" laptop sleeve', 'Shoe compartment with ventilation'],
    colors: [
      { name: 'Cognac Saddle', hex: '#8b4513' },
      { name: 'Olive Drab', hex: '#4a5d4e' },
      { name: 'Charcoal Black', hex: '#23272a' }
    ],
    inStock: true
  },
  {
    id: 'prod-bs-3',
    name: 'PureSense Smart Health Watch',
    category: 'Electronics',
    price: 285.00,
    originalPrice: 320.00,
    discountPercent: 11,
    rating: 4.9,
    reviewsCount: 519,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=700&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80'
    ],
    tag: 'STAFF CHOICE',
    description: 'Always-on AMOLED display with continuous heart rate, blood oxygen tracking, sleep staging, and 7-day battery.',
    features: ['1.43" Ultra-AMOLED Display', 'Titanium bezel & Sapphire crystal', '50m water resistance (5 ATM)', '7-day battery life'],
    colors: [
      { name: 'Titanium Silver', hex: '#cbd5e1' },
      { name: 'Space Black', hex: '#0f172a' },
      { name: 'Rose Gold', hex: '#e2b4a8' }
    ],
    inStock: true
  }
];

export const ALL_PRODUCTS: Product[] = [
  ...NEW_ARRIVALS,
  ...BEST_SELLERS,
  {
    id: 'prod-extra-1',
    name: 'Minimalist Matte Ceramic Mug Set',
    category: 'Home Decor',
    price: 42.00,
    rating: 4.8,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    description: 'Set of 2 stackable porcelain mugs with heat-insulating thick walls and ergonomic handle.',
    inStock: true
  },
  {
    id: 'prod-extra-2',
    name: 'High-Performance Yoga Mat',
    category: 'Fitness',
    price: 78.00,
    originalPrice: 95.00,
    discountPercent: 18,
    rating: 4.9,
    reviewsCount: 154,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80',
    description: 'Natural tree rubber base with ultra-grip polyurethane top surface and laser alignment lines.',
    inStock: true
  },
  {
    id: 'prod-extra-3',
    name: 'Structured Canvas Tote Bag',
    category: 'Accessories',
    price: 62.00,
    rating: 4.6,
    reviewsCount: 72,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    description: 'Durable heavy-duty 24oz organic cotton canvas tote with interior zipped organizers and magnetic clasp.',
    inStock: true
  }
];
