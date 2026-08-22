import React, { useState, useRef, useEffect } from 'react';
import { Product, AdminProductInput, AzureBlobItem } from '../../types';
import { 
  X, 
  Upload, 
  Trash2, 
  Check, 
  AlertCircle, 
  Image as ImageIcon, 
  CloudUpload, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Sparkles,
  FileImage,
  FolderOpen
} from 'lucide-react';
import { uploadToAzureStorage, listAzureBlobs } from '../../services/azureStorage';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: AdminProductInput, id?: string) => Promise<void>;
  onDelete?: (id: string, name: string) => Promise<void>;
  categories: string[];
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  onDelete,
  categories,
}) => {
  const [name, setName] = useState(productToEdit?.name || '');
  const [category, setCategory] = useState(productToEdit?.category || categories[0] || 'Fashion & Apparel');
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '199');
  const [originalPrice, setOriginalPrice] = useState(productToEdit?.originalPrice?.toString() || '');
  const [stockCount, setStockCount] = useState(productToEdit?.reviewsCount ? '45' : '30');
  const [inStock, setInStock] = useState(productToEdit?.inStock !== false);
  const [image, setImage] = useState(productToEdit?.image || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [tag, setTag] = useState(productToEdit?.tag || 'Luxury New');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  
  // Cloud Blobs Browser State
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [cloudBlobs, setCloudBlobs] = useState<AzureBlobItem[]>([]);
  const [loadingBlobs, setLoadingBlobs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setCategory(productToEdit.category || categories[0] || 'Fashion & Apparel');
      setPrice(productToEdit.price?.toString() || '199');
      setOriginalPrice(productToEdit.originalPrice?.toString() || '');
      setStockCount('35');
      setInStock(productToEdit.inStock !== false);
      setImage(productToEdit.image || '');
      setDescription(productToEdit.description || '');
      setTag(productToEdit.tag || 'Luxury New');
      setUploadedFileMeta(productToEdit.image ? { name: 'Existing Product Media', size: 'Loaded', type: 'image' } : null);
    } else {
      setName('');
      setCategory(categories[0] || 'Fashion & Apparel');
      setPrice('240');
      setOriginalPrice('320');
      setStockCount('40');
      setInStock(true);
      setImage('');
      setDescription('Precision crafted with archival materials and timeless minimalist silhouette.');
      setTag('New Arrival');
      setUploadedFileMeta(null);
    }
    setError(null);
    setUploadError(null);
  }, [productToEdit, categories, isOpen]);

  // Load cloud blobs if cloud picker is opened
  useEffect(() => {
    if (showCloudPicker) {
      setLoadingBlobs(true);
      listAzureBlobs('auraassets')
        .then((blobs) => {
          setCloudBlobs(blobs.filter(b => b.contentType?.startsWith('image/') || b.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)));
        })
        .catch(() => setCloudBlobs([]))
        .finally(() => setLoadingBlobs(false));
    }
  }, [showCloudPicker]);

  // Handle Drag & Drop Files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleProcessAndUploadFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleProcessAndUploadFile(file);
    }
  };

  // Upload the selected image file
  const handleProcessAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image size exceeds 25MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formattedSize = (file.size / 1024) > 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    // 1. Instant local preview
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (loadEvt.target?.result) {
        setImage(loadEvt.target.result as string);
        setUploadedFileMeta({
          name: file.name,
          size: formattedSize,
          type: file.type,
        });
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to storage service (Azure Storage / Server)
    try {
      const res = await uploadToAzureStorage(file, 'auraassets');
      if (res.success && res.blob?.url) {
        setImage(res.blob.url);
        setUploadedFileMeta({
          name: res.blob.name || file.name,
          size: formattedSize,
          type: file.type,
        });
      }
    } catch (err: any) {
      console.warn('Storage upload warning (fallback to high-res data URL):', err);
      // Even if Azure network fails, local base64 preview is already set in state!
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    setUploadedFileMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please provide a valid price greater than $0.');
      return;
    }

    if (!image) {
      setError('Please upload a product photo before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: AdminProductInput = {
        name: name.trim(),
        category,
        price: numPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        stockCount: parseInt(stockCount, 10) || 20,
        inStock,
        image: image.trim(),
        description: description.trim(),
        tag: tag.trim() || undefined,
      };

      await onSave(payload, productToEdit?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const samplePresets = [
    { label: 'Leather Tote Bag', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&fit=crop' },
    { label: 'Minimalist Timepiece', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop' },
    { label: 'Silk Slip Dress', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&fit=crop' },
    { label: 'Cashmere Knit', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&fit=crop' },
    { label: 'Signature Footwear', url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&fit=crop' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" id="admin-product-modal-backdrop">
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-gray-100" id="admin-product-modal-container">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-[#0B0F13]">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#00ED64] uppercase font-bold">Catalog Management</span>
            <h3 className="text-xl font-bold text-white">
              {productToEdit ? 'Edit Product Item' : 'Create New Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            id="btn-close-product-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Product Title *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Italian Calfskin Heritage Tote"
                className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                required
                id="input-product-name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                id="select-product-category"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#11161B] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Retail Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="240.00"
                className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                required
                id="input-product-price"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Original Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="320.00"
                className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                id="input-product-orig-price"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Stock Count (Units)</label>
              <input
                type="number"
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="35"
                className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                id="input-product-stock"
              />
            </div>
          </div>

          {/* PRIMARY IMAGE UPLOAD SECTION */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-[#00ED64]" />
                <span>Upload Product Image *</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloudPicker(!showCloudPicker)}
                  className="text-[11px] text-[#00ED64] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  id="btn-toggle-cloud-picker"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>{showCloudPicker ? 'Hide Storage Blobs' : 'Browse Storage Blobs'}</span>
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
              id="file-upload-input"
            />

            {/* Cloud Storage Blobs Picker Dropdown Grid */}
            {showCloudPicker && (
              <div className="bg-[#0B0F13] border border-gray-800 rounded-xl p-3.5 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-semibold text-gray-200">Azure Storage Library (auraassets)</span>
                  <span>Click any image to select</span>
                </div>
                {loadingBlobs ? (
                  <div className="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00ED64]" />
                    <span>Loading cloud assets...</span>
                  </div>
                ) : cloudBlobs.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                    {cloudBlobs.map((blob, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImage(blob.url);
                          setUploadedFileMeta({
                            name: blob.name,
                            size: `${Math.round(blob.size / 1024)} KB`,
                            type: blob.contentType || 'image',
                          });
                          setShowCloudPicker(false);
                        }}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-[#00ED64] transition-all bg-black cursor-pointer"
                      >
                        <img src={blob.url} alt={blob.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Check className="w-4 h-4 text-[#00ED64]" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-xs text-gray-500">
                    No images found in cloud storage container. Upload one below!
                  </div>
                )}
              </div>
            )}

            {/* If Image is Uploaded / Selected: Display Detailed Preview Card */}
            {image ? (
              <div className="bg-[#182026] border border-gray-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4 relative group" id="uploaded-image-preview-card">
                <div className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-700 bg-black shrink-0 shadow-md">
                  <img src={image} alt="Uploaded Preview" className="w-full h-full object-cover" />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-[#00ED64] text-[10px] font-bold">
                      <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                      <span>Saving to Azure...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 w-full sm:w-auto text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#0078D4]/15 text-[#00A4EF] px-2 py-0.5 rounded-full border border-[#0078D4]/30">
                      <CloudUpload className="w-3 h-3" />
                      <span>Azure Blob Storage</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#00ED64]/15 text-[#00ED64] px-2 py-0.5 rounded-full border border-[#00ED64]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Stored in MongoDB</span>
                    </span>
                    {uploadedFileMeta && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {uploadedFileMeta.size}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {uploadedFileMeta?.name || 'Uploaded Product Photo'}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    Image file stored in <strong className="text-gray-300">Azure Storage (auraassets)</strong> and URL referenced on <strong className="text-gray-300">MongoDB products</strong> collection.
                  </p>

                  {/* Actions for current image */}
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg border border-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
                      id="btn-replace-image"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload New Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium rounded-lg border border-red-800/40 transition-colors flex items-center gap-1 cursor-pointer"
                      id="btn-remove-image"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Drag & Drop Upload Dropzone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-[#00ED64] bg-[#00ED64]/10 scale-[1.01]'
                    : 'border-gray-700/80 bg-[#182026]/70 hover:bg-[#182026] hover:border-gray-500'
                }`}
                id="product-image-dropzone"
              >
                <div className="w-12 h-12 rounded-full bg-[#0B0F13] border border-gray-700 flex items-center justify-center text-[#00ED64] shadow-inner">
                  {isUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <CloudUpload className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">
                    {isUploading ? 'Uploading image to Cloud CDN...' : 'Click to Upload or Drag & Drop Photo'}
                  </div>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, WEBP, GIF, SVG up to 25MB
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0B0F13] rounded-lg border border-gray-700/80 text-[11px] font-semibold text-[#00ED64]">
                  <Upload className="w-3 h-3" />
                  <span>Choose file from your device</span>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Fast Preset Inspiration (Fallback when creating sample items) */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto text-[11px] text-gray-400">
              <span className="shrink-0 flex items-center gap-1 font-semibold text-gray-300">
                <Sparkles className="w-3 h-3 text-[#00ED64]" />
                <span>Or Pick Sample Studio Shot:</span>
              </span>
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImage(preset.url);
                    setUploadedFileMeta({
                      name: preset.label,
                      size: 'Studio Sample',
                      type: 'image/jpeg',
                    });
                  }}
                  className="px-2 py-1 bg-[#0B0F13] hover:bg-gray-800 border border-gray-800 hover:border-[#00ED64] rounded-lg text-gray-300 hover:text-white transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <img src={preset.url} alt={preset.label} className="w-3.5 h-3.5 rounded-xs object-cover" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tag & In Stock Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Badge / Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Best Seller, Exclusive"
                className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64]"
                id="input-product-tag"
              />
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-5 h-5 accent-[#00ED64] rounded rounded-md"
                  id="checkbox-product-instock"
                />
                <span className="text-sm font-medium text-white">Active in Store & In Stock</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description & Materials</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a concise description of craftsmanship, fabric, and sizing..."
              className="w-full bg-[#182026] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ED64] resize-none"
              id="textarea-product-desc"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-800">
            {productToEdit && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete "${productToEdit.name}" from MongoDB catalog?`)) {
                    await onDelete(productToEdit.id, productToEdit.name);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-delete-from-modal"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Product</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors cursor-pointer"
                id="btn-cancel-product-modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || isUploading}
                className="px-6 py-2.5 rounded-xl bg-[#00ED64] hover:bg-[#00c954] text-[#001E2B] text-sm font-bold transition-all shadow-lg shadow-[#00ED64]/10 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                id="btn-submit-product"
              >
                {saving ? (
                  <span>Saving to MongoDB...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

