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
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden">
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(0,0,0,0.05) 0%, transparent 50%), 
                             radial-gradient(circle at 70% 70%, rgba(0,0,0,0.03) 0%, transparent 50%)`
          }}></div>
        </div>

        {/* Enhanced floating elements */}
        <div className="absolute top-24 left-12 w-36 h-36 border border-gray-300 rounded-full animate-pulse opacity-15"></div>
        <div className="absolute top-36 right-24 w-28 h-28 border border-gray-300 rounded-full animate-pulse opacity-12" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-24 left-1/3 w-24 h-24 border border-gray-300 rounded-full animate-pulse opacity-8" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-36 lg:py-44">
          <div className="text-center">
            {/* Enhanced Main heading */}
            <div className="relative mb-10">
              <h1 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-foreground via-black to-foreground bg-clip-text text-transparent mb-6 leading-tight drop-shadow-sm">
                
              </h1>
              <h1 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent leading-tight drop-shadow-lg">
                Bltnm Shop
              </h1>

              {/* Enhanced shadow effect */}
              <div className="absolute inset-0 text-7xl md:text-9xl font-bold bg-gradient-to-r from-foreground/15 via-black/15 to-foreground/15 bg-clip-text text-transparent transform translate-x-1.5 translate-y-1.5">
                Bltnm Shop
              </div>
            </div>

            <p className="text-2xl md:text-3xl text-muted-foreground mb-14 max-w-4xl mx-auto leading-relaxed font-light">
              Your secure place to buy creative tools and accessories
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <Link
                href="/products"
                className="group relative bg-gradient-to-r from-black to-gray-800 text-foreground px-10 py-5 rounded-full text-xl font-semibold shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300 border border-gray-800"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center gap-3">
                  <FaShoppingBag className="w-6 h-6" />
                  Browse Products
                </span>
              </Link>

              <Link
                href="/contact"
                className="group relative bg-foreground border-2 border-border text-background px-10 py-5 rounded-full text-xl font-semibold shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
              >
                <span className="flex items-center gap-3">
                  <FaPhone className="w-6 h-6" />
                  Get in Touch
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-8">
              Why Choose Us
            </h2>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              We offer premium quality products with exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Enhanced Feature 1 */}
            <div className="group relative bg-gradient-to-br from-card to-background p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-card to-background rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Enhanced Icon */}
              <div className="relative z-10 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center mx-auto">
                  <div className="w-10 h-10 bg-foreground rounded-lg shadow-inner flex items-center justify-center">
                    <FaBolt className="w-8 h-8 text-background" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-foreground mb-6 relative z-10 text-center">Premium Quality</h3>
              <p className="text-muted-foreground relative z-10 text-center text-lg leading-relaxed">
                Our products are crafted with attention to detail and built to last, ensuring you get the best value for your investment.
              </p>
            </div>

            {/* Enhanced Feature 2 */}
            <div className="group relative bg-gradient-to-br from-card to-background p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-card to-background rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Enhanced Icon */}
              <div className="relative z-10 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center mx-auto">
                  <div className="w-10 h-10 bg-foreground rounded-lg shadow-inner flex items-center justify-center">
                    <FaPaintBrush className="w-8 h-8 text-background" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-foreground mb-6 relative z-10 text-center">Creative Design</h3>
              <p className="text-muted-foreground relative z-10 text-center text-lg leading-relaxed">
                Each product is designed with creativity and innovation, adding style and functionality to your everyday life.
              </p>
            </div>

            {/* Enhanced Feature 3 */}
            <div className="group relative bg-gradient-to-br from-card to-background p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-card to-background rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Enhanced Icon */}
              <div className="relative z-10 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center mx-auto">
                  <div className="w-10 h-10 bg-foreground rounded-lg shadow-inner flex items-center justify-center">
                    <FaTruck className="w-8 h-8 text-background" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-foreground mb-6 relative z-10 text-center">Fast Delivery</h3>
              <p className="text-muted-foreground relative z-10 text-center text-lg leading-relaxed">
                We ensure fast and reliable delivery to your doorstep, with tracking and insurance for your peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-32 bg-gradient-to-br from-gray-900 via-black to-gray-800 text-foreground overflow-hidden">
        {/* Enhanced background */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0%, transparent 45%), 
                             radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 45%)`
          }}></div>
        </div>

        {/* Enhanced floating elements */}
        <div className="absolute top-12 left-24 w-24 h-24 border border-foreground/20 rounded-full animate-pulse opacity-25"></div>
        <div className="absolute bottom-24 right-24 w-20 h-20 border border-foreground/20 rounded-full animate-pulse opacity-20" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-6xl font-bold mb-10 bg-gradient-to-r from-foreground to-gray-300 bg-clip-text text-transparent">
            Ready to Shop?
          </h2>
          <p className="text-2xl text-muted-foreground mb-16 leading-relaxed max-w-3xl mx-auto">
            Join thousands of satisfied customers who have transformed their spaces with our premium products.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Link
              href="/products"
              className="group relative bg-gradient-to-r from-foreground to-gray-200 text-background px-10 py-5 rounded-full text-xl font-semibold shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-3">
                <FaShoppingCart className="w-6 h-6" />
                Shop Now
              </span>
            </Link>

            <Link
              href="/contact"
              className="group relative bg-foreground/10 backdrop-blur-sm border-2 border-border/30 text-foreground px-10 py-5 rounded-full text-xl font-semibold shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                <FaComments className="w-6 h-6" />
                Contact Us
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}