'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
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
  const { t } = useLanguage();
  const socialLinks = [
    { name: 'LinkedIn', icon: FaLinkedinIn, color: 'from-blue-600 to-blue-800' },
    { name: 'Twitter', icon: FaTwitter, color: 'from-slate-600 to-slate-800' },
    { name: 'GitHub', icon: FaGithub, color: 'from-gray-700 to-black' },
    { name: 'Dribbble', icon: FaDribbble, color: 'from-pink-600 to-purple-600' },
  ];

  const contactItems = [
    { icon: FaMapMarkerAlt, label: t('footer.location'), value: t('footer.locationValue') },
    { icon: FaEnvelope, label: t('footer.email'), value: t('footer.emailValue') },
    { icon: FaPhoneAlt, label: t('footer.phone'), value: t('footer.phoneValue') },
  ];

  const paymentMethods = [
    { name: 'card', icon: FaCreditCard },
    { name: 'bank', icon: FaUniversity },
    { name: 'mobile', icon: FaMobileAlt },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden border-t border-gray-700">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      {/* Elegant floating elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-white/10 rounded-full animate-pulse opacity-15"></div>
      <div className="absolute bottom-20 right-16 w-16 h-16 border border-white/10 rounded-full animate-pulse opacity-10" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-10 w-12 h-12 border border-white/10 rounded-full animate-pulse opacity-8" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse mb-4">
              <div className="relative">
                {/* 3D Logo in Footer */}
                <div className="relative w-10 h-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-200 to-gray-300 rounded-xl shadow-md transform rotate-12"></div>
                  <div className="absolute inset-1 w-8 h-8 bg-gradient-to-br from-gray-100 to-white rounded-lg shadow-inner"></div>
                  <div className="absolute inset-0 w-10 h-10 flex items-center justify-center">
                    <span className="text-base font-bold bg-gradient-to-br from-gray-700 via-black to-gray-800 bg-clip-text text-transparent transform -rotate-12">
                      R
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                  {t('footer.companyName')}
                </h3>
                <p className="text-[11px] text-gray-400">{t('footer.companyDesc')}</p>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-4 max-w-lg text-xs">
              {t('footer.companyLongDesc')}
            </p>

            {/* Social Media Icons */}
            <div className="flex space-x-2.5 rtl:space-x-reverse">
              {socialLinks.map(({ name, icon: Icon, color }) => (
                <div key={name} className="relative group">
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg shadow-lg transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center`}
                    aria-label={name}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-lg shadow-lg transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 opacity-35`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white border-b border-white/10 pb-2">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {[
                { name: 'المنتجات', href: '/products' },
                { name: 'عن الشركة', href: '/about' },
                { name: 'تواصل معنا', href: '/contact' },
                { name: 'الدعم', href: '/support' },
                { name: 'المدونة', href: '/blog' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block text-[11px]">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white border-b border-white/10 pb-2">{t('footer.contact')}</h4>
            <div className="space-y-3.5">
              {contactItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center space-x-2.5 rtl:space-x-reverse">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                    <Icon className="w-3 h-3" />
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
        <div className="mt-8 pt-5 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-[11px]">
              {t('footer.copyright')}
            </p>

            {/* Payment methods */}
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse mt-4 md:mt-0">
              <span className="text-gray-400 text-[11px]">{t('footer.payment')}</span>
              {paymentMethods.map(({ name, icon: Icon }) => (
                <div key={name} className="w-6 h-4.5 bg-gradient-to-br from-gray-700 to-gray-800 rounded border border-white/10 flex items-center justify-center shadow-sm">
                  <Icon className="w-2 h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </footer>
  );
}
