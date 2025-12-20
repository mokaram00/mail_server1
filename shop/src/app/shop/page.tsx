'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../lib/cart-context';
import { FaStar } from 'react-icons/fa';
import Image from 'next/image';
import apiClient from '../../lib/apiClient';

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const search = searchParams.search as string;
    const productTypeParam = searchParams.productType as string;
    const page = searchParams.page as string || '1';

    const response = await apiClient.getProducts(
      parseInt(page),
      12, // limit
      search || '',
      productTypeParam && productTypeParam !== 'all' ? { productType: productTypeParam } : {}
    );

    return {
      products: response.products || [],
      pagination: {
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 0,
        totalProducts: response.pagination?.totalProducts || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false,
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      products: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalProducts: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

function getProductTypes() {
  // Return static product types since we're using productType field
  return { 
    productTypes: [
      { _id: 'accounts', name: 'Email Accounts' },
      { _id: 'other', name: 'Other Products' }
    ]
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [animatedProductId, setAnimatedProductId] = useState<string | null>(null);

  // Current search and filter state
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [productTypeValue, setProductTypeValue] = useState(searchParams.get('productType') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search suggestions
  const handleSearchInputChange = (value: string) => {
    setSearchValue(value);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for suggestions
    const timer = setTimeout(async () => {
      if (value.length > 2) {
        try {
          // Use our API client to search for products and extract names for suggestions
          const response = await apiClient.getProducts(1, 5, undefined, value);
          if (response.products) {
            const suggestions = response.products.map((product: any) => product.name);
            setSearchSuggestions(suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching search suggestions:', error);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    setShowSuggestions(false);
    setSearching(true);

    const params = new URLSearchParams();
    params.append('search', suggestion);
    if (productTypeValue && productTypeValue !== 'all') params.append('productType', productTypeValue);
    params.append('page', '1');

    router.push(`/products?${params.toString()}`);
    setSearching(false);
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [productsData, productTypesData] = await Promise.all([
        getProducts({
          search: searchParams.get('search') ?? undefined,
          productType: searchParams.get('productType') ?? undefined,
          page: searchParams.get('page') || '1'
        }),
        Promise.resolve(getProductTypes()),
      ]);

      setProducts(productsData.products);
      setPagination(productsData.pagination);
      setCategories(productTypesData.productTypes);
      setCurrentPage(parseInt(searchParams.get('page') || '1'));
      setLoading(false);
    };

    loadData();
  }, [searchParams]);

  // Handle search and filter
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setSearching(true);
    setShowSuggestions(false); // Hide suggestions immediately

    const params = new URLSearchParams();
    if (searchValue) params.append('search', searchValue);
    if (productTypeValue && productTypeValue !== 'all') params.append('productType', productTypeValue);
    params.append('page', '1');

    router.push(`/products?${params.toString()}`);
    setSearching(false);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (searchValue) params.append('search', searchValue);
    if (productTypeValue && productTypeValue !== 'all') params.append('productType', productTypeValue);
    params.append('page', page.toString());

    router.push(`/products?${params.toString()}`);
  };

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0 || addingProductId === product._id) {
      return;
    }

    setAddingProductId(product._id);
    addItem({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/assets/placeholder-image.jpg',
      quantity: 1,
    });
    setAddedProductId(product._id);
    setAnimatedProductId(product._id);
    setTimeout(() => {
      setAddingProductId(null);
      setAddedProductId(null);
      setAnimatedProductId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 transform origin-top">
        {/* Modern Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-8 relative z-20">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                value={searchValue}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => searchValue.length > 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-4 focus:ring-black/20 bg-white/50 backdrop-blur-sm transition-all duration-300 text-gray-900 placeholder-gray-500 font-medium"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />

              {/* Search suggestions dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[200] max-h-48 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent form submission on click
                      className="w-full text-left px-4 py-3 hover:bg-gray-50/80 transition-colors duration-200 border-b border-gray-100/50 last:border-b-0 flex items-center space-x-3 rtl:space-x-reverse"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-700 font-medium">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:w-52">
              <select
                name="productType"
                value={productTypeValue}
                onChange={(e) => setProductTypeValue(e.target.value)}
                className="block w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-4 focus:ring-black/20 bg-white/50 backdrop-blur-sm transition-all duration-300 text-gray-900 font-medium"
              >
                <option value="all">All Product Types</option>
                {categories.map((category: any) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="bg-gradient-to-r from-black to-gray-800 text-white px-8 py-3.5 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-gray-800/20"
            >
              {searching ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <span className="flex items-center space-x-2 rtl:space-x-reverse">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-6 relative z-10 mt-8">
          <div className="inline-flex items-center px-4 py-2 bg-gray-100/80 backdrop-blur-sm rounded-full border border-gray-200/50">
            <svg className="w-4 h-4 text-gray-600 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-700 font-semibold text-sm">
              Found {pagination.totalProducts?.toString() || '0'} products
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="space-y-6">
            {/* Search Bar Loading */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
                </div>
                <div className="lg:w-52">
                  <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
                </div>
                <div className="h-12 w-32 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl animate-pulse"></div>
              </div>
            </div>

            {/* Results Count Loading */}
            <div className="h-10 bg-gray-100/80 backdrop-blur-sm rounded-full animate-pulse w-48"></div>

            {/* Products Grid Loading */}
            <div className="grid grid-cols-5 gap-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
                  {/* Image placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse"></div>
                    {/* Featured badge placeholder */}
                    <div className="absolute top-3 right-3 w-16 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                    {/* Stock status placeholder */}
                    <div className="absolute top-3 left-3 w-20 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Content placeholder */}
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse w-3/4"></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg animate-pulse w-14"></div>
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse w-18"></div>
                    </div>

                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {products.map((product: any) => (
                <div key={product._id} className="group relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 border border-white/50 overflow-hidden">
                  <Link href={`/products/${product._id}`} className="block">
                    {/* Modern Image Container */}
                    <div className="relative aspect-square overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-50 to-gray-100">
                      {product.images && product.images.length > 0 ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${product.images[0]}`}
                            alt={product.name}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-105"
                            onError={(e) => {
                              // Replace with placeholder when image fails to load
                              const target = e.target as HTMLImageElement;
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  <div class="text-center">
                                    <div class="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-xl">
                                      <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <p class="text-sm font-bold text-gray-600">No Image Available</p>
                                  </div>
                                </div>
                              `;
                            }}
                          />

                          {/* Modern Image Overlays */}
                          {product.images.length > 1 && (
                            <>
                              {/* Image counter */}
                              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-xs font-bold shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:bg-black/90">
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>1 / {product.images.length}</span>
                                </div>
                              </div>

                              {/* Thumbnail indicators */}
                              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
                                {product.images.slice(0, 4).map((image: string, index: number) => (
                                  <div
                                    key={index}
                                    className="w-2.5 h-2.5 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-300 shadow-lg group-hover:bg-white group-hover:scale-125"
                                  />
                                ))}
                                {product.images.length > 4 && (
                                  <span className="w-2.5 h-2.5 bg-white/70 backdrop-blur-sm rounded-full text-xs flex items-center justify-center text-gray-700 font-bold shadow-lg transform transition-all duration-300 group-hover:scale-125">
                                    +{product.images.length - 4}
                                  </span>
                                )}
                              </div>

                              {/* Modern hover overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-2 flex items-center space-x-2 rtl:space-x-reverse shadow-2xl border border-white/20">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="text-sm font-bold text-gray-700">
                                      {product.images.length > 1 ? `View ${product.images.length} images` : 'View details'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Featured badge */}
                          {product.featured && (
                            <div className="absolute top-3 right-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-2xl text-xs font-bold shadow-lg transform rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 animate-bounce">
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                <FaStar className="w-3 h-3" />
                                <span>Featured</span>
                              </div>
                            </div>
                          )}

                          {/* Stock status */}
                          <div className={`absolute px-3 py-1.5 rounded-2xl text-xs font-bold shadow-lg transform transition-all duration-300 group-hover:scale-110 ${product.featured
                            ? 'top-12 right-3'
                            : 'top-3 right-3'
                            } ${product.stock > 0
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                            }`}>
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center transform transition-all duration-300 group-hover:scale-110">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-xl">
                              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-gray-600">No Image Available</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modern Product Info */}
                    <div className="p-5">
                      <div className="mb-3">
                        <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-black transition-colors duration-300 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                          {product.description}
                        </p>
                      </div>

                      {/* Price and Stock */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-baseline space-x-1 rtl:space-x-reverse">
                          <span className="text-xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">
                            ${product.price}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">USD</span>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-bold ${product.stock > 0
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                          {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                        </div>
                      </div>

                      {/* Modern Action Button */}
                      <button
                        className={`relative w-full py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${product.stock > 0
                          ? 'bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          } ${addingProductId === product._id ? 'opacity-75 pointer-events-none' : ''}
                          ${animatedProductId === product._id ? 'animate-pulse-once' : ''}`}
                        disabled={product.stock === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293A1 1 0 006 16h12M17 19a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 100 4 2 2 0 000-4z" />
                          </svg>
                          <span>
                            {addingProductId === product._id
                              ? 'Adding...'
                              : addedProductId === product._id
                                ? 'Added!'
                                : product.stock > 0
                                  ? 'Add to Cart'
                                  : 'Out of Stock'}
                          </span>
                        </div>
                      </button>
                    </div>
                  </Link>

                  {/* Modern hover glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gray-500/10 to-gray-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>

            {/* Modern Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-3">
                  {pagination.hasPrev && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 transform hover:scale-105 border border-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${pageNum === currentPage
                            ? 'text-white bg-gradient-to-r from-black to-gray-800 shadow-lg scale-105'
                            : 'text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 7 && currentPage < pagination.totalPages - 3 && (
                      <>
                        <span className="px-2 py-2 text-gray-400 font-medium">...</span>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          className="px-3 py-2 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 transform hover:scale-105"
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {pagination.hasNext && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 transform hover:scale-105 border border-gray-200"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="relative">
              <div className="text-gray-400 text-8xl mb-6 transform transition-all duration-500 hover:scale-110">
                <svg className="w-32 h-32 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="absolute inset-0 text-gray-200 text-8xl animate-pulse">
                <svg className="w-32 h-32 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent mb-3">
              No products found
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto leading-relaxed">
              Try adjusting your search or browse all products
            </p>
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-black to-gray-800 text-white px-8 py-3 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-800/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Browse all products</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
