'use client';

import { useState, useEffect } from 'react';


interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string[];
  createdAt: string;
}

interface EditProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEditProduct: (event: React.FormEvent, productData: FormData) => Promise<void>;
  setErrorMessage: (message: string) => void;
  setSuccessMessage: (message: string) => void;
}

export default function EditProductDialog({ isOpen, onClose, product, onEditProduct, setErrorMessage, setSuccessMessage }: EditProductDialogProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        featured: product.featured,
        images: []
      });
    }
  }, [product]);

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

    if (!product) return;

    console.log('🚀 Starting product edit submission...');
    console.log('📝 Form data:', productForm);

    // Clear previous errors
    setErrors({});

    // Client-side validation
    const newErrors: { [key: string]: string } = {};

    if (!productForm.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!productForm.description || productForm.description.length < 10) {
      newErrors.description = 'Product description must be at least 10 characters';
    }

    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      newErrors.price = 'Product price must be greater than 0';
    }

    if (!productForm.stock || parseInt(productForm.stock) < 0) {
      newErrors.stock = 'Product stock must be 0 or greater';
    }
    console.log('🔍 Validation errors:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log('❌ Validation failed, stopping submission');
      return;
    }

    console.log('✅ Validation passed, proceeding with submission');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage('Login required');
      console.log('❌ No token found');
      return;
    }

    console.log('🔑 Token found, checking authentication...');
    setIsCreatingProduct(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setIsCreatingProduct(false);
        setErrorMessage('Unauthorized access');
        console.log('❌ Authentication failed:', response.status);
        return;
      }

      const data = await response.json();
      if (data.user.role !== 'admin') {
        setIsCreatingProduct(false);
        setErrorMessage('You do not have permission to edit products');
        console.log('❌ Not admin user');
        return;
      }

      console.log('✅ Authentication successful, preparing API call');

      const editData = new FormData();
      editData.append('name', productForm.name);
      editData.append('description', productForm.description);
      editData.append('price', productForm.price);
      editData.append('stock', productForm.stock);
      editData.append('featured', productForm.featured ? 'on' : 'off');

      selectedImages.forEach((file) => {
        editData.append('images', file);
      });

      // Add images to delete
      imagesToDelete.forEach((imageUrl) => {
        editData.append('imagesToDelete', imageUrl);
      });

      console.log('📤 Sending edit request to API...');
      console.log('📋 FormData contents:');
      Array.from(editData.entries()).forEach(([key, value]) => {
        console.log(key, value);
      });

      onEditProduct(event, editData);
    } catch (error: any) {
      console.error('Error editing product:', error);
      setErrorMessage(error.message || 'Server connection error');
    } finally {
      setIsCreatingProduct(false);
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
    setImagesToDelete([]);
    setErrors({});
    onClose();
  };

  const handleDeleteImage = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  const handleRestoreImage = (imageUrl: string) => {
    setImagesToDelete(prev => prev.filter(url => url !== imageUrl));
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Edit Product: {product.name}</h3>
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
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                  }`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${errors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                  }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Stock
              </label>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${errors.stock ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
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
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 transition-all duration-300"
              />
              {product.images && product.images.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Current Images ({product.images.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => {
                      const isMarkedForDeletion = imagesToDelete.includes(image);
                      return (
                        <div key={index} className={`relative ${isMarkedForDeletion ? 'opacity-50' : ''}`}>
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 ${isMarkedForDeletion ? 'border-red-300' : 'border-gray-200'
                              }`}
                          />
                          {isMarkedForDeletion ? (
                            <>
                              <span className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                Will be deleted
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRestoreImage(image)}
                                className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-green-600"
                              >
                                ↺
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Current
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(image)}
                                className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                              >
                                ×
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {imagesToDelete.length > 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      {imagesToDelete.length} image(s) will be deleted when saved
                    </p>
                  )}
                </div>
              )}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    New Images ({imagePreviews.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <span className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              disabled={isCreatingProduct}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform shadow-lg ${isCreatingProduct
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black hover:scale-105'
                }`}
            >
              {isCreatingProduct ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block ml-2"></div>
                  Updating Product...
                </>
              ) : (
                'Edit Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}