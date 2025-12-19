'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/language-context';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category?: { _id: string; name: string };
  stock: number;
  featured: boolean;
  images: string[];
  createdAt: string;
}

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmDelete: () => void;
}

export default function DeleteProductDialog({ isOpen, onClose, product, onConfirmDelete }: DeleteProductDialogProps) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 via-red-50 to-red-100 rounded-t-3xl">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-red-900 text-center mt-3">
            {t('common.confirm')}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info Card */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border-2 border-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {product.name}
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center">
                    <span className="font-medium text-gray-700 ml-2">💰</span>
                    {t('admin.price')}: {product.price} $
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium text-gray-700 ml-2">📦</span>
                    {t('admin.stock')}: {product.stock}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5 ml-3 flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  {t('common.warning')}
                </p>
                <p className="text-sm text-yellow-700">
                  {t('admin.deleteProductWarning')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 rtl:space-x-reverse">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className={`px-6 py-3 border-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
                isDeleting
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transform hover:scale-105'
              }`}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform shadow-lg flex items-center ${
                isDeleting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:scale-105'
              }`}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block ml-2"></div>
                  {t('admin.deletingProduct')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('common.delete')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
