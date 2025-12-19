'use client';

import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to add a toast
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  // Function to remove a toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Make addToast globally accessible
  useEffect(() => {
    (window as any).addToast = addToast;
    
    return () => {
      delete (window as any).addToast;
    };
  }, []);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500 text-green-500';
      case 'error':
        return 'bg-red-500/20 border-red-500 text-red-500';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-500';
      case 'info':
        return 'bg-blue-500/20 border-blue-500 text-blue-500';
      default:
        return 'bg-blue-500/20 border-blue-500 text-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg border backdrop-blur-sm animate-fadeInSlideRight ${getToastStyle(toast.type)}`}
        >
          <div className="flex justify-between items-start">
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-current opacity-70 hover:opacity-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;