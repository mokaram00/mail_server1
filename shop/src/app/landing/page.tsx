'use client';

import Link from 'next/link';
import {
  FaShoppingBag,
  FaPhone,
  FaBolt,
  FaPaintBrush,
  FaTruck,
  FaShoppingCart,
  FaComments,
} from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Floating elements for parallax effect */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-white/5 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-36 lg:py-44">
          <div className="text-center">
            {/* Main heading */}
            <div className="relative mb-10 animate-fadeInSlideDown">
              <h1 className="text-7xl md:text-9xl font-bold text-white mb-6 leading-tight transform transition-all duration-700 hover:scale-105">
                Bltnm Store
              </h1>
              <div className="absolute inset-0 text-7xl md:text-9xl font-bold text-white/10 transform translate-x-1.5 translate-y-1.5 animate-pulseGlow">
                Bltnm Store
              </div>
            </div>

            <p className="text-2xl md:text-3xl text-gray-300 mb-14 max-w-4xl mx-auto leading-relaxed font-light animate-fadeInSlideUp delay-150">
              Your premier destination for premium tools and accessories
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center animate-fadeInSlideUp delay-300">
              <Link
                href="/products"
                className="btn-ripple btn-hover-scale group relative bg-white text-black px-10 py-5 rounded-full text-xl font-semibold shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300 border border-white"
              >
                <span className="flex items-center gap-3">
                  <FaShoppingBag className="w-6 h-6 transform group-hover:rotate-12 transition-all duration-300" />
                  Browse Products
                </span>
              </Link>

              <Link
                href="/contact"
                className="btn-ripple btn-hover-scale group relative bg-transparent border-2 border-white text-white px-10 py-5 rounded-full text-xl font-semibold shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
              >
                <span className="flex items-center gap-3">
                  <FaPhone className="w-6 h-6 transform group-hover:rotate-12 transition-all duration-300" />
                  Get in Touch
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeIn">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 animate-fadeInSlideDown">
              Why Choose Us
            </h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto font-light animate-fadeInSlideUp delay-100">
              We offer premium quality products with exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="group relative bg-black p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/10 animate-fadeInSlideUp delay-150 card-smooth">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto transform group-hover:scale-110 transition-all duration-300 interactive-element">
                  <div className="w-10 h-10 text-black">
                    <FaBolt className="w-8 h-8 transform group-hover:rotate-12 transition-all duration-300" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-6 text-center group-hover:text-gray-300 transition-all duration-300">Premium Quality</h3>
              <p className="text-gray-300 text-center text-lg leading-relaxed">
                Our products are crafted with attention to detail and built to last, ensuring you get the best value for your investment.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-black p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/10 animate-fadeInSlideUp delay-200 card-smooth">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto transform group-hover:scale-110 transition-all duration-300 interactive-element">
                  <div className="w-10 h-10 text-black">
                    <FaPaintBrush className="w-8 h-8 transform group-hover:rotate-12 transition-all duration-300" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-6 text-center group-hover:text-gray-300 transition-all duration-300">Creative Design</h3>
              <p className="text-gray-300 text-center text-lg leading-relaxed">
                Each product is designed with creativity and innovation, adding style and functionality to your everyday life.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-black p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/10 animate-fadeInSlideUp delay-250 card-smooth">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto transform group-hover:scale-110 transition-all duration-300 interactive-element">
                  <div className="w-10 h-10 text-black">
                    <FaTruck className="w-8 h-8 transform group-hover:rotate-12 transition-all duration-300" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-6 text-center group-hover:text-gray-300 transition-all duration-300">Fast Delivery</h3>
              <p className="text-gray-300 text-center text-lg leading-relaxed">
                We ensure fast and reliable delivery to your doorstep, with tracking and insurance for your peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-black text-white overflow-hidden border-t border-white/10">
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-12 h-12 bg-white/5 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-6xl font-bold mb-10 text-white animate-fadeInSlideDown">
            Ready to Shop?
          </h2>
          <p className="text-2xl text-gray-300 mb-16 leading-relaxed max-w-3xl mx-auto animate-fadeInSlideUp delay-100">
            Join thousands of satisfied customers who have transformed their spaces with our premium products.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center animate-fadeInSlideUp delay-200">
            <Link
              href="/products"
              className="btn-ripple btn-hover-scale group relative bg-white text-black px-10 py-5 rounded-full text-xl font-semibold shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                <FaShoppingCart className="w-6 h-6 transform group-hover:rotate-12 transition-all duration-300" />
                Shop Now
              </span>
            </Link>

            <Link
              href="/contact"
              className="btn-ripple btn-hover-scale group relative bg-transparent border-2 border-white text-white px-10 py-5 rounded-full text-xl font-semibold shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                <FaComments className="w-6 h-6 transform group-hover:rotate-12 transition-all duration-300" />
                Contact Us
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}