'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaShoppingCart, FaWrench, FaCheckCircle, FaTrash } from 'react-icons/fa';
import SubdomainLink from '@/components/SubdomainLink';
import apiClient from '@/lib/apiClient';

export default function CartPage() {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('btc'); // Default to BTC
  
  // Changed to use Polar by default
  const selectedPaymentMethod = 'polar';
  
  const paymentMethods = [
    {
      id: 'polar',
      name: 'Polar Payment',
      nameEn: 'Polar Payment',
      icon: FaCheckCircle,
      color: 'from-blue-600 to-blue-700',
      description: 'Pay with credit card or other methods via Polar'
    }
  ];

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsProfileLoading(true);
        const response = await apiClient.getProfile();
        if (response.user) {
          setIsAuth(true);
          setUser(response.user);
        } else {
          setIsAuth(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuth(false);
        setUser(null);
      } finally {
        setIsProfileLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch available currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        console.log('Fetching available currencies...');
        const response = await apiClient.getAvailableCurrencies();
        console.log('Currencies response:', response);
        if (response && response.currencies) {
          // Check if currencies is an array or object
          let currenciesArray = [];
          if (Array.isArray(response.currencies)) {
            currenciesArray = response.currencies;
          } else if (typeof response.currencies === 'object') {
            // If it's an object, check if it has a 'currencies' property or convert values
            if (response.currencies.currencies && Array.isArray(response.currencies.currencies)) {
              currenciesArray = response.currencies.currencies;
            } else {
              // Convert object values to array
              currenciesArray = Object.values(response.currencies).filter(currency => 
                currency && typeof currency === 'object'
              );
            }
          }
          
          // Filter out invalid currencies
          const validCurrencies = currenciesArray.filter((currency: any) => 
            currency && currency.code && typeof currency.code === 'string'
          );
          
          console.log('Setting available currencies:', validCurrencies);
          setAvailableCurrencies(validCurrencies);
        } else {
          console.log('No currencies in response, using defaults');
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    fetchCurrencies();
  }, []);

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    // If user is not authenticated, show auth modal
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      // Call the correct endpoint - /api/checkout/ not /api/checkout/create-checkout-session
      const response = await apiClient.createCheckoutSession({ 
        items: state.items, 
        paymentMethod: selectedPaymentMethod, // Changed to polar
        email: user.email,
        payCurrency: selectedCurrency // Pass selected currency
      });

      if (response && response.checkoutUrl) {
        // Redirect to Polar checkout page
        window.location.href = response.checkoutUrl;
      } else if (response && response.error) {
        // Handle API errors
        alert(`Checkout failed: ${response.message || response.error.message || 'Unknown error'}`);
      } else if (response && response.message) {
        // For now, we'll just show a success message
        alert('Checkout created successfully!');
      } else {
        // Handle unexpected response
        alert('Unexpected response from checkout service');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Failed to create checkout: ${error.message || 'Please try again.'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Show loading while checking authentication
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading cart...</p>
        </div>
      </div>
    );
  }

  // Remove the authentication requirement - users can now access cart without logging in
  // But we'll prompt for authentication during checkout

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 mb-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <FaShoppingCart className="text-foreground/20 text-8xl mx-auto mb-6" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
                Your cart is empty
              </h1>
              <p className="text-foreground/70 text-lg mb-8 leading-relaxed">
                Looks like you haven't added any items to your cart yet
              </p>
              <SubdomainLink
                href="/"
                className="inline-block bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Continue Shopping
              </SubdomainLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                Shopping Cart
              </h1>
              <p className="text-foreground/70">
                {state.itemCount} {state.itemCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <button
              onClick={clearCart}
              className="flex items-center mt-4 md:mt-0 bg-card border border-foreground/10 hover:bg-foreground/5 text-foreground px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium"
            >
              <FaTrash className="mr-2" />
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products List */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 overflow-hidden">
              <div className="p-6 border-b border-foreground/10">
                <h2 className="text-xl font-bold text-foreground">Products</h2>
              </div>
              <div className="divide-y divide-foreground/10">
                {state.items.map((item) => (
                  <div key={item._id} className="p-6 hover:bg-foreground/5 transition-colors duration-200">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${item.image}`}
                            alt={item.name}
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
                          <div className="w-full h-full flex items-center justify-center text-foreground/30">
                            <FaWrench className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">
                          {item.name}
                        </h3>
                        <p className="text-foreground/70 mb-3">
                          ${item.price} USD
                        </p>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <span className="text-sm text-foreground/50">Quantity:</span>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 bg-foreground/10 hover:bg-foreground/20 rounded-lg flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-lg font-bold">−</span>
                            </button>
                            <span className="w-12 text-center text-lg font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="w-8 h-8 bg-foreground/10 hover:bg-foreground/20 rounded-lg flex items-center justify-center transition-colors duration-200"
                            >
                              <span className="text-lg font-bold">+</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="flex items-center text-red-500 hover:text-red-400 text-sm font-medium transition-colors duration-200"
                        >
                          <FaTrash className="mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-6 sticky top-28">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
              
              {/* Currency Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Payment Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-background border border-foreground/20 rounded-xl px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {availableCurrencies.length > 0 ? (
                    availableCurrencies.map((currency: any) => {
                      // Handle both string format and object format
                      let currencyCode, currencyName;
                      
                      if (typeof currency === 'string') {
                        // String format: "eth", "btc", etc.
                        currencyCode = currency;
                        currencyName = currency.toUpperCase();
                      } else if (currency && typeof currency === 'object') {
                        // Object format: {code: "eth", name: "Ethereum"}
                        currencyCode = currency.code;
                        currencyName = currency.name || currency.code;
                      } else {
                        // Invalid currency format
                        return null;
                      }
                      
                      // Safety check
                      if (!currencyCode) {
                        return null;
                      }
                      
                      return (
                        <option key={currencyCode} value={currencyCode}>
                          {currencyName} ({currencyCode.toUpperCase()})
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="btc">Bitcoin (BTC)</option>
                      <option value="eth">Ethereum (ETH)</option>
                      <option value="ltc">Litecoin (LTC)</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {state.items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-foreground/70">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Divider */}
              <div className="border-t border-foreground/10 my-4"></div>
              
              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Subtotal</span>
                  <span className="font-medium">${state.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    ${state.total.toFixed(2)} USD
                  </span>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-3">Payment Method</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div 
                        key={method.id}
                        className={`border-2 border-foreground/20 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                          selectedPaymentMethod === method.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-foreground/30'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${method.color} flex items-center justify-center mr-3`}>
                            <IconComponent className="text-white text-lg" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{method.name}</div>
                            <div className="text-sm text-foreground/70">{method.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || state.items.length === 0}
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Proceed to Checkout`
                )}
              </button>
              
              <div className="mt-4 text-center text-sm text-foreground/50">
                By placing your order, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-2xl border border-foreground/10 max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h3>
              <p className="text-foreground/70">
                Please sign in to complete your purchase
              </p>
            </div>
            
            <SubdomainLink 
              href="/auth/login" 
              className="block w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center px-6 py-3 rounded-2xl font-semibold shadow-lg hover:from-primary/90 hover:to-primary transition-all duration-300"
            >
              Sign In
            </SubdomainLink>
          </div>
        </div>
      )}
    </div>
  );
}
