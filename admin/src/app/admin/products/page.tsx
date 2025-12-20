'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';
import Image from 'next/image';



interface EmailAccount {
  _id: string;
  email: string;
  username: string;
  isActive: boolean;
  accountClassification?: string; // Add classification field
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string[];
  productType: string;
  selectedEmails?: string[];
  createdAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  featured: boolean;
  images: string[];
  productType: string;
  selectedEmails: string[];
}

export default function ProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [loading, setLoading] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAllEmails, setSelectAllEmails] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    featured: false,
    images: [],
    productType: 'accounts',
    selectedEmails: []
  });
  
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // For image previews
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // For actual files to upload
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [classifications, setClassifications] = useState<string[]>([]); // For storing unique classifications
  const [selectedClassification, setSelectedClassification] = useState<string>(''); // For filtering by classification

  // Fetch email accounts
  useEffect(() => {
    const fetchEmailAccounts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch email accounts');
        }
        
        const data = await response.json();
        setEmailAccounts(data.emails || []);
        setFilteredEmails(data.emails || []);
        
        // Extract unique classifications
        const uniqueClassifications = Array.from(
          new Set(data.emails?.map((email: EmailAccount) => email.accountClassification).filter(Boolean))
        ) as string[];
        setClassifications(uniqueClassifications);
      } catch (err) {
        console.error('Error fetching email accounts:', err);
        setErrorMessage('Failed to load email accounts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmailAccounts();
  }, []);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setErrorMessage('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };
    
    if (activeTab === 'list') {
      fetchProducts();
    }
  }, [activeTab]);

  // Filter emails based on search term and classification
  useEffect(() => {
    let filtered = emailAccounts;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(email => 
        email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by classification
    if (selectedClassification) {
      filtered = filtered.filter(email => 
        email.accountClassification === selectedClassification
      );
    }
    
    setFilteredEmails(filtered);
  }, [searchTerm, emailAccounts, selectedClassification]);

  // Handle select all emails
  useEffect(() => {
    if (selectAllEmails) {
      setSelectedEmails(filteredEmails.map(email => email._id));
    } else {
      setSelectedEmails([]);
    }
  }, [selectAllEmails, filteredEmails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(emailId)) {
        return prev.filter(id => id !== emailId);
      } else {
        return [...prev, emailId];
      }
    });
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert FileList to array
    const fileArray = Array.from(files);
    
    // Create preview URLs
    const previews = fileArray.map(file => URL.createObjectURL(file));
    
    // Update image previews
    setImagePreviews(prev => [...prev, ...previews]);
    
    // Store the actual files for upload
    setSelectedFiles(prev => [...prev, ...fileArray]);
    
    // For new images, we'll store temporary names as placeholders
    const tempNames = fileArray.map((_, index) => `temp-${Date.now()}-${index}`);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...tempNames]
    }));
  };

  // Remove an image
  const removeImage = (index: number) => {
    const imageToRemove = formData.images[index];
    
    // Check if this is an existing image (URL) or a new image (temporary name)
    const isExistingImage = !imageToRemove.startsWith('temp-');
    const isMarkedForDeletion = imageToRemove.startsWith('delete:');
    
    if (isExistingImage && !isMarkedForDeletion) {
      // For existing images, we need to mark them for deletion
      setFormData(prev => {
        const newImages = [...prev.images];
        // Mark for deletion by prefixing with "delete:"
        newImages[index] = `delete:${imageToRemove}`;
        return {
          ...prev,
          images: newImages
        };
      });
    } else if (!isExistingImage) {
      // For new images (temp images), remove them completely
      
      // Find the corresponding preview index
      let previewIndex = -1;
      let tempCounter = 0;
      
      for (let i = 0; i < formData.images.length; i++) {
        if (!formData.images[i].startsWith('temp-')) continue;
        
        if (i === index) {
          previewIndex = tempCounter;
          break;
        }
        tempCounter++;
      }
      
      if (previewIndex >= 0 && previewIndex < imagePreviews.length) {
        // Clean up the preview URL
        URL.revokeObjectURL(imagePreviews[previewIndex]);
        
        // Remove from previews
        setImagePreviews(prev => {
          const newPreviews = [...prev];
          newPreviews.splice(previewIndex, 1);
          return newPreviews;
        });
        
        // Remove from selected files
        setSelectedFiles(prev => {
          const newFiles = [...prev];
          newFiles.splice(previewIndex, 1);
          return newFiles;
        });
      }
      
      // Update form data to remove the image reference
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages.splice(index, 1);
        return {
          ...prev,
          images: newImages
        };
      });
    } else {
      // For images already marked for deletion, remove them completely
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages.splice(index, 1);
        return {
          ...prev,
          images: newImages
        };
      });
    }
  };

  // Upload images to server
  const uploadImages = async (productId?: string): Promise<string[]> => {
    if (selectedFiles.length === 0) {
      return [];
    }

    const formData = new FormData();
    
    // Add product ID to form data first, before files
    // This ensures that req.body.productId is available in the multer destination function
    if (productId) {
      formData.append('productId', productId);
    }
    
    // Then add the image files
    selectedFiles.forEach((file, index) => {
      formData.append('images', file);
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    const data = await response.json();
    return data.files;
  };

  // Select all emails for a specific classification
  const selectClassificationEmails = (classification: string) => {
    const emailsOfClassification = emailAccounts.filter(
      email => email.accountClassification === classification
    ).map(email => email._id);
    
    setSelectedEmails(prev => {
      // Merge with existing selections, avoiding duplicates
      const merged = [...new Set([...prev, ...emailsOfClassification])];
      return merged;
    });
  };

  const toggleSelectAllEmails = () => {
    if (selectAllEmails) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email._id));
    }
    setSelectAllEmails(!selectAllEmails);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (formData.description.length < 10) {
      newErrors.description = 'Product description must be at least 10 characters';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Product price must be greater than 0';
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Product stock must be 0 or greater';
    }
    
    if (formData.productType === 'accounts' && selectedEmails.length === 0) {
      newErrors.selectedEmails = 'At least one email account must be selected';
    }
    
    // Optional: Add image validation if needed
    // For example, limit the number of images
    if (formData.images.length > 10) {
      newErrors.images = 'You can upload a maximum of 10 images';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      if (activeTab === 'edit' && editingProductId) {
        // For editing existing products, we have the product ID
        let imageUrls: string[] = [];
        
        // Upload new images with the existing product ID
        if (selectedFiles.length > 0) {
          imageUrls = await uploadImages(editingProductId);
        }
        
        // Combine existing images (that aren't marked for deletion) with new uploaded images
        const existingImages = formData.images
          .filter(img => !img.startsWith('temp-') && !img.startsWith('delete:'))
          .map(img => img.replace('delete:', '')); // Remove delete marker if present
        
        const allImageUrls = [...existingImages, ...imageUrls];
        
        // Prepare form data as JSON object
        const productData = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          featured: formData.featured,
          images: allImageUrls, // Use the combined image URLs
          productType: formData.productType,
          selectedEmails: selectedEmails
        };
        
        // Update existing product
        const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${editingProductId}`, productData);
        
        if (!response.ok) {
          let errorMessage = 'Failed to update product';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If we can't parse the error response, use the status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setSuccessMessage(data.message || 'Product updated successfully');
      } else {
        // For new products, we need to create the product first to get its ID
        // Then upload images directly to the product-specific folder
        
        // Prepare form data without images initially
        const productData = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          featured: formData.featured,
          images: [], // No images initially
          productType: formData.productType,
          selectedEmails: selectedEmails
        };
        
        // Create product first to get its ID
        const createResponse = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`, productData);
        
        if (!createResponse.ok) {
          let errorMessage = 'Failed to create product';
          try {
            const errorData = await createResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If we can't parse the error response, use the status text
            errorMessage = createResponse.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const createData = await createResponse.json();
        const newProductId = createData.product._id;
        
        // Now upload images directly to the product-specific folder
        let imageUrls: string[] = [];
        if (selectedFiles.length > 0) {
          imageUrls = await uploadImages(newProductId);
        }
        
        // Update the product with the image URLs
        const updateData = {
          ...productData,
          images: imageUrls
        };
        
        const updateResponse = await apiClient.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${newProductId}`,
          updateData
        );
        
        if (!updateResponse.ok) {
          let errorMessage = 'Failed to update product with images';
          try {
            const errorData = await updateResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If we can't parse the error response, use the status text
            errorMessage = updateResponse.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const updateResult = await updateResponse.json();
        setSuccessMessage(updateResult.message || 'Product created successfully');
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        featured: false,
        images: [],
        productType: 'accounts',
        selectedEmails: []
      });
      setSelectedEmails([]);
      setSelectAllEmails(false);
      setEditingProductId(null);
      setImagePreviews([]); // Reset image previews
      setSelectedFiles([]); // Reset selected files
      
      // Switch to list tab and refresh products
      setActiveTab('list');
    } catch (err) {
      console.error(activeTab === 'edit' ? 'Error updating product:' : 'Error creating product:', err);
      setErrorMessage(err instanceof Error ? err.message : `Failed to ${activeTab === 'edit' ? 'update' : 'create'} product`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      const response = await apiClient.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      // Refresh products list
      setProducts(products.filter(product => product._id !== productId));
      setSuccessMessage('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  // Update the editProduct function to properly handle images
  const editProduct = async (product: Product) => {
    // Set form data with product values
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      featured: product.featured,
      images: product.images || [],
      productType: product.productType,
      selectedEmails: product.selectedEmails || []
    });
    
    // Set editing product ID
    setEditingProductId(product._id);
    
    // Switch to edit tab
    setActiveTab('edit');
    
    // Set selected emails for the email selector
    setSelectedEmails(product.selectedEmails || []);
    
    // Clear image previews and selected files when editing
    setImagePreviews([]);
    setSelectedFiles([]);
  };

  if (loading && (activeTab === 'create' || activeTab === 'edit')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products Management</h1>
          <p className="text-foreground/70">Manage your products and inventory</p>
        </div>
        <button 
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-card border border-foreground/20 rounded-lg hover:bg-muted transition-all duration-200 text-foreground transform hover:scale-105 shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-foreground/20">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-primary text-primary'
              : 'text-foreground/70 hover:text-foreground'
          }`}
          onClick={() => setActiveTab('list')}
        >
          Product List
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'create' || activeTab === 'edit'
              ? 'border-b-2 border-primary text-primary'
              : 'text-foreground/70 hover:text-foreground'
          }`}
          onClick={() => {
            // Reset form when switching to create/edit tab
            setFormData({
              name: '',
              description: '',
              price: '',
              stock: '',
              featured: false,
              images: [],
              productType: 'accounts',
              selectedEmails: []
            });
            setSelectedEmails([]);
            setSelectAllEmails(false);
            setEditingProductId(null);
            setImagePreviews([]); // Reset image previews
            setSelectedFiles([]); // Reset selected files
            setActiveTab('create');
          }}
        >
          {activeTab === 'edit' ? 'Edit Product' : 'Create Product'}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500 animate-shake">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive animate-shake">
          {errorMessage}
        </div>
      )}

      {activeTab === 'list' ? (
        // Product List Tab
        <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
          {productsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground/70">No products found</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-foreground/20">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Featured</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Images</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-sm text-foreground/70 line-clamp-1">{product.description}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500 capitalize">
                          {product.productType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground">${product.price.toFixed(2)}</td>
                      <td className="px-4 py-4 text-foreground">
                        {product.productType === 'accounts' 
                          ? `${product.selectedEmails?.length || 0} account(s)` 
                          : `${product.stock} item(s)`}
                      </td>
                      <td className="px-4 py-4">
                        {product.featured ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Yes</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-foreground/20 text-foreground/70">No</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
                          {product.images.length} image(s)
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Create Product Tab
        <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {editingProductId ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-foreground/50 transition-all duration-200 ${
                    errors.name ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Type
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground transition-all duration-200"
                >
                  <option value="accounts">Accounts</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-foreground/50 transition-all duration-200 ${
                    errors.price ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-destructive">{errors.price}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-foreground/50 transition-all duration-200 ${
                    errors.stock ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                  }`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-destructive">{errors.stock}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Product Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-foreground/50 transition-all duration-200 ${
                  errors.description ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                }`}
                placeholder="Enter product description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">{errors.description}</p>
              )}
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="rounded border-2 border-foreground/20 text-primary focus:ring-primary focus:ring-2 bg-background"
                />
                <span className="ml-2 text-sm font-medium text-foreground">
                  Featured Product
                </span>
              </label>
            </div>
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Product Images
              </label>
              <p className="text-sm text-foreground/70 mb-3">
                Upload images for this product (optional)
              </p>
              
              {/* Image Preview Area */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {formData.images.map((image, index) => {
                    // Check if this is an existing image or a new one
                    const isExistingImage = !image.startsWith('temp-');
                    const isMarkedForDeletion = image.startsWith('delete:');
                    
                    return (
                      <div key={index} className="relative group">
                        {isExistingImage ? (
                          image ? (
                            !isMarkedForDeletion ? (
                              <Image
                                src={image.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL}${image}` : image}
                                alt={`Product image ${index + 1}`}
                                width={300}
                                height={200}
                                className={`w-full h-24 object-cover rounded-lg border-2 ${
                                  isMarkedForDeletion
                                    ? 'border-destructive opacity-50'
                                    : 'border-foreground/20'
                                }`}
                                onError={(e) => {
                                  // Replace with placeholder when image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-foreground/20 flex items-center justify-center">
                                      <div class="text-center">
                                        <div class="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mx-auto mb-1 flex items-center justify-center">
                                          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <p class="text-xs font-medium text-gray-600">No Image</p>
                                      </div>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-200 border-2 border-destructive opacity-50 rounded-lg flex items-center justify-center">
                                <span className="text-destructive font-bold">TO BE DELETED</span>
                              </div>
                            )
                          ) : null
                        ) : (
                          (() => {
                            // Find the preview index for this temp image
                            let previewIndex = -1;
                            let tempCounter = 0;
                            
                            for (let i = 0; i < formData.images.length; i++) {
                              if (!formData.images[i].startsWith('temp-')) continue;
                              
                              if (i === index) {
                                previewIndex = tempCounter;
                                break;
                              }
                              tempCounter++;
                            }
                            
                            return previewIndex >= 0 && previewIndex < imagePreviews.length ? (
                              <img
                                src={imagePreviews[previewIndex]}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-foreground/20"
                                onError={(e) => {
                                  // Replace with placeholder when image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-foreground/20 flex items-center justify-center">
                                      <div class="text-center">
                                        <div class="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mx-auto mb-1 flex items-center justify-center">
                                          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <p class="text-xs font-medium text-gray-600">No Image</p>
                                      </div>
                                    </div>
                                  `;
                                }}
                              />
                            ) : null;
                          })()
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {isMarkedForDeletion && (
                          <div className="absolute inset-0 flex items-center justify-center text-destructive font-bold text-xs">
                            DELETE
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* File Input */}
              <div className="flex items-center">
                <label className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 cursor-pointer transition-colors">
                  Choose Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {(formData.images.length > 0 || selectedFiles.length > 0) && (
                  <span className="ml-3 text-sm text-foreground/70">
                    {formData.images.filter(img => !img.startsWith('delete:')).length + selectedFiles.length} image(s) selected
                  </span>
                )}
              </div>
            </div>
            
            {formData.productType === 'accounts' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Email Accounts
                  </label>
                  <p className="text-sm text-foreground/70 mb-3">
                    Choose the email accounts that will be associated with this product
                  </p>
                  
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 min-w-[200px] px-4 py-2 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground placeholder-foreground/50 transition-all duration-200"
                      placeholder="Search email accounts..."
                    />
                    <button
                      type="button"
                      onClick={toggleSelectAllEmails}
                      className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 text-sm"
                    >
                      {selectAllEmails ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {/* Classification filter dropdown */}
                    {classifications.length > 0 && (
                      <select
                        value={selectedClassification}
                        onChange={(e) => setSelectedClassification(e.target.value)}
                        className="px-3 py-2 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
                      >
                        <option value="">All Classifications</option>
                        {classifications.map(classification => (
                          <option key={classification} value={classification}>
                            {classification}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {/* Select by classification buttons */}
                    {classifications.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {classifications.map(classification => (
                          <button
                            key={classification}
                            type="button"
                            onClick={() => selectClassificationEmails(classification)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/330 text-sm"
                          >
                            Select {classification}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {errors.selectedEmails && (
                    <p className="mt-1 text-sm text-destructive">{errors.selectedEmails}</p>
                  )}
                  
                  <div className="max-h-60 overflow-y-auto border border-foreground/20 rounded-lg">
                    {filteredEmails.length > 0 ? (
                      <ul className="divide-y divide-foreground/10">
                        {filteredEmails.map(email => (
                          <li key={email._id} className="p-3 hover:bg-muted/50 transition-colors duration-200">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedEmails.includes(email._id)}
                                onChange={() => handleEmailSelection(email._id)}
                                className="rounded border-2 border-foreground/20 text-primary focus:ring-primary focus:ring-2 bg-background"
                              />
                              <div className="ml-3 flex-1">
                                <div className="font-medium text-foreground">{email.email}</div>
                                <div className="text-sm text-foreground/70">{email.username}</div>
                                {email.accountClassification && (
                                  <div className="text-xs text-foreground/60 mt-1">
                                    Class: {email.accountClassification}
                                  </div>
                                )}
                              </div>
                              <div className={`px-2 py-1 text-xs rounded-full ${email.isActive ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                                {email.isActive ? 'Active' : 'Inactive'}
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-foreground/70">
                        No email accounts found
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-foreground/70">
                    Selected: {selectedEmails.length} account(s)
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-6 py-3 border-2 border-foreground/20 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 transform shadow-lg ${
                  isSubmitting
                    ? 'bg-foreground/50 text-foreground/70 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current inline-block mr-2"></div>
                    {editingProductId ? 'Updating Product...' : 'Creating Product...'}
                  </>
                ) : (
                  editingProductId ? 'Update Product' : 'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}