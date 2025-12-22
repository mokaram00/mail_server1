'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SubdomainLink from '@/components/SubdomainLink';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { FaCheckCircle, FaInbox, FaCreditCard, FaTruck, FaClock, FaEnvelope, FaShoppingBag, FaArrowLeft, FaPrint, FaDownload } from 'react-icons/fa';
import apiClient from '@/lib/apiClient';

function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; paymentId?: string; payment_method?: string; PayerID?: string };
}) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [executed, setExecuted] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getProfile();
        if (response.user) {
          setUser(response.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      const sessionId = searchParams.session_id;
      const paymentId = searchParams.paymentId;
      const paymentMethod = searchParams.payment_method;
      const payerId = searchParams.PayerID;

      try {
        if (sessionId) {
          const res = await fetch(`/api/checkout?session_id=${sessionId}`);
          const data = await res.json();
          if (data.order) {
            setOrder(data.order);
            // Check if payment is confirmed
            if (data.order.status === 'completed') {
              setIsConfirmed(true);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
      }
    };

    fetchOrder();

    // Polling every 3 seconds until confirmed
    const interval = setInterval(() => {
      if (!isConfirmed) {
        fetchOrder();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [searchParams, isConfirmed]);

  // No need to execute payment for Polar

  useEffect(() => {
    if (order) {
      // Clear cart after successful order
      clearCart();
    }
  }, [order, clearCart]);

  const handleViewOrder = () => {
    if (order) {
      window.open(`/orders/${order._id}`, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // In a real app, this would download a PDF receipt
    alert('Downloading receipt...');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  // Require authentication to view success page
  if (!user) {
    router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">جاري إعادة التوجيه لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (loading || !isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">جاري الانتظار لتأكيد الدفع من الويب هوك...</p>
          <p className="text-sm text-foreground/50 mt-2">قد يستغرق هذا بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 text-center">
            <div className="text-red-500 text-5xl mb-6">❌</div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              خطأ في الدفع
            </h1>
            <p className="text-foreground/70 mb-8 leading-relaxed">
              لم نتمكن من العثور على بيانات الطلب. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.
            </p>
            <SubdomainLink
              href="/products"
              className="inline-block bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
            >
              العودة للتسوق
            </SubdomainLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Success Header */}
        <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <FaCheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              تم الدفع بنجاح! 🎉
            </h1>
            <p className="text-foreground/70 text-lg">
              شكراً لك على طلبك. تم استلام دفعتك وجاري معالجة طلبك.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 overflow-hidden">
          {/* Back to Shopping Button */}
          <div className="p-6 border-b border-foreground/10">
            <SubdomainLink
              href="/products"
              className="inline-flex items-center text-foreground/70 hover:text-foreground font-medium transition-colors duration-200 text-base"
            >
              <FaArrowLeft className="w-4 h-4 ml-2" />
              العودة للتسوق
            </SubdomainLink>
          </div>

          {/* Order Details Card */}
          <div className="p-6 border-b border-foreground/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center">
                <FaInbox className="w-6 h-6 text-foreground ml-3" />
                تفاصيل الطلب
              </h2>
              <span className="bg-foreground/10 text-foreground px-4 py-2 rounded-full text-base font-semibold">
                #{order._id?.toString().slice(-8) || 'غير محدد'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Order Info */}
              <div className="space-y-6">
                <div className="bg-foreground/5 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center">
                    <FaCreditCard className="w-6 h-6 text-foreground ml-3" />
                    معلومات الطلب
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-5 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaCreditCard className="w-6 h-6 text-foreground/50 ml-4" />
                        <div>
                          <span className="text-foreground/70">المبلغ المدفوع</span>
                          <p className="font-bold text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mt-1">
                            {order.totalAmount?.toFixed(2) || '0.00'} Usd
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaTruck className="w-6 h-6 text-foreground/50 ml-4" />
                        <div>
                          <span className="text-foreground/70">حالة الطلب</span>
                          <span className={`inline-block px-4 py-2 rounded-full text-base font-medium mt-1 ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`}>
                            {order.status === 'completed' ? 'مكتمل' :
                             order.status === 'pending' ? 'قيد المعالجة' :
                             order.status === 'canceled' ? 'ملغي' : order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaClock className="w-6 h-6 text-foreground/50 ml-4" />
                        <div>
                          <span className="text-foreground/70">طريقة الدفع</span>
                          <p className="font-medium text-foreground text-base mt-1">
                           {order.paymentMethod === 'polar' ? 'Polar Checkout' :
                            order.paymentMethod === 'paypal' ? 'باي بال' :
                            order.paymentMethod === 'stripe' ? 'بطاقة ائتمان' : (order.paymentMethod || 'غير محدد')}
                         </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaEnvelope className="w-6 h-6 text-foreground/50 ml-4" />
                        <div>
                          <span className="text-foreground/70">حالة الدفع</span>
                          <span className={`inline-block px-4 py-2 rounded-full text-base font-medium mt-1 ${
                            order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                            order.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`}>
                            {order.paymentStatus === 'paid' ? 'مدفوع' :
                             order.paymentStatus === 'pending' ? 'قيد الانتظار' :
                             order.paymentStatus === 'failed' ? 'فاشل' : order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-6">
                <div className="bg-foreground/5 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center">
                    <FaShoppingBag className="w-6 h-6 text-foreground/50 ml-3" />
                    المنتجات ({order.items?.length || 0})
                  </h3>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-5 bg-card rounded-xl shadow-sm border border-foreground/10 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <div className="w-14 h-14 bg-gradient-to-br from-foreground/10 to-foreground/20 rounded-lg flex items-center justify-center">
                            <FaInbox className="w-6 h-6 text-foreground/50" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              منتج #{item.product?.toString().slice(-6) || 'غير محدد'}
                            </p>
                            <p className="text-sm text-foreground/70">
                              الكمية: {item.quantity || 0} × {(item.price || 0).toFixed(2)} USD
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {((item.price || 0) * (item.quantity || 0)).toFixed(2)} USD
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-foreground/10 pt-5 mt-6 space-y-3 bg-foreground/5 p-5 rounded-xl">
                    <div className="flex justify-between text-base">
                      <span className="text-foreground/70">المجموع الفرعي:</span>
                      <span className="font-medium">{order.totalAmount?.toFixed(2) || '0.00'} USD</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold border-t border-foreground/10 pt-4">
                      <span className="text-foreground">الإجمالي:</span>
                      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{order.totalAmount?.toFixed(2) || '0.00'} USD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="p-6 bg-foreground/5 border-b border-foreground/10">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              الخطوات التالية 📋
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div className="flex flex-col items-center text-center p-5 bg-card rounded-xl shadow-sm border border-foreground/10 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-500 font-bold text-lg">1</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-base">تأكيد الطلب</h4>
                <p className="text-sm text-foreground/70">مراجعة خلال 24 ساعة</p>
              </div>

              <div className="flex flex-col items-center text-center p-5 bg-card rounded-xl shadow-sm border border-foreground/10 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-green-500 font-bold text-lg">2</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-base">رسالة التأكيد</h4>
                <p className="text-sm text-foreground/70">ستصل على البريد الإلكتروني</p>
              </div>

              <div className="flex flex-col items-center text-center p-5 bg-card rounded-xl shadow-sm border border-foreground/10 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-purple-500 font-bold text-lg">3</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-base">الشحن</h4>
                <p className="text-sm text-foreground/70">خلال 2-3 أيام عمل</p>
              </div>

              <div className="flex flex-col items-center text-center p-5 bg-card rounded-xl shadow-sm border border-foreground/10 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-yellow-500 font-bold text-lg">4</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-base">التتبع</h4>
                <p className="text-sm text-foreground/70">متابعة حالة الطلب</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8">
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-8">
              <SubdomainLink
                href="/products"
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                متابعة التسوق 🛒
              </SubdomainLink>
              <button
                onClick={handleViewOrder}
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                عرض التفاصيل 📋
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-foreground to-foreground/80 text-foreground-contrast px-6 py-4 rounded-2xl font-bold shadow-lg hover:from-foreground/90 hover:to-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <FaPrint className="mr-3" />
                طباعة الإيصال 🖨️
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <FaDownload className="mr-3" />
                تنزيل الإيصال 💾
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-base text-foreground/70 mb-2">
                مرحباً {user?.name || user?.email}، تم ربط الطلب بحسابك
              </p>
              <p className="text-sm text-foreground/50">
                تم مسح السلة تلقائياً بعد إتمام الدفع
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WrappedCheckoutSuccessPage(props: any) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessPage {...props} />
    </Suspense>
  );
}