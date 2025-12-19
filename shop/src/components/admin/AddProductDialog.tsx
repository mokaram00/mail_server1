'use client';

import { useState } from 'react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category?: { _id: string; name: string };
  stock: number;
  featured: boolean;
  images: string[];
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (event: React.FormEvent, productData: FormData) => Promise<void>;
}

export default function AddProductDialog({ isOpen, onClose, onAddProduct }: AddProductDialogProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: string;
    stock: string;
    featured: boolean;
    images: Array<{
      data: string;
      filename: string;
      contentType: string;
    }>;
  }>({
    name: '',
    description: '',
    price: '',
    stock: '',
    featured: false,
    images: []
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(fileArray);

      // Create previews
      const previewArray = fileArray.map(file => URL.createObjectURL(file));
      setImagePreviews(previewArray);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Clear previous errors
    setErrors({});

    // Client-side validation
    const newErrors: {[key: string]: string} = {};

    if (!productForm.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (productForm.description.length < 10) {
      newErrors.description = 'Product description must be at least 10 characters';
    }

    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      newErrors.price = 'Product price must be greater than 0';
    }

    if (!productForm.stock || parseInt(productForm.stock) < 0) {
      newErrors.stock = 'Product stock must be 0 or greater';
    }

    if (selectedImages.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('You must log in first');
      return;
    }

    setIsCreatingProduct(true);
    setIsUploadingImages(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setErrors({
          name: 'Unauthorized access',
        });
        return;
      }

      const data = await response.json();
      if (data.user.role !== 'admin') {
        setErrors({
          name: 'Unauthorized access',
        });
        return;
      }

      const productData = new FormData();
      productData.append('name', productForm.name);
      productData.append('description', productForm.description);
      productData.append('price', productForm.price);
      productData.append('stock', productForm.stock);
      productData.append('featured', productForm.featured ? 'on' : 'off');

      selectedImages.forEach((file, index) => {
        productData.append('images', file);
      });

      await onAddProduct(event, productData);
    } catch (error: any) {
      console.error('Error sending data:', error);
      setErrors({
        name: 'Unauthorized access',
      });
    } finally {
      setIsCreatingProduct(false);
      setIsUploadingImages(false);
    }
  };

  const handleClose = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      featured: false,
      images: []
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Price ($)
              </label>
              <input
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                  errors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Stock
              </label>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                  errors.stock ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Description
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                  errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="Enter product description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 transition-all duration-300 ${
                  errors.images ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
              />
              {errors.images && (
                <p className="mt-1 text-sm text-red-600">{errors.images}</p>
              )}
            </div>
            {imagePreviews.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Selected Images ({imagePreviews.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImages(prev => prev.filter((_, i) => i !== index));
                          setImagePreviews(prev => prev.filter((_, i) => i !== index));
                          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                          if (input) {
                            const dt = new DataTransfer();
                            selectedImages.filter((_, i) => i !== index).forEach(file => {
                              dt.items.add(file);
                            });
                            input.files = dt.files;
                          }
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded border-2 border-gray-300 text-black focus:ring-black focus:ring-2"
                />
                <span className="mr-2 text-sm font-medium text-gray-900">
                  Featured Product
                </span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingProduct || isUploadingImages}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform shadow-lg ${
                isCreatingProduct || isUploadingImages
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black hover:scale-105'
              }`}
            >
              {isUploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block ml-2"></div>
                  Uploading Images...
                </>
              ) : isCreatingProduct ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block ml-2"></div>
                  Adding Product...
                </>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}