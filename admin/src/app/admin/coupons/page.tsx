'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../app/utils/apiClient';
interface CouponFormData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minimumOrderAmount: string;
  maximumDiscountAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  active: boolean;
}

export default function CouponsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minimumOrderAmount: '',
    maximumDiscountAmount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    active: true
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    }
    
    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }
    
    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : undefined,
          maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
          active: formData.active
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create coupon');
      }
      
      const data = await response.json();
      setSuccessMessage(data.message || 'Coupon created successfully');
      
      // Reset form
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minimumOrderAmount: '',
        maximumDiscountAmount: '',
        startDate: '',
        endDate: '',
        usageLimit: '',
        active: true
      });
    } catch (err) {
      console.error('Error creating coupon:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Coupon</h1>
          <p className="text-foreground/70">Add a new coupon for customers</p>
        </div>
        <button 
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-card border border-foreground/20 rounded-lg hover:bg-muted transition-all duration-200 text-foreground transform hover:scale-105 shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500 animate-shake">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive animate-shake">
          {errorMessage}
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Coupon Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-foreground/50 transition-all duration-200 ${
                  errors.code ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                }`}
                placeholder="Enter coupon code"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-destructive">{errors.code}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Discount Type
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground transition-all duration-200"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {formData.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-foreground/50 transition-all duration-200 ${
                  errors.discountValue ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                }`}
                placeholder={formData.discountType === 'percentage' ? '0' : '0.00'}
              />
              {errors.discountValue && (
                <p className="mt-1 text-sm text-destructive">{errors.discountValue}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Minimum Order Amount ($)
              </label>
              <input
                type="number"
                name="minimumOrderAmount"
                value={formData.minimumOrderAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground placeholder-foreground/50 transition-all duration-200"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Maximum Discount Amount ($)
              </label>
              <input
                type="number"
                name="maximumDiscountAmount"
                value={formData.maximumDiscountAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground placeholder-foreground/50 transition-all duration-200"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground placeholder-foreground/50 transition-all duration-200"
                placeholder="Unlimited"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition-all duration-200 ${
                  errors.endDate ? 'border-destructive focus:border-destructive' : 'border-foreground/20 focus:border-primary'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="rounded border-2 border-foreground/20 text-primary focus:ring-primary focus:ring-2 bg-background"
              />
              <span className="ml-2 text-sm font-medium text-foreground">
                Active
              </span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-6 py-3 border-2 border-foreground/20 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 transform shadow-lg ${
                isSubmitting
                  ? 'bg-foreground/50 text-foreground/70 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current inline-block mr-2"></div>
                  Creating Coupon...
                </>
              ) : (
                'Create Coupon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}