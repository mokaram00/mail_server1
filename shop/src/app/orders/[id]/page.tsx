'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaBox, FaCreditCard, FaTruck, FaClock, FaMapMarkerAlt, FaShoppingBag, FaArrowLeft, FaEnvelope } from 'react-icons/fa';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const authHeader = localStorage.getItem('access_token') ? `Bearer ${localStorage.getItem('access_token')}` : null;

        const res = await fetch(`/api/orders/${params.id}`, {
          headers: {
            ...(authHeader && { 'Authorization': authHeader }),
          },
        });

        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else if (res.status === 401) {
          // Redirect to login if not authenticated
          router.push('/login?redirect=' + encodeURIComponent(`/orders/${params.id}`));
        } else if (res.status === 403) {
          // User doesn't own this order
          setOrder(null);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  // Require authentication to view orders
  if (!user) {
    router.push('/login?redirect=' + encodeURIComponent(`/orders/${params.id}`));
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري إعادة التوجيه لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">طلب غير موجود</h1>
            <p className="text-gray-600 mb-6 text-sm">لم نتمكن من العثور على الطلب المطلوب أو ليس لديك صلاحية لعرضه.</p>
            <div className="space-y-3">
              <Link
                href="/products"
                className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
              >
                العودة للتسوق
              </Link>
              <div>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-black text-xs font-medium transition-colors duration-200"
                >
                  أو قم بتسجيل الدخول مرة أخرى
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this order
  if (order.user && order.user.toString() !== user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🔒</div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">غير مسموح لك</h1>
            <p className="text-gray-600 mb-6 text-sm">هذا الطلب ليس ملكك أو لا تملك صلاحية لعرضه.</p>
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
            >
              العودة للتسوق
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-gray-600 hover:text-black font-medium mb-3 transition-colors duration-200 text-sm"
          >
            <FaArrowLeft className="w-3 h-3 ml-1" />
            العودة للتسوق
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent flex items-center">
            <FaBox className="w-6 h-6 text-black ml-2" />
            تفاصيل الطلب
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Order Header */}
          <div className="bg-gradient-to-r from-black to-gray-800 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">طلب رقم #{order._id.toString().slice(-8)}</h2>
                <p className="text-gray-200 text-sm">
                  تم إنشاؤه في {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {order.finalAmount.toFixed(2)} ريال
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.paymentStatus === 'paid' ? 'مدفوع' :
                   order.paymentStatus === 'pending' ? 'في الانتظار' : 'فاشل'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaCreditCard className="w-4 h-4 text-black ml-2" />
                    معلومات الطلب
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FaClock className="w-4 h-4 text-gray-500 ml-2" />
                        <span className="text-sm text-gray-600">حالة الطلب</span>
                      </div>
                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'pending' ? 'في الانتظار' :
                         order.status === 'processing' ? 'قيد المعالجة' :
                         order.status === 'shipped' ? 'تم الشحن' :
                         order.status === 'delivered' ? 'تم التسليم' : 'ملغي'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FaCreditCard className="w-4 h-4 text-gray-500 ml-2" />
                        <span className="text-sm text-gray-600">طريقة الدفع</span>
                      </div>
                      <span className="font-medium text-sm text-gray-900">
                        {order.paymentMethod === 'paypal' ? 'باي بال' :
                         order.paymentMethod === 'stripe' ? 'بطاقة ائتمان' : 'أخرى'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FaEnvelope className="w-4 h-4 text-gray-500 ml-2" />
                        <span className="text-sm text-gray-600">حالة الدفع</span>
                      </div>
                      <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'مدفوع' :
                         order.paymentStatus === 'pending' ? 'في الانتظار' : 'فاشل'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FaMapMarkerAlt className="w-4 h-4 text-black ml-2" />
                      عنوان الشحن
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium text-sm">{order.shippingAddress.street}</p>
                      <p className="text-gray-600 text-sm">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-gray-600 text-sm">{order.shippingAddress.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaShoppingBag className="w-4 h-4 text-gray-500 ml-2" />
                  المنتجات ({order.items.length})
                </h3>

                <div className="space-y-3">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <FaBox className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              منتج #{item.product?.toString().slice(-6) || 'غير محدد'}
                            </p>
                            <p className="text-xs text-gray-600">
                              الكمية: {item.quantity} × {item.price.toFixed(2)} ريال
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">
                          {(item.price * item.quantity).toFixed(2)} ريال
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-medium">{order.totalAmount.toFixed(2)} ريال</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span className="text-gray-900">الإجمالي:</span>
                    <span className="bg-gradient-to-r from-black to-gray-800 bg-clip-text text-transparent">{order.finalAmount.toFixed(2)} ريال</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/products"
                  className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center text-sm"
                >
                  متابعة التسوق 🛒
                </Link>
                <button
                  onClick={() => window.print()}
                  className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center text-sm"
                >
                  طباعة الطلب 🖨️
                </button>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-1">
                مرحباً {user?.name || user?.email}، هذا الطلب مرتبط بحسابك
              </p>
              <p className="text-xs text-gray-400">
                تم التحقق من ملكيتك لهذا الطلب
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}