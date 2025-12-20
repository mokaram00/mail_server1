'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'
import { useCart } from '@/lib/cart-context';
import { FaSearch } from 'react-icons/fa';
import apiClient from '@/lib/apiClient';

async function getProduct(productId: string) {
  try {
    console.log('Fetching product with ID:', productId);
    const response = await apiClient.getProductById(productId);
    console.log('Product response:', response);
    // The backend returns the product directly, not wrapped in an ApiResponse
    // So we need to check if response is the product itself or wrapped in ApiResponse
    if (response && typeof response === 'object' && '_id' in response) {
      // Direct product object
      return response as any; // We know it's a Product
    } else if (response && (response as any).product) {
      // Wrapped in ApiResponse
      return (response as any).product;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// New function to fetch product suggestions
async function getProductSuggestions(currentProductId: string, productType?: string) {
  try {
    // Fetch products excluding the current one, limited to 5 suggestions
    const response = await apiClient.getProducts(
      1, // page
      5, // limit
      undefined, // search term
      productType ? { productType } : {} // filter by same product type if available
    );
    
    // Filter out the current product and take only first 5
    const suggestions = (response.products || [])
      .filter((product: any) => product._id !== currentProductId)
      .slice(0, 5);
      
    return suggestions;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    return [];
  }
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const productData = await getProduct(params.id);
      setProduct(productData);
      setLoading(false);
      
      // Fetch suggestions after product data is loaded
      if (productData) {
        setSuggestionsLoading(true);
        // Pass productType if it exists on the product object
        const productType = (productData as any).productType || undefined;
        const suggestionData = await getProductSuggestions(params.id, productType);
        setSuggestions(suggestionData);
        setSuggestionsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0 || addingToCart) {
      return;
    }

    setAddingToCart(true);
    addItem({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/assets/placeholder-image.jpg',
      quantity: 1,
    });
    setAddSuccess(true);

    // The cart context already dispatches the cart:add event
    // We don't need to dispatch it here

    setTimeout(() => {
      setAddingToCart(false);
      setAddSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FaSearch className="text-gray-400 text-6xl mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Product not found
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-3 transform scale-90 origin-top">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Product Images */}
          <div className="space-y-2">
            {/* Main Image Display */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden aspect-square relative">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${product.images[currentImageIndex]}`}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Replace with placeholder when image fails to load
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div class="text-center">
                          <div class="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mx-auto mb-1 flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p class="text-xs font-medium">No Image Available</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mx-auto mb-1 flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium">No Image Available</p>
                  </div>
                </div>
              )}

              {/* Image counter */}
              {product.images && product.images.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square bg-white rounded-lg shadow-md border-2 overflow-hidden transition-all duration-300 transform hover:scale-105 ${currentImageIndex === index
                      ? 'border-black ring-1 ring-black/20'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}${image}`}
                      alt={`${product.name} ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Replace with placeholder when image fails to load
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div class="text-center">
                              <div class="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md mx-auto flex items-center justify-center">
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        `;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {product.name}
              </h1>

              {product.featured && (
                <div className="inline-block bg-gradient-to-br from-black to-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold mb-2">
                  Featured
                </div>
              )}

              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">
                  ${product.price}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.stock > 0
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                  {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Description
              </h3>
              <p className="text-gray-700 text-xs leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Product Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600 font-medium text-xs">SKU:</span>
                  <span className="ml-1 text-gray-900 text-xs">{product._id.slice(-8)}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium text-xs">Product Type:</span>
                  <span className="ml-1 text-gray-900 text-xs">{product.productType || 'Other'}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium text-xs">Stock:</span>
                  <span className={`ml-1 font-semibold text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium text-xs">Date Added:</span>
                  <span className="ml-1 text-gray-900 text-xs">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${product.stock > 0
                  ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } ${addingToCart ? 'opacity-75 pointer-events-none' : ''}`}
                disabled={product.stock === 0}
                onClick={handleAddToCart}
              >
                {product.stock > 0
                  ? addingToCart
                    ? 'Adding...'
                    : addSuccess
                      ? 'Added!'
                      : 'Add to Cart'
                  : 'Out of Stock'}
              </button>

              <div className="grid grid-cols-1 gap-2">
                <button 
                  className="py-1.5 px-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 font-medium transform hover:scale-105 text-xs flex items-center justify-center space-x-2"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    // Show a toast or notification here if you have one
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Share Product</span>
                </button>
              </div>
            </div>

            {/* Back to Products */}
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium transform hover:scale-105 text-xs"
              >
                <svg className="w-3 h-3 ml-2 rtl:mr-2 rtl:ml-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to all products
              </button>
            </div>
          </div>
        </div>

        {/* Product Suggestions */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2 rtl:space-x-reverse">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>You Might Also Like</span>
              </h3>
              <Link
                href="/products"
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-300"
              >
                View All →
              </Link>
            </div>

            {/* Loading state for suggestions */}
            {suggestionsLoading ? (
              <div className="flex space-x-4 rtl:space-x-reverse min-w-max">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-48 bg-gray-50 rounded-xl overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Horizontal scrollable suggestions */
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-4 rtl:space-x-reverse min-w-max">
                  {(suggestions || []).map((suggestion) => (
                    <Link
                      key={suggestion._id}
                      href={`/products/${suggestion._id}`}
                      className="group flex-shrink-0 w-48 bg-gray-50 rounded-xl overflow-hidden hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                        {suggestion.images && suggestion.images.length > 0 ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${suggestion.images[0]}`}
                            alt={suggestion.name}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Replace with placeholder when image fails to load
                              const target = e.target as HTMLImageElement;
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  <div class="text-center">
                                    <div class="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mx-auto mb-1 flex items-center justify-center shadow-md">
                                      <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <p class="text-xs font-medium">No Image Available</p>
                                  </div>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mx-auto mb-1 flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-xs font-medium">No Image Available</p>
                            </div>
                          </div>
                        )}
                        {suggestion.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">
                          {suggestion.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-900">
                            ${suggestion.price}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${suggestion.stock > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {suggestion.stock > 0 ? 'In Stock' : 'Out'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
