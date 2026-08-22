import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Cloud, 
  Upload, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  HardDrive, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Database, 
  ShieldCheck, 
  AlertCircle,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import { AzureBlobItem, AzureStorageStatus } from '../types';
import { 
  getAzureStorageStatus, 
  listAzureBlobs, 
  uploadToAzureStorage, 
  deleteAzureBlob, 
  syncCatalogToAzure 
} from '../services/azureStorage';
import { ALL_PRODUCTS, CATEGORIES } from '../data/mockData';

interface AzureStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'cart' | 'wishlist') => void;
}

export const AzureStorageModal: React.FC<AzureStorageModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [status, setStatus] = useState<AzureStorageStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<string>('auraassets');
  const [blobs, setBlobs] = useState<AzureBlobItem[]>([]);
  const [loadingBlobs, setLoadingBlobs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load status and blobs on modal open
  useEffect(() => {
    if (isOpen) {
      loadStorageStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedContainer) {
      loadContainerBlobs(selectedContainer);
    }
  }, [isOpen, selectedContainer]);

  const loadStorageStatus = async () => {
    setLoadingStatus(true);
    const res = await getAzureStorageStatus();
    setStatus(res);
    if (res.defaultContainer && !selectedContainer) {
      setSelectedContainer(res.defaultContainer);
    }
    setLoadingStatus(false);
  };

  const loadContainerBlobs = async (containerName: string) => {
    setLoadingBlobs(true);
    const items = await listAzureBlobs(containerName);
    setBlobs(items);
    setLoadingBlobs(false);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const file = files[0];
      const res = await uploadToAzureStorage(file, selectedContainer);

      if (res.success && res.blob) {
        onShowToast('Uploaded to Azure Storage', `Blob '${res.blob.name}' saved to container '${selectedContainer}'.`, 'success');
        loadContainerBlobs(selectedContainer);
      } else {
        onShowToast('Upload Failed', res.error || 'Could not upload file.', 'info');
      }
    } catch (err: any) {
      onShowToast('Upload Error', err.message, 'info');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (blobName: string) => {
    if (!confirm(`Are you sure you want to delete '${blobName}' from Azure Storage?`)) return;

    const res = await deleteAzureBlob(blobName, selectedContainer);
    if (res.success) {
      onShowToast('Blob Deleted', `'${blobName}' was removed from '${selectedContainer}'.`, 'info');
      setBlobs(prev => prev.filter(b => b.name !== blobName));
    } else {
      onShowToast('Delete Failed', res.error || 'Unable to delete blob.', 'info');
    }
  };

  const handleSyncCatalog = async () => {
    setSyncingCatalog(true);
    try {
      const res = await syncCatalogToAzure(ALL_PRODUCTS, CATEGORIES);
      if (res.success) {
        onShowToast('Catalog Synced', 'Latest products & categories uploaded to Azure Storage container `aura-products`.', 'success');
        if (selectedContainer === 'aura-products') {
          loadContainerBlobs('aura-products');
        }
      } else {
        onShowToast('Sync Failed', res.error || 'Could not sync catalog.', 'info');
      }
    } catch (err: any) {
      onShowToast('Sync Error', err.message, 'info');
    } finally {
      setSyncingCatalog(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    onShowToast('URL Copied', 'Azure Blob URL copied to clipboard.', 'info');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        id="azure-storage-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8F8F8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0078D4] text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1A1A1A]">Azure Storage Account</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  status?.configured 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {status?.configured ? 'Live Azure Connected' : 'Azure Ready / Simulation'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Manage cloud media assets, catalog sync, and order receipt blob containers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
            id="close-azure-storage-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Diagnostic Info Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Account Info Box */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-[#F8F8F8] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0078D4] flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account Name</p>
                <p className="text-xs font-bold text-[#1A1A1A] truncate">
                  {status?.accountName || 'aura-storage-account'}
                </p>
              </div>
            </div>

            {/* Active Container Box */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-[#F8F8F8] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5A1F] flex items-center justify-center shrink-0">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Container</p>
                <p className="text-xs font-bold text-[#1A1A1A] truncate">{selectedContainer}</p>
              </div>
            </div>

            {/* Total Stored Blobs Box */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-[#F8F8F8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Stored Items</p>
                  <p className="text-xs font-bold text-[#1A1A1A]">{blobs.length} Blobs</p>
                </div>
              </div>

              <button
                onClick={() => loadContainerBlobs(selectedContainer)}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white text-gray-600 hover:text-black transition-colors cursor-pointer"
                title="Refresh Blobs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBlobs ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>

          {/* Error / Diagnostic Notification Banner */}
          {status?.mode === 'error' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 animate-fade-in" id="azure-storage-error-banner">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Azure Storage Connection Notice</span>
              </div>
              <p className="leading-relaxed">
                {status.message}
              </p>
              <div className="pt-1 text-[11px] text-amber-800 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 font-mono">
                💡 Tip: Double check your Azure Storage connection string or account name in project settings (e.g. ensure <code>AccountName</code> has no typos). The app will continue safely using local fallback storage in the meantime.
              </div>
            </div>
          )}

          {/* Container Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {['auraassets', 'aura-products', 'aura-orders', 'user-uploads'].map((cName) => (
                <button
                  key={cName}
                  onClick={() => setSelectedContainer(cName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedContainer === cName
                      ? 'bg-[#1A1A1A] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>{cName}</span>
                </button>
              ))}
            </div>

            {/* Sync Catalog Button */}
            <button
              onClick={handleSyncCatalog}
              disabled={syncingCatalog}
              className="px-3.5 py-1.5 bg-[#FF5A1F] hover:bg-[#e64e16] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              id="sync-catalog-azure-btn"
            >
              <Database className="w-3 h-3" />
              <span>{syncingCatalog ? 'Syncing...' : 'Sync Catalog to Azure'}</span>
            </button>
          </div>

          {/* Drag & Drop File Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center ${
              dragActive 
                ? 'border-[#FF5A1F] bg-orange-50/50' 
                : 'border-gray-300 hover:border-gray-400 bg-[#FAFAFA]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="azure-file-input"
            />
            
            <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-[#FF5A1F] mb-2">
              <Upload className="w-5 h-5" />
            </div>

            <p className="text-xs font-bold text-[#1A1A1A]">
              Upload Asset to <span className="text-[#FF5A1F]">'{selectedContainer}'</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Drag & drop product images, receipts, or documents (PNG, JPG, JSON, WebP up to 25MB)
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-3 px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#FF5A1F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              id="browse-files-azure-btn"
            >
              {uploading ? 'Uploading to Azure...' : 'Select File to Upload'}
            </button>
          </div>

          {/* Blobs List & Explorer */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#FF5A1F]" />
                <span>Blobs in '{selectedContainer}' ({blobs.length})</span>
              </h4>
            </div>

            {loadingBlobs ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#FF5A1F] mb-2" />
                <p className="text-xs">Fetching blobs from Azure Storage...</p>
              </div>
            ) : blobs.length === 0 ? (
              <div className="py-10 border border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-center p-4">
                <Folder className="w-8 h-8 text-gray-300 mb-1" />
                <p className="text-xs font-bold text-gray-700">No blobs found in container '{selectedContainer}'</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Upload a file or sync the catalog to store items in this Azure container.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {blobs.map((blob) => {
                  const isImage = blob.contentType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(blob.name);
                  const isJson = blob.contentType?.includes('json') || blob.name.endsWith('.json');

                  return (
                    <div
                      key={blob.name}
                      className="p-3 bg-[#FAFAFA] hover:bg-white border border-gray-200 rounded-xl transition-all shadow-xs flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail / Icon */}
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          {isImage ? (
                            <img
                              src={blob.url}
                              alt={blob.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : isJson ? (
                            <FileText className="w-5 h-5 text-amber-500" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-blue-500" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1A1A1A] truncate" title={blob.name}>
                            {blob.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatBytes(blob.size)} • {new Date(blob.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyUrl(blob.url)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
                          title="Copy Blob URL"
                        >
                          {copiedUrl === blob.url ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <a
                          href={blob.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
                          title="Open Blob"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDelete(blob.name)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Blob"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Guide / Environment Note */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#0078D4] shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-950 leading-relaxed">
              <span className="font-bold">Azure Cloud Storage Integration:</span> All uploads, container operations, and catalog snapshots use the official <code className="bg-white/80 px-1 py-0.5 rounded text-[#0078D4] font-mono">@azure/storage-blob</code> SDK on the backend server. To connect directly to your Microsoft Azure subscription, define <code className="bg-white/80 px-1 py-0.5 rounded font-mono">AZURE_STORAGE_CONNECTION_STRING</code> or <code className="bg-white/80 px-1 py-0.5 rounded font-mono">AZURE_STORAGE_ACCOUNT_NAME</code> & <code className="bg-white/80 px-1 py-0.5 rounded font-mono">AZURE_STORAGE_ACCOUNT_KEY</code> in your environment.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-[#F8F8F8] flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Powered by Azure Blob Storage & Node.js Express API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#FF5A1F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
