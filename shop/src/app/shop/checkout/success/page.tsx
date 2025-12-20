'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { FaCheckCircle, FaInbox, FaCreditCard, FaTruck, FaClock, FaEnvelope, FaShoppingBag } from 'react-icons/fa';

function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; paymentId?: string; payment_method?: string; PayerID?: string };
}) {
  const router = useRouter();
  const { clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [executed, setExecuted] = useState(false);

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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  // Require authentication to view success page
  if (!user) {
    router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري إعادة التوجيه لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (loading || !isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري الانتظار لتأكيد الدفع من الويب هوك...</p>
          <p className="text-sm text-gray-500 mt-2">قد يستغرق هذا بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            خطأ في الدفع
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            لم نتمكن من العثور على بيانات الطلب. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.
          </p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            العودة للتسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FaCheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              تم الدفع بنجاح! 🎉
            </h1>
            <p className="text-sm text-gray-200">
              شكراً لك على طلبك. تم استلام دفعتك وجاري معالجة طلبك.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {/* Order Details Card */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FaInbox className="w-5 h-5 text-black ml-2" />
                تفاصيل الطلب
              </h2>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                #{order._id?.toString().slice(-8) || 'غير محدد'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Order Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaCreditCard className="w-4 h-4 text-gray-500 ml-2" />
                    <span className="text-sm text-gray-600">المبلغ المدفوع</span>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">
                    {order.totalAmount?.toFixed(2) || '0.00'} Usd
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaTruck className="w-4 h-4 text-gray-500 ml-2" />
                    <span className="text-sm text-gray-600">حالة الطلب</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status === 'completed' ? 'مكتمل' :
                     order.status === 'pending' ? 'قيد المعالجة' :
                     order.status === 'canceled' ? 'ملغي' : order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaClock className="w-4 h-4 text-gray-500 ml-2" />
                    <span className="text-sm text-gray-600">طريقة الدفع</span>
                  </div>
                  <span className="font-medium text-sm text-gray-900">
                   {order.paymentMethod === 'polar' ? 'Polar Checkout' :
                    order.paymentMethod === 'paypal' ? 'باي بال' :
                    order.paymentMethod === 'stripe' ? 'بطاقة ائتمان' : (order.paymentMethod || 'غير محدد')}
                 </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaEnvelope className="w-4 h-4 text-gray-500 ml-2" />
                    <span className="text-sm text-gray-600">حالة الدفع</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'مدفوع' :
                     order.paymentStatus === 'pending' ? 'قيد الانتظار' :
                     order.paymentStatus === 'failed' ? 'فاشل' : order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <FaShoppingBag className="w-4 h-4 text-gray-500 ml-1" />
                  المنتجات ({order.items?.length || 0})
                </h3>
                <div className="space-y-2">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          منتج #{item.product?.toString().slice(-6) || 'غير محدد'}
                        </p>
                        <p className="text-xs text-gray-600">
                          الكمية: {item.quantity || 0} × {(item.price || 0).toFixed(2)} USD
                        </p>
                      </div>
                      <span className="font-semibold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent text-sm">
                        {((item.price || 0) * (item.quantity || 0)).toFixed(2)} USD
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-medium">{order.totalAmount?.toFixed(2) || '0.00'} USD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span className="text-gray-900">الإجمالي:</span>
                    <span className="bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">{order.totalAmount?.toFixed(2) || '0.00'} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900 mb-3 text-center">
              الخطوات التالية 📋
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start space-x-2 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 font-bold text-xs">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs">تأكيد الطلب</h4>
                  <p className="text-xs text-gray-600">مراجعة خلال 24 ساعة</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 font-bold text-xs">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs">رسالة التأكيد</h4>
                  <p className="text-xs text-gray-600">ستصل على البريد الإلكتروني</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 font-bold text-xs">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs">الشحن</h4>
                  <p className="text-xs text-gray-600">خلال 2-3 أيام عمل</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 font-bold text-xs">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs">التتبع</h4>
                  <p className="text-xs text-gray-600">متابعة حالة الطلب</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center text-sm"
              >
                متابعة التسوق 🛒
              </Link>
              <button
                onClick={handleViewOrder}
                className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center text-sm"
              >
                عرض التفاصيل 📋
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-1">
                مرحباً {user?.name || user?.email}، تم ربط الطلب بحسابك
              </p>
              <p className="text-xs text-gray-400">
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
