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
  const socialLinks = [
    { name: 'LinkedIn', icon: FaLinkedinIn },
    { name: 'Twitter', icon: FaTwitter },
    { name: 'GitHub', icon: FaGithub },
    { name: 'Dribbble', icon: FaDribbble },
  ];

  const contactItems = [
    { icon: FaMapMarkerAlt, label: 'Location', value: '123 Design Street, Creative City' },
    { icon: FaEnvelope, label: 'Email', value: 'info@bltnmstore.com' },
    { icon: FaPhoneAlt, label: 'Phone', value: '+1 (555) 123-4567' },
  ];

  const paymentMethods = [
    { name: 'card', icon: FaCreditCard },
    { name: 'bank', icon: FaUniversity },
    { name: 'mobile', icon: FaMobileAlt },
  ];

  return (
    <footer className="relative bg-black text-white border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Company Info */}
          <div className="md:col-span-2 animate-fadeInSlideUp delay-100">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse mb-4">
              <div className="relative">
                {/* Minimalist Logo in Footer */}
                <div className="relative w-10 h-10">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-md transform transition-all duration-500 hover:scale-110 interactive-element"></div>
                  <div className="absolute inset-2 flex items-center justify-center">
                    <span className="text-base font-bold text-black">B</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white transition-all duration-300 hover:text-gray-300 interactive-element">
                  Bltnm Store
                </h3>
                <p className="text-[11px] text-gray-400">Premium Tools & Accessories</p>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-4 max-w-lg text-xs animate-fadeIn delay-150">
              Your trusted partner for premium tools and accessories. We strive to deliver the highest quality products and exceptional customer service.
            </p>

            {/* Social Media Icons */}
            <div className="flex space-x-2.5 rtl:space-x-reverse animate-fadeIn delay-200">
              {socialLinks.map(({ name, icon: Icon }, index) => (
                <div key={name} className="relative group interactive-element">
                  <div
                    className="w-8 h-8 bg-white rounded-lg shadow-lg transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                    aria-label={name}
                  >
                    <Icon className="w-3.5 h-3.5 text-black transition-all duration-300 transform group-hover:rotate-12" />
                  </div>
                  <div className="absolute inset-0 bg-white rounded-lg shadow-lg transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 opacity-35"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fadeInSlideUp delay-150">
            <h4 className="text-sm font-semibold mb-4 text-white border-b border-white/10 pb-2">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: 'Products', href: '/products' },
                { name: 'About Us', href: '/about' },
                { name: 'Contact Us', href: '/contact' },
                { name: 'Support', href: '/support' },
                { name: 'Blog', href: '/blog' },
              ].map((link, index) => (
                <li key={link.name} className="animate-fadeInSlideRight" style={{ animationDelay: `${100 + index * 50}ms` }}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-0.5 inline-block text-[11px] interactive-element">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="animate-fadeInSlideUp delay-200">
            <h4 className="text-sm font-semibold mb-4 text-white border-b border-white/10 pb-2">Contact</h4>
            <div className="space-y-3.5">
              {contactItems.map(({ icon: Icon, label, value }, index) => (
                <div key={label} className="flex items-center space-x-2.5 rtl:space-x-reverse animate-fadeInSlideLeft" style={{ animationDelay: `${150 + index * 50}ms` }}>
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center transform transition-all duration-300 hover:scale-110 interactive-element">
                    <Icon className="w-3 h-3 text-black" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px]">{label}</p>
                    <p className="font-medium text-white text-[11px]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-5 border-t border-white/10 animate-fadeIn delay-300">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-[11px]">
              © 2023 Bltnm Store. All rights reserved.
            </p>

            {/* Payment methods */}
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse mt-4 md:mt-0">
              <span className="text-gray-400 text-[11px]">Secure Payments</span>
              {paymentMethods.map(({ name, icon: Icon }, index) => (
                <div key={name} className="w-6 h-4.5 bg-white rounded border border-white/10 flex items-center justify-center shadow-sm transform transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 interactive-element">
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