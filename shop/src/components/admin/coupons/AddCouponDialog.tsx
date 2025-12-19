'use client';

import { useState } from 'react';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
    endDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface AddCouponDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoupon: (event: React.FormEvent, couponData: FormData) => Promise<void>; 
  setErrorMessage: (message: string) => void;
  setSuccessMessage: (message: string) => void;
}

export default function AddCouponDialog({ isOpen, onClose, onAddCoupon, setErrorMessage, setSuccessMessage }: AddCouponDialogProps) {
  const [couponForm, setCouponForm] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    startDate: string;
    endDate: string;
    usageLimit: string;
    isActive: boolean;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Clear previous errors
    setErrors({});

    // Client-side validation
    const newErrors: {[key: string]: string} = {};

    if (!couponForm.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (couponForm.code.trim().length < 3) {
      newErrors.codeLength = 'Coupon code must be at least 3 characters';
    }

    if (!couponForm.discountValue || parseFloat(couponForm.discountValue) <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (couponForm.discountType === 'percentage' && parseFloat(couponForm.discountValue) > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }

    if (!couponForm.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!couponForm.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!couponForm.usageLimit || parseInt(couponForm.usageLimit) <= 0) {
      newErrors.usageLimit = 'Usage limit must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('You must log in first');
      return;
    }

    setIsCreatingCoupon(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setErrorMessage('Unauthorized access');
        return;
      }

      const data = await response.json();
      if (data.user.role !== 'admin') {
        setErrorMessage('Unauthorized access');
        return;
      }

      console.log('Form submission - couponForm state:', couponForm); // Debug log
      console.log('startDate value:', couponForm.startDate); // Debug log
      console.log('endDate value:', couponForm.endDate); // Debug log

      const couponData = new FormData();
      couponData.append('code', couponForm.code);
      couponData.append('discountType', couponForm.discountType);
      couponData.append('discountValue', couponForm.discountValue);
      couponData.append('startDate', couponForm.startDate);
      couponData.append('endDate', couponForm.endDate);
      couponData.append('usageLimit', couponForm.usageLimit || '0');
      couponData.append('isActive', couponForm.isActive ? 'on' : 'off');

      console.log('FormData contents:'); // Debug log
      Array.from(couponData.entries()).forEach(([key, value]) => {
        console.log(key, value);
      });

      await onAddCoupon(event, couponData);
    } catch (error: any) {
      console.error('Error sending data:', error);
      
      // Handle validation errors from server
      if (error.message?.includes('validation failed') || error.name === 'ValidationError') {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.errors) {
            const serverErrors: {[key: string]: string} = {};
            Object.keys(errorData.errors).forEach(field => {
              serverErrors[field] = errorData.errors[field].message || `Error in ${field}`;
            });
            setErrors(serverErrors);
            return;
          }
        } catch (parseError) {
          // If we can't parse the error, show a general message
        }
      }
      
      alert(error.message);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleClose = () => {
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
    endDate: '',
      usageLimit: '',
      isActive: true
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Add New Coupon</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Coupon Code
              </label>
              <input
                type="text"
                value={couponForm.code}
                onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                  errors.code ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="Enter coupon code"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Discount Type
              </label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 transition-all duration-300 ${
                  errors.discountType ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount Discount</option>
              </select>
              {errors.discountType && (
                <p className="mt-1 text-sm text-red-600">{errors.discountType}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Discount Value
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                    errors.discountValue ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                  }`}
                  placeholder={couponForm.discountType === 'percentage' ? '10' : '50.00'}
                />
                <span className="absolute right-4 top-3 text-gray-500">
                  {couponForm.discountType === 'percentage' ? '%' : '$'}
                </span>
              </div>
              {errors.discountValue && (
                <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={couponForm.startDate}
                onChange={(e) => setCouponForm(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 transition-all duration-300 ${
                  errors.startDate ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={couponForm.endDate}
                onChange={(e) => setCouponForm(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 transition-all duration-300 ${
                  errors.endDate ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                value={couponForm.usageLimit}
                onChange={(e) => setCouponForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                  errors.usageLimit ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="Enter usage limit"
              />
              {errors.usageLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.usageLimit}</p>
              )}
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-2 border-gray-300 text-black focus:ring-black focus:ring-2"
                />
                <span className="mr-2 text-sm font-medium text-gray-900">
                  Active Coupon
                </span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingCoupon}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform shadow-lg ${
                isCreatingCoupon
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black hover:scale-105'
              }`}
            >
              {isCreatingCoupon ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block ml-2"></div>
                  Adding Coupon...
                </>
              ) : (
                'Add Coupon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}