'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaShoppingCart, FaWrench, FaCheckCircle } from 'react-icons/fa';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  // Remove the authentication requirement - users can now access cart without logging in
  // But we'll prompt for authentication during checkout

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <FaShoppingCart className="text-gray-400 text-8xl mb-6" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Looks like you haven't added any items to your cart yet
          </p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
            Shopping Cart ({state.itemCount} {state.itemCount === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={clearCart}
            className="bg-red-5 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-300 text-xs font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Products</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {state.items.map((item) => (
                  <div key={item._id} className="p-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0">
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
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaWrench className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          ${item.price} USD
                        </p>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="text-xs text-gray-500">Quantity:</span>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                            >
                              <span className="text-sm font-bold">−</span>
                            </button>
                            <span className="w-10 text-center text-base font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                            >
                              <span className="text-sm font-bold">+</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="text-right">
                        <p className="text-lg font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent mb-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors duration-200"
                        >
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${state.total.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">
                      ${state.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Methods</h3>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;

                    return (
                      <div
                        key={method.id}
                        className="flex items-center p-3 rounded-lg border-2 border-gray-200 bg-gray-50"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-xs">
                                {method.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
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
                disabled={isCheckingOut}
                className="w-full bg-gradient-to-r from-black to-gray-800 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:bg-gray-400 disabled:transform-none"
              >
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-gray-600 hover:text-black text-xs font-medium transition-colors duration-200"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <FaShoppingCart className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Complete Your Purchase
                </h3>
                <p className="text-gray-600 text-sm">
                  Please log in or register to complete your purchase
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  href="/login"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowAuthModal(false)}
                >
                  Log in
                </Link>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-500">OR</span>
                  </div>
                </div>

                <Link
                  href="/register"
                  className="block w-full bg-gradient-to-r from-black to-gray-800 text-white text-center px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowAuthModal(false)}
                >
                  Register New Account
                </Link>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2 transition-colors duration-200"
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