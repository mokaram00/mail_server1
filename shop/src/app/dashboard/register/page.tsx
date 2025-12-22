'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.register(
        formData.email,
        formData.fullName,
        formData.password
      );

      if (response.user) {
        // Show success modal
        setShowSuccessModal(true);
        
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        // Display error message
        const errorMessage = response.message || 'Server error occurred';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error) {
      setError('Network error occurred');
      setLoading(false);
    }
  };

  // Handle redirect after showing success modal
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000); // Redirect after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-white to-gray-200 rounded-2xl shadow-2xl flex items-center justify-center mb-6 animate-fadeIn">
            <span className="text-3xl font-bold text-black">R</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent animate-fadeIn">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-foreground/70 animate-fadeIn delay-100">
            Or{' '}
            <a href="https://dashboard.bltnm.store/login" className="font-medium text-white hover:text-gray-300 transition-colors">
              sign in to your account
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded-2xl text-sm animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground/80 mb-2 animate-fadeIn delay-150">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-foreground/20 rounded-2xl placeholder-foreground/50 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 animate-fadeIn delay-150"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-2 animate-fadeIn delay-200">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-foreground/20 rounded-2xl placeholder-foreground/50 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 animate-fadeIn delay-200"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-2 animate-fadeIn delay-250">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-foreground/20 rounded-2xl placeholder-foreground/50 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 animate-fadeIn delay-250"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/80 mb-2 animate-fadeIn delay-300">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-foreground/20 rounded-2xl placeholder-foreground/50 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 animate-fadeIn delay-300"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-2xl text-black bg-gradient-to-r from-white to-gray-200 hover:from-gray-200 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-fadeIn delay-350"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-sm text-center text-foreground/70 animate-fadeIn delay-400">
            <p>
              By creating an account, you agree to our{' '}
              <a href="#" className="font-medium text-white hover:text-gray-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-white hover:text-gray-300 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card rounded-2xl shadow-2xl border border-foreground/10 p-8 max-w-md w-full transform transition-all duration-500 scale-95 animate-fadeInScale">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 animate-pulse">
                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground animate-fadeIn delay-100">Welcome aboard!</h3>
              <p className="mt-2 text-foreground/80 animate-fadeIn delay-200">
                Your account has been created successfully. You're being redirected to the dashboard...
              </p>
              <div className="mt-6 animate-fadeIn delay-300">
                <div className="h-2 bg-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-progress"></div>
                </div>
                <p className="mt-2 text-sm text-foreground/60">Redirecting...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add progress animation styles */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}