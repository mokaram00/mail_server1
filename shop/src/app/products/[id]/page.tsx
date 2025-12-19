'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useCart } from '@/lib/cart-context';
import { FaSearch } from 'react-icons/fa';

async function getProduct(productSlug: string) {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Product API failed:', res.status, res.statusText);
      return null;
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Product API returned non-JSON response:', contentType);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
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
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
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
                  {t('products.featured')}
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
                  {product.stock > 0 ? t('products.inStock').replace('{count}', product.stock.toString()) : t('products.outOfStock')}
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
                  <span className="text-gray-600 font-medium text-xs">Category:</span>
                  <span className="ml-1 text-gray-900 text-xs">{product.category?.name || 'Uncategorized'}</span>
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
                    ? t('products.addingToCart') ?? 'Adding...'
                    : addSuccess
                      ? t('products.addedToCart') ?? 'Added!'
                      : t('products.addToCart')
                  : t('products.outOfStock')}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button className="py-1.5 px-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 font-medium transform hover:scale-105 text-xs">
                  Add to Wishlist
                </button>
                <button className="py-1.5 px-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 font-medium transform hover:scale-105 text-xs">
                  Share Product
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

            {/* Horizontal scrollable suggestions */}
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-4 rtl:space-x-reverse min-w-max">
                {/* Mock product suggestions - in real app, this would come from API */}
                {[
                  { id: '1', name: 'Wireless Earbuds', price: 89, image: '/assets/placeholder-image.jpg', stock: 15 },
                  { id: '2', name: 'Phone Case', price: 25, image: '/assets/placeholder-image.jpg', stock: 45 },
                  { id: '3', name: 'Screen Protector', price: 15, image: '/assets/placeholder-image.jpg', stock: 78 },
                  { id: '4', name: 'Charging Cable', price: 19, image: '/assets/placeholder-image.jpg', stock: 123 },
                  { id: '5', name: 'Power Adapter', price: 35, image: '/assets/placeholder-image.jpg', stock: 56 }
                ].map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`/products/${encodeURIComponent(suggestion.name.replace(/\s+/g, '-').toLowerCase())}`}
                    className="group flex-shrink-0 w-48 bg-gray-50 rounded-xl overflow-hidden hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                      <img
                        src={suggestion.image}
                        alt={suggestion.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
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
          </div>
        </div>
      </div>
    </div>
  );
}