import { User, AuthResponse, MongoOrder } from '../types';

const TOKEN_KEY = 'aura_auth_token';
const USER_KEY = 'aura_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: User, token: string) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to save session to localStorage:', err);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to clear session:', err);
  }
}

export async function registerCustomer(params: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data: AuthResponse = await res.json();
    if (data.success && data.user && data.token) {
      saveSession(data.user, data.token);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Connection to authentication service failed.',
    };
  }
}

export const MASTER_ADMIN_EMAIL = 'subby@gmail.com';
export const MASTER_ADMIN_DEFAULT_PASSWORD = 'Adewale_@09';

export function isUserAdmin(user: User | null): boolean {
  return !!user && user.role === 'admin' && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
}

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data: AuthResponse = await res.json();
    if (data.success && data.user && data.token) {
      saveSession(data.user, data.token);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Connection to administrative authentication service failed.',
    };
  }
}

export async function loginCustomer(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data: AuthResponse = await res.json();
    if (data.success && data.user && data.token) {
      saveSession(data.user, data.token);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Connection to authentication service failed.',
    };
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  const cached = getStoredUser();
  if (!token && !cached) return null;

  try {
    const res = await fetch(`/api/auth/me${cached ? `?userId=${cached.id}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearSession();
        return null;
      }
      return cached;
    }
    const data = await res.json();
    if (data.success && data.user) {
      if (token) saveSession(data.user, token);
      return data.user;
    }
    return cached;
  } catch {
    return cached;
  }
}

export async function updateCustomerProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'phone' | 'addresses' | 'vipTier' | 'vipPoints'>>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      const token = getStoredToken() || '';
      saveSession(data.user, token);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Profile update failed' };
  }
}

export async function fetchCustomerOrders(email: string): Promise<MongoOrder[]> {
  try {
    const res = await fetch(`/api/auth/orders?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      return data.orders;
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch customer orders:', err);
    return [];
  }
}
