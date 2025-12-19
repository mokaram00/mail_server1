'use client';

import Link from 'next/link';
import {
  FaShoppingBag,
  FaPhoneAlt,
  FaBolt,
  FaPalette,
  FaTruck,
  FaShoppingCart,
  FaCommentDots,
} from 'react-icons/fa';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent"></div>
        </div>

        {/* Elegant floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-gray-200 rounded-full animate-pulse opacity-10"></div>
        <div className="absolute top-32 right-20 w-24 h-24 border border-gray-200 rounded-full animate-pulse opacity-8" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 border border-gray-200 rounded-full animate-pulse opacity-6" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="text-center">
            {/* Main heading */}
            <div className="relative mb-8">
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent mb-4 leading-tight">
                
              </h1>
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-black via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                Bltnm Shop
              </h1>

              {/* Subtle shadow effect */}
              <div className="absolute inset-0 text-6xl md:text-8xl font-bold bg-gradient-to-r from-gray-900/10 via-black/10 to-gray-800/10 bg-clip-text text-transparent transform translate-x-1 translate-y-1">
                Bltnm Shop
              </div>
            </div>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your secure place to buy creative tools and accessories
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/products"
                className="group relative bg-gradient-to-r from-black to-gray-800 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300 border border-gray-800"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center gap-2">
                  <FaShoppingBag className="w-5 h-5" />
                  Browse Products
                </span>
              </Link>

              <Link
                href="/contact"
                className="group relative bg-white border-2 border-gray-200 text-gray-800 px-8 py-4 rounded-full text-lg font-semibold shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <FaPhoneAlt className="w-5 h-5" />
                  Get in Touch
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent mb-6">
              Why Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer premium quality products with exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Icon */}
              <div className="relative z-10 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-inner flex items-center justify-center">
                    <FaBolt className="w-6 h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Premium Quality</h3>
              <p className="text-gray-600 relative z-10">
                Our products are crafted with attention to detail and built to last, ensuring you get the best value for your investment.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Icon */}
              <div className="relative z-10 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-inner flex items-center justify-center">
                    <FaPalette className="w-6 h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Creative Design</h3>
              <p className="text-gray-600 relative z-10">
                Each product is designed with creativity and innovation, adding style and functionality to your everyday life.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Icon */}
              <div className="relative z-10 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-inner flex items-center justify-center">
                    <FaTruck className="w-6 h-6 text-gray-900" />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Fast Delivery</h3>
              <p className="text-gray-600 relative z-10">
                We ensure fast and reliable delivery to your doorstep, with tracking and insurance for your peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-10 left-20 w-20 h-20 border border-white/10 rounded-full animate-pulse opacity-20"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 border border-white/10 rounded-full animate-pulse opacity-15" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ready to Shop?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of satisfied customers who have transformed their spaces with our premium products.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/products"
              className="group relative bg-gradient-to-r from-white to-gray-200 text-black px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                <FaShoppingCart className="w-5 h-5" />
                Shop Now
              </span>
            </Link>

            <Link
              href="/contact"
              className="group relative bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <FaCommentDots className="w-5 h-5" />
                Contact Us
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}