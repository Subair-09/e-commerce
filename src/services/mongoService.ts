import { 
  MongoStatus, 
  MongoCollectionCounts, 
  MongoOrder, 
  MongoSubscriber, 
  MongoActivityLog, 
  Product 
} from '../types';

export interface MongoStatusResponse {
  success: boolean;
  status: MongoStatus;
  counts: MongoCollectionCounts;
}

export async function getMongoDatabaseStatus(): Promise<MongoStatusResponse> {
  try {
    const res = await fetch('/api/mongo/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      status: {
        connected: false,
        mode: 'mongodb-ready-simulation',
        dbName: 'aura_ecommerce',
        host: 'Offline / Simulation Mode',
        error: err.message || 'Could not fetch MongoDB status',
      },
      counts: {
        products: 0,
        orders: 0,
        categories: 0,
        subscribers: 0,
        activity_logs: 0,
      },
    };
  }
}

export async function getProductsFromMongo(filters?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tag?: string;
  sortBy?: string;
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const res = await fetch(`/api/mongo/products?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to query products from MongoDB');
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.warn('Error querying MongoDB products:', err);
    return [];
  }
}

export async function createProductInMongo(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch('/api/mongo/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create product');
    return { success: true, product: data.product };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProductInMongo(id: string, updates: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch(`/api/mongo/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update product');
    return { success: true, product: data.product };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProductFromMongo(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/mongo/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete product');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function seedMongoCatalog(products: any[], categories: any[]): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/mongo/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, categories }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Database seeding failed');
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function placeOrderInMongo(orderData: Partial<MongoOrder>): Promise<{ success: boolean; order?: MongoOrder; error?: string }> {
  try {
    const res = await fetch('/api/mongo/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record order in MongoDB');
    return { success: true, order: data.order };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOrdersFromMongo(): Promise<MongoOrder[]> {
  try {
    const res = await fetch('/api/mongo/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();
    return data.orders || [];
  } catch (err) {
    console.warn('Error fetching orders from MongoDB:', err);
    return [];
  }
}

export async function subscribeNewsletterInMongo(email: string, source: string = 'footer'): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/mongo/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Subscription failed');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getMongoActivityLogs(): Promise<MongoActivityLog[]> {
  try {
    const res = await fetch('/api/mongo/logs');
    if (!res.ok) throw new Error('Failed to fetch MongoDB activity logs');
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('Error fetching MongoDB logs:', err);
    return [];
  }
}
