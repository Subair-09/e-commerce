import { AzureBlobItem, AzureStorageStatus } from '../types';

export async function getAzureStorageStatus(): Promise<AzureStorageStatus> {
  try {
    const res = await fetch('/api/storage/status');
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      mode: 'error',
      accountName: 'Unavailable',
      defaultContainer: 'auraassets',
      containers: ['auraassets'],
      message: err.message || 'Could not connect to storage backend.',
    };
  }
}

export async function listAzureBlobs(container: string = 'auraassets'): Promise<AzureBlobItem[]> {
  try {
    const res = await fetch(`/api/storage/blobs?container=${encodeURIComponent(container)}`);
    if (!res.ok) throw new Error('Failed to retrieve blobs');
    const data = await res.json();
    return data.blobs || [];
  } catch (err) {
    console.error('Error fetching blobs:', err);
    return [];
  }
}

export async function uploadToAzureStorage(
  file: File, 
  container: string = 'auraassets',
  customFileName?: string
): Promise<{ success: boolean; blob?: AzureBlobItem; error?: string; mode?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('container', container);
    if (customFileName) {
      formData.append('fileName', customFileName);
    }

    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return {
      success: true,
      blob: data.blob,
      mode: data.mode,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'File upload failed',
    };
  }
}

export async function deleteAzureBlob(
  name: string, 
  container: string = 'auraassets'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/storage/blob?name=${encodeURIComponent(name)}&container=${encodeURIComponent(container)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Delete failed');
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function backupOrderReceiptToAzure(
  orderData: Record<string, any>
): Promise<{ success: boolean; blobName?: string; url?: string; error?: string; mode?: string }> {
  try {
    const res = await fetch('/api/storage/orders/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Order backup failed');
    }
    return {
      success: true,
      blobName: data.blobName,
      url: data.url,
      mode: data.mode,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncCatalogToAzure(
  products: any[],
  categories: any[]
): Promise<{ success: boolean; url?: string; error?: string; mode?: string }> {
  try {
    const res = await fetch('/api/storage/catalog/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, categories }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Catalog sync failed');
    }
    return {
      success: true,
      url: data.url,
      mode: data.mode,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
