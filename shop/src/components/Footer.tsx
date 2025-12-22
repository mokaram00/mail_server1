'use client';

import Link from 'next/link';
import {
  FaLinkedinIn,
  FaTwitter,
  FaGithub,
  FaDribbble,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaCreditCard,
  FaUniversity,
  FaMobileAlt,
} from 'react-icons/fa';

export default function Footer() {

  const contactItems = [
    { icon: FaEnvelope, label: 'Email', value: 'info@bltnmstore.com' },
  ];

  const paymentMethods = [
    { name: 'card', icon: FaCreditCard },
    { name: 'bank', icon: FaUniversity },
  ];

  return (
    <footer className="relative bg-black text-white border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Company Info */}
          <div className="md:col-span-1 animate-fadeInSlideUp delay-100">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse mb-3">
              <div className="relative">
                {/* Minimalist Logo in Footer */}
                <div className="relative w-8 h-8">
                  <div className="w-8 h-8 bg-white rounded-lg shadow transform transition-all duration-300 hover:scale-105 interactive-element"></div>
                  <div className="absolute inset-2 flex items-center justify-center">
                    <span className="text-sm font-bold text-black">B</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white transition-all duration-300 hover:text-gray-300 interactive-element">
                  Bltnm Store
                </h3>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-3 max-w-xs text-xs animate-fadeIn delay-150">
              Your trusted partner digital products.
            </p>
          </div>

          {/* Quick Links */}
          <div className="animate-fadeInSlideUp delay-150">
            <h4 className="text-sm font-semibold mb-3 text-white border-b border-white/10 pb-1">Quick Links</h4>
            <ul className="space-y-1.5">
              {[
                { name: 'Products', href: '/products' },
                { name: 'About Us', href: '/about' },
                { name: 'Contact', href: '/contact' },
              ].map((link, index) => (
                <li key={link.name} className="animate-fadeInSlideRight" style={{ animationDelay: `${100 + index * 50}ms` }}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-0.5 inline-block text-xs interactive-element">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="animate-fadeInSlideUp delay-200">
            <h4 className="text-sm font-semibold mb-3 text-white border-b border-white/10 pb-1">Contact</h4>
            <div className="space-y-2.5">
              {contactItems.map(({ icon: Icon, label, value }, index) => (
                <div key={label} className="flex items-center space-x-2.5 rtl:space-x-reverse animate-fadeInSlideLeft" style={{ animationDelay: `${150 + index * 50}ms` }}>
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center transform transition-all duration-300 hover:scale-110 interactive-element">
                    <Icon className="w-2.5 h-2.5 text-black" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className="font-medium text-white text-xs">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-6 pt-4 border-t border-white/10 animate-fadeIn delay-300">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-xs">
               &copy; {new Date().getFullYear()} Bltnm Store. All rights reserved.
            </p>

            {/* Payment methods */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse mt-3 md:mt-0">
              <span className="text-gray-400 text-xs">Secure Payments</span>
              {paymentMethods.map(({ name, icon: Icon }, index) => (
                <div key={name} className="w-5 h-4 bg-white rounded border border-white/10 flex items-center justify-center shadow-sm transform transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 interactive-element">
                  <Icon className="w-2 h-2 text-black" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}