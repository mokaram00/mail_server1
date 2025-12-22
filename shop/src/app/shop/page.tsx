'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SubdomainLink from '@/components/SubdomainLink';
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
      if (value.length > 1) {
        try {
          // Use our API client to search for products and extract names for suggestions
          const response = await apiClient.getProducts(1, 5, value, {});
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
    <div className="min-h-screen bg-background">
      {/* Add padding top to account for fixed header height */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Enhanced Search Section */}
        <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 mb-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
                Discover Amazing Products
              </h1>
              <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
                Search through our extensive collection of premium products
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col sm:flex-row gap-4 bg-background/80 backdrop-blur-xl rounded-2xl shadow-lg border border-foreground/10 p-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="search"
                      placeholder="Search products by name, category, or keyword..."
                      value={searchValue}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onFocus={() => searchValue.length > 1 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch(e);
                        }
                      }}
                      className="block w-full pl-14 pr-5 py-5 text-xl border-0 focus:ring-0 bg-transparent text-foreground placeholder-foreground/50 rounded-2xl"
                      autoComplete="off"
                    />
                    
                    {/* Search suggestions dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-2xl border border-foreground/10 z-[9999] max-h-96 overflow-y-auto">
                        <div className="p-3 text-sm font-semibold text-foreground/50 uppercase tracking-wider px-5">Suggestions</div>
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseDown={(e) => e.preventDefault()}
                            className="w-full text-left px-5 py-4 hover:bg-foreground/5 transition-colors duration-200 border-b border-foreground/5 last:border-b-0 flex items-center group/suggestion"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <span className="text-foreground text-lg group-hover/suggestion:text-primary transition-colors">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="sm:w-72">
                    <select
                      name="productType"
                      value={productTypeValue}
                      onChange={(e) => setProductTypeValue(e.target.value)}
                      className="block w-full px-5 py-5 text-xl border-0 focus:ring-0 bg-transparent text-foreground rounded-2xl appearance-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
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
                    className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-10 py-5 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {searching ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-3"></div>
                        <span className="text-xl">Searching...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-xl">Search</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Quick search tags */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="text-base text-foreground/70">Quick search:</span>
                {['Popular', 'New Arrivals', 'Best Sellers', 'On Sale'].map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSearchValue(tag);
                      setSearching(true);
                      const params = new URLSearchParams();
                      params.append('search', tag);
                      if (productTypeValue && productTypeValue !== 'all') params.append('productType', productTypeValue);
                      params.append('page', '1');
                      router.push(`/products?${params.toString()}`);
                      setSearching(false);
                    }}
                    className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground/80 text-base rounded-full transition-colors duration-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-card rounded-full border border-foreground/10">
            <svg className="w-4 h-4 text-foreground/70 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-foreground/80 font-medium">
              Found {pagination.totalProducts?.toString() || '0'} products
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="space-y-6">
            {/* Loading Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-card rounded-2xl shadow-lg border border-foreground/10 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-foreground/10"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-foreground/10 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-foreground/10 rounded"></div>
                      <div className="h-3 bg-foreground/10 rounded w-3/4"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-foreground/10 rounded w-16"></div>
                      <div className="h-5 bg-foreground/10 rounded-full w-20"></div>
                    </div>
                    <div className="h-10 bg-foreground/10 rounded-2xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <div key={product._id} className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-foreground/10 overflow-hidden group">
                  <SubdomainLink href={`/products/${product._id}`} className="block">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-foreground/5 to-foreground/10">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL}${product.images[0]}`}
                          alt={product.name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-foreground/5 to-foreground/10">
                                <div class="text-center">
                                  <div class="w-12 h-12 bg-foreground/10 rounded-xl mx-auto mb-2 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p class="text-sm font-medium text-foreground/50">No Image</p>
                                </div>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-foreground/5 to-foreground/10">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-foreground/10 rounded-xl mx-auto mb-2 flex items-center justify-center">
                              <svg className="w-6 h-6 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-foreground/50">No Image</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {product.featured && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>Featured</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Stock Status */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        product.stock > 0 
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-600 border border-red-500/30'
                      }`}>
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-foreground/70 text-sm line-clamp-2 min-h-[2.5rem]">
                          {product.description}
                        </p>
                      </div>

                      {/* Price and Stock */}
                      <div className="flex justify-between items-center mb-5">
                        <div className="text-2xl font-bold text-foreground">
                          ${product.price}
                        </div>
                        <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                          product.stock > 0 
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-600 border border-red-500/30'
                        }`}>
                          {product.stock > 0 ? `${product.stock} left` : 'Sold Out'}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                          product.stock > 0
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg'
                            : 'bg-foreground/10 text-foreground/50 cursor-not-allowed'
                        } ${addingProductId === product._id ? 'opacity-75 pointer-events-none' : ''}`}
                        disabled={product.stock === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </SubdomainLink>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2 bg-card rounded-2xl shadow-lg border border-foreground/10 p-3">
                  {pagination.hasPrev && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-foreground bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-colors duration-300"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 text-sm font-bold rounded-xl transition-colors duration-300 flex items-center justify-center ${
                            pageNum === currentPage
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'text-foreground hover:bg-foreground/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <span className="px-2 text-foreground/50">...</span>
                    )}
                    {pagination.totalPages > 5 && (
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className={`w-10 h-10 text-sm font-bold rounded-xl transition-colors duration-300 flex items-center justify-center ${
                          pagination.totalPages === currentPage
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-foreground hover:bg-foreground/10'
                        }`}
                      >
                        {pagination.totalPages}
                      </button>
                    )}
                  </div>

                  {pagination.hasNext && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-foreground bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-colors duration-300"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="mx-auto w-24 h-24 bg-foreground/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              No products found
            </h3>
            <p className="text-foreground/70 mb-6 max-w-md mx-auto">
              Try adjusting your search or browse all products
            </p>
            <SubdomainLink
              href="/products"
              className="inline-flex items-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Browse all products</span>
            </SubdomainLink>
          </div>
        )}
      </div>
    </div>
  );
}