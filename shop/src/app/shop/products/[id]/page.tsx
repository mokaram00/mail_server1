'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubdomainLink from '@/components/SubdomainLink';
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  
  // Unwrap the params promise
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const productData = await getProduct(productId);
      setProduct(productData);
      setLoading(false);
      
      // Fetch suggestions after product data is loaded
      if (productData) {
        setSuggestionsLoading(true);
        // Pass productType if it exists on the product object
        const productType = (productData as any).productType || undefined;
        const suggestionData = await getProductSuggestions(productId, productType);
        setSuggestions(suggestionData);
        setSuggestionsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-base">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FaSearch className="text-gray-400 text-8xl mb-6 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Product not found
          </h3>
          <p className="text-gray-600 text-base mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <SubdomainLink
            href="/products"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl text-base font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Browse all products
          </SubdomainLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image Display */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden aspect-square relative">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${product.images[currentImageIndex]}`}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  onError={(e) => {
                    // Replace with placeholder when image fails to load
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div class="text-center">
                          <div class="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                            <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p class="text-sm font-medium text-gray-600">No Image Available</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">No Image Available</p>
                  </div>
                </div>
              )}

              {/* Image counter */}
              {product.images && product.images.length > 1 && (
                <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all duration-300 transform hover:scale-105 ${currentImageIndex === index
                      ? 'border-blue-500 ring-2 ring-blue-300'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}${image}`}
                      alt={`${product.name} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Replace with placeholder when image fails to load
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div class="text-center">
                              <div class="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded mx-auto flex items-center justify-center">
                                <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>

              {product.featured && (
                <div className="inline-block bg-gradient-to-br from-blue-600 to-blue-800 text-white px-3 py-1.5 rounded-full text-sm font-bold mb-3 shadow-md">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Featured
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ${product.price}
                </span>
                <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${product.stock > 0
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                  {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Product Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium text-sm">SKU:</span>
                  <span className="text-gray-900 text-sm font-medium">{product._id.slice(-8)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium text-sm">Product Type:</span>
                  <span className="text-gray-900 text-sm font-medium">{product.productType || 'Other'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium text-sm">Stock:</span>
                  <span className={`font-semibold text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium text-sm">Date Added:</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                className={`w-full py-3 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] ${product.stock > 0
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${addingToCart ? 'opacity-75 pointer-events-none' : ''}`}
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

              <div className="grid grid-cols-1 gap-3">
                <button 
                  className="py-2.5 px-4 rounded-xl text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium transform hover:scale-[1.02] text-sm flex items-center justify-center space-x-2 shadow-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    // Show a toast or notification here if you have one
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Share Product</span>
                </button>
              </div>
            </div>

            {/* Back to Products */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium transform hover:scale-105 text-sm"
              >
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to all products
              </button>
            </div>
          </div>
        </div>

        {/* Product Suggestions */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2 rtl:space-x-reverse">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>You Might Also Like</span>
              </h3>
              <SubdomainLink
                href="/products"
                className="text-base font-medium text-gray-600 hover:text-black transition-colors duration-300"
              >
                View All →
              </SubdomainLink>
            </div>

            {/* Loading state for suggestions */}
            {suggestionsLoading ? (
              <div className="flex space-x-6 rtl:space-x-reverse min-w-max pb-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-56 bg-gray-50 rounded-xl overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Horizontal scrollable suggestions */
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-4 rtl:space-x-reverse min-w-max">
                  {(suggestions || []).map((suggestion) => (
                    <SubdomainLink
                      key={suggestion._id}
                      href={`/products/${suggestion._id}`}
                      className="group flex-shrink-0 w-56 bg-gray-50 rounded-2xl overflow-hidden hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                                    <p class="text-sm font-medium">No Image Available</p>
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
                              <p className="text-sm font-medium">No Image Available</p>
                            </div>
                          </div>
                        )}
                        {suggestion.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-base">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1">
                          {suggestion.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-gray-900">
                            ${suggestion.price}
                          </span>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${suggestion.stock > 0
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            {suggestion.stock > 0 ? 'In Stock' : 'Out'}
                          </span>
                        </div>
                      </div>
                    </SubdomainLink>
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
