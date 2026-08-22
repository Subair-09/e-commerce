export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  secondaryImages?: string[];
  isNew?: boolean;
  discountPercent?: number;
  tag?: string;
  description: string;
  features?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  inStock?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount: number;
  description?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'cart' | 'wishlist';
  image?: string;
}

export interface AzureStorageStatus {
  configured: boolean;
  mode: 'azure-live' | 'simulation' | 'error';
  accountName: string;
  defaultContainer: string;
  containers: string[];
  message?: string;
  blobEndpoint?: string;
}

export interface AzureBlobItem {
  name: string;
  url: string;
  size: number;
  contentType?: string;
  lastModified: string;
  container: string;
}

export interface MongoStatus {
  connected: boolean;
  mode: 'mongodb-live' | 'mongodb-ready-simulation';
  dbName: string;
  host: string;
  pingMs?: number;
  error?: string;
}

export interface MongoCollectionCounts {
  products: number;
  orders: number;
  categories: number;
  subscribers: number;
  activity_logs: number;
  users?: number;
}

export interface UserAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  vipPoints: number;
  phone?: string;
  avatar?: string;
  addresses?: UserAddress[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  error?: string;
}

export interface MongoOrder {
  orderId: string;
  createdAt: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
    image?: string;
  }>;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  paymentMethod?: string;
  shippingAddress?: string;
  azureBackupUrl?: string;
}

export interface MongoSubscriber {
  email: string;
  subscribedAt: string;
  discountCode: string;
  source: string;
}

export interface MongoActivityLog {
  timestamp: string;
  action: string;
  details: string;
  collection: string;
}

export type AdminDashboardTab = 'products' | 'orders' | 'customers' | 'sales';

export interface AdminProductInput {
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  stockCount: number;
  inStock: boolean;
  tag?: string;
  rating?: number;
  reviewsCount?: number;
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  vipPoints: number;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  orderCount: number;
  totalSpent: number;
  status: 'active' | 'suspended' | 'vip';
  addresses?: UserAddress[];
}

export interface SalesAnalytics {
  timeframe: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  revenueChangePercent: number;
  ordersChangePercent: number;
  dailyRevenue: Array<{
    date: string;
    day: string;
    revenue: number;
    orders: number;
    units: number;
  }>;
  categorySales: Array<{
    name: string;
    value: number;
    revenue: number;
    count: number;
    color: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    unitsSold: number;
    totalRevenue: number;
    image: string;
    stockCount: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  customerGrowth: Array<{
    month: string;
    customers: number;
    vipCount: number;
  }>;
}


