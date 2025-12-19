'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';

export default function RegisterPage() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // التحقق من تطابق كلمات المرور
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          language: language, // إرسال اللغة المختارة
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // حفظ توكنات Supabase في localStorage
        if (data.token) {
          localStorage.setItem('access_token', data.token);
        }
        localStorage.setItem('user', JSON.stringify(data.user));

        // توجيه إلى الصفحة الرئيسية
        router.push('/');
      } else {
        // عرض رسالة الخطأ باللغة المناسبة
        const errorMessage = data.error || t('auth.errors.serverError');
        const errorDetails = data.details || '';

        setError(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }
    } catch (error) {
      setError(t('auth.errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const currentParent = prev[parent as keyof typeof prev];
        if (currentParent && typeof currentParent === 'object' && !Array.isArray(currentParent)) {
          return {
            ...prev,
            [parent]: {
              ...currentParent,
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-black to-gray-800 rounded-2xl shadow-2xl flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-white">R</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
            {t('auth.register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.register.subtitle')}{' '}
            <Link href="/login" className="font-medium text-black hover:text-gray-800 transition-colors">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.fullName')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                placeholder={t('auth.register.fullNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                placeholder={t('auth.register.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                placeholder={t('auth.register.phonePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.register.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                  placeholder={t('auth.register.passwordPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.register.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.address')}
              </label>
              <input
                id="address.street"
                name="address.street"
                type="text"
                value={formData.address.street}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                placeholder={t('auth.register.streetPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  id="address.city"
                  name="address.city"
                  type="text"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                  placeholder={t('auth.register.cityPlaceholder')}
                />
              </div>

              <div>
                <input
                  id="address.state"
                  name="address.state"
                  type="text"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-2xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                  placeholder={t('auth.register.statePlaceholder')}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-2xl text-white bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  {t('auth.register.creatingAccount')}
                </div>
              ) : (
                t('auth.register.createAccount')
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              {t('auth.register.terms')}{' '}
              <a href="#" className="font-medium text-black hover:text-gray-800 transition-colors">
                {t('auth.register.termsOfService')}
              </a>{' '}
              {t('common.and')}{' '}
              <a href="#" className="font-medium text-black hover:text-gray-800 transition-colors">
                {t('auth.register.privacyPolicy')}
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
