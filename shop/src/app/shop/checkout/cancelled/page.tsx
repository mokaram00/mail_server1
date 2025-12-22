'use client';

import Link from 'next/link';
import SubdomainLink from '@/components/SubdomainLink';
import { FaTimesCircle, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-3xl shadow-xl p-8 text-center border border-foreground/10 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTimesCircle className="text-red-500 text-3xl" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4">
              تم إلغاء الدفع
            </h1>
            
            <p className="text-foreground/70 mb-8 leading-relaxed">
              لقد تم إلغاء عملية الدفع بنجاح. يمكنك العودة إلى سلة التسوق لإكمال عملية الشراء لاحقاً.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <SubdomainLink
                href="/cart"
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <FaShoppingCart className="mr-3" />
                العودة لسلة التسوق
              </SubdomainLink>
              <SubdomainLink
                href="/products"
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-foreground to-foreground/80 text-foreground-contrast px-6 py-4 rounded-2xl font-bold shadow-lg hover:from-foreground/90 hover:to-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <FaArrowLeft className="mr-3" />
                متابعة التسوق
              </SubdomainLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}