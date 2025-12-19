'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { FaShoppingCart, FaWrench, FaUniversity, FaCheckCircle } from 'react-icons/fa';

export default function CartPage() {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const selectedPaymentMethod = 'polar';
  const paymentMethods = [
    {
      id: 'polar',
      name: 'Polar Checkout',
      nameEn: 'Polar Checkout',
      icon: FaCheckCircle,
      color: 'from-green-600 to-green-700',
      description: 'Secure payment via Polar'
    }
  ];

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const authHeader = localStorage.getItem('access_token') ? `Bearer ${localStorage.getItem('access_token')}` : null;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
        body: JSON.stringify({
          items: state.items,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // Show user feedback before opening Polar Checkout
        alert('Opening Polar Checkout in a popup window...');
        // Open Polar Checkout in popup window
        const popup = window.open(
          url,
          'polar',
          'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=yes,menubar=yes'
        );

        // Check if popup was blocked
        if (!popup) {
          alert('Popup window was blocked. Please allow popups for this site.');
          // Fallback to new tab
          window.open(url, '_blank');
        }
      } else {
        alert('Error creating checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Server error occurred');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Require authentication to access cart
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <FaShoppingCart className="text-gray-400 text-8xl mb-6" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent mb-4">
            Please log in
          </h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            You need to be logged in to access your cart and shop
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
            >
              Log in
            </Link>
            <div>
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
              >
                Don't have an account? Register now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-300 text-xs font-medium"
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
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
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
                        className="flex items-center p-3 rounded-lg border-2 border-black bg-gray-50 shadow-lg"
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
                            <FaCheckCircle className="w-4 h-4 text-green-600" />
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
                {isCheckingOut ? 'Processing...' : 'Pay with Polar'}
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
    </div>
  );
}