'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaShoppingCart, FaWrench, FaCheckCircle,FaTrash } from 'react-icons/fa';
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
  const selectedPaymentMethod = 'sellauth'; // Changed to use SellAuth by default
  const paymentMethods = [
    {
      id: 'sellauth',
      name: 'SellAuth Checkout',
      nameEn: 'SellAuth Checkout',
      icon: FaCheckCircle,
      color: 'from-blue-600 to-blue-700',
      description: 'Secure payment via SellAuth'
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

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    // If user is not authenticated, show auth modal
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await apiClient.createCheckoutSession({ 
        items: state.items, 
        paymentMethod: selectedPaymentMethod,
        email: user.email
      });

      if (response && response.checkoutUrl) {
        // Redirect to SellAuth checkout page
        window.location.href = response.checkoutUrl;
      } else if (response && response.message) {
        // For now, we'll just show a success message
        alert('Checkout created successfully!');
      } else {
        // Handle unexpected response
        alert('Unexpected response from checkout service');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout. Please try again.');
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

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-base">
                  <span className="text-foreground/70">Subtotal:</span>
                  <span className="font-medium">${state.total.toFixed(2)}</span>
                </div>
                <div className="border-t border-foreground/10 pt-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total:</span>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      ${state.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;

                    return (
                      <div
                        key={method.id}
                        className="flex items-center p-4 rounded-2xl border border-foreground/10 bg-foreground/5"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground text-sm">
                                {method.name}
                              </h4>
                              <p className="text-xs text-foreground/50 mt-1">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || state.items.length === 0}
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 rounded-2xl text-base font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isCheckingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-3"></div>
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>

              <div className="mt-6 text-center">
                <SubdomainLink
                  href="/products"
                  className="text-foreground/70 hover:text-foreground text-sm font-medium transition-colors duration-200"
                >
                  Continue Shopping
                </SubdomainLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-2xl border border-foreground/10 max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto bg-gradient-to-br from-primary/20 to-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <FaShoppingCart className="text-primary text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Complete Your Purchase
                </h3>
                <p className="text-foreground/70 text-base">
                  Please log in or register to complete your purchase
                </p>
              </div>

              <div className="space-y-5">
                <SubdomainLink
                  href="/login"
                  className="block w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center px-6 py-4 rounded-2xl text-base font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
                  onClick={() => setShowAuthModal(false)}
                >
                  Log in
                </SubdomainLink>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-foreground/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-foreground/50">OR</span>
                  </div>
                </div>

                <SubdomainLink
                  href="/register"
                  className="block w-full bg-gradient-to-r from-foreground to-foreground/80 text-foreground-contrast text-center px-6 py-4 rounded-2xl text-base font-bold shadow-lg hover:from-foreground/90 hover:to-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
                  onClick={() => setShowAuthModal(false)}
                >
                  Register New Account
                </SubdomainLink>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full text-foreground/70 hover:text-foreground text-base font-medium py-3 transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}