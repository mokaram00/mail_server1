'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SubdomainLink from '@/components/SubdomainLink';
import { FaInbox, FaCreditCard, FaTruck, FaClock, FaMapMarker, FaShoppingBag, FaArrowLeft, FaEnvelope, FaPrint, FaDownload } from 'react-icons/fa';
import apiClient from '@/lib/apiClient';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      try {
        // Only fetch order if we have an ID and user is authenticated
        if (!params.id || !user) return;

        const response = await apiClient.getOrderById(params.id as string);

        if (response.order) {
          setOrder(response.order);
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && user) {
      fetchOrder();
    }
  }, [params.id, user]);

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

  // Require authentication to view orders
  if (!user) {
    router.push('/login?redirect=' + encodeURIComponent(`/orders/${params.id}`));
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">جاري إعادة التوجيه لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">جاري تحميل تفاصيل الطلب...</p>
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
            <h1 className="text-2xl font-bold text-foreground mb-3">طلب غير موجود</h1>
            <p className="text-foreground/70 mb-8 leading-relaxed">لم نتمكن من العثور على الطلب المطلوب أو ليس لديك صلاحية لعرضه.</p>
            <div className="space-y-5">
              <SubdomainLink
                href="/products"
                className="inline-block bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                العودة للتسوق
              </SubdomainLink>
              <div>
                <SubdomainLink
                  href="/login"
                  className="text-foreground/70 hover:text-foreground text-base font-medium transition-colors duration-200"
                >
                  أو قم بتسجيل الدخول مرة أخرى
                </SubdomainLink>
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
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 text-center">
            <div className="text-red-500 text-5xl mb-6">🔒</div>
            <h1 className="text-2xl font-bold text-foreground mb-3">غير مسموح لك</h1>
            <p className="text-foreground/70 mb-8 leading-relaxed">هذا الطلب ليس ملكك أو لا تملك صلاحية لعرضه.</p>
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
        {/* Header */}
        <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <SubdomainLink
              href="/products"
              className="inline-flex items-center text-foreground/70 hover:text-foreground font-medium mb-4 transition-colors duration-200 text-base"
            >
              <FaArrowLeft className="w-4 h-4 ml-2" />
              العودة للتسوق
            </SubdomainLink>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center">
              <FaInbox className="w-8 h-8 text-foreground ml-4" />
              تفاصيل الطلب
            </h1>
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-xl border border-foreground/10 overflow-hidden">
          {/* Order Header */}
          <div className="bg-gradient-to-r from-foreground to-foreground/90 text-foreground-contrast p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">طلب رقم #{order._id.toString().slice(-8)}</h2>
                <p className="text-foreground-contrast/80 text-base">
                  تم إنشاؤه في {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right mt-6 md:mt-0">
                <div className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground-contrast to-foreground-contrast/80 bg-clip-text text-transparent">
                  {order.finalAmount.toFixed(2)} ريال
                </div>
                <div className={`inline-block px-5 py-3 rounded-full text-base font-bold ${
                  order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                  'bg-red-500/20 text-red-600 border border-red-500/30'
                }`}>
                  {order.paymentStatus === 'paid' ? 'مدفوع' :
                   order.paymentStatus === 'pending' ? 'في الانتظار' : 'فاشل'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Order Information */}
              <div className="space-y-8">
                <div className="bg-foreground/5 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                    <FaCreditCard className="w-7 h-7 text-foreground ml-4" />
                    معلومات الطلب
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-6 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaClock className="w-7 h-7 text-foreground/50 ml-5" />
                        <div>
                          <span className="text-foreground/70 text-base">حالة الطلب</span>
                          <span className={`font-bold px-4 py-2 rounded-full text-base mt-2 inline-block ${
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                            order.status === 'processing' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                            order.status === 'shipped' ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30' :
                            order.status === 'delivered' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                            'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`}>
                            {order.status === 'pending' ? 'في الانتظار' :
                             order.status === 'processing' ? 'قيد المعالجة' :
                             order.status === 'shipped' ? 'تم الشحن' :
                             order.status === 'delivered' ? 'تم التسليم' : 'ملغي'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaCreditCard className="w-7 h-7 text-foreground/50 ml-5" />
                        <div>
                          <span className="text-foreground/70 text-base">طريقة الدفع</span>
                          <p className="font-bold text-foreground text-xl mt-1">
                            {order.paymentMethod === 'paypal' ? 'باي بال' :
                             order.paymentMethod === 'stripe' ? 'بطاقة ائتمان' : 'أخرى'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <div className="flex items-center">
                        <FaEnvelope className="w-7 h-7 text-foreground/50 ml-5" />
                        <div>
                          <span className="text-foreground/70 text-base">حالة الدفع</span>
                          <span className={`font-bold px-4 py-2 rounded-full text-base mt-2 inline-block ${
                            order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                            order.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-600 border border-red-500/30'
                          }`}>
                            {order.paymentStatus === 'paid' ? 'مدفوع' :
                             order.paymentStatus === 'pending' ? 'في الانتظار' : 'فاشل'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="bg-foreground/5 rounded-2xl p-6">
                    <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                      <FaMapMarker className="w-7 h-7 text-foreground ml-4" />
                      عنوان الشحن
                    </h3>
                    <div className="p-6 bg-card rounded-xl shadow-sm border border-foreground/10">
                      <p className="text-foreground font-bold text-lg">{order.shippingAddress.street}</p>
                      <p className="text-foreground/70 text-base mt-2">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-foreground/70 text-base">{order.shippingAddress.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-8">
                <div className="bg-foreground/5 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                    <FaShoppingBag className="w-7 h-7 text-foreground/50 ml-4" />
                    المنتجات ({order.items.length})
                  </h3>

                  <div className="space-y-5 max-h-96 overflow-y-auto">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-6 bg-card rounded-xl shadow-sm border border-foreground/10 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-5 rtl:space-x-reverse">
                          <div className="w-16 h-16 bg-gradient-to-br from-foreground/10 to-foreground/20 rounded-xl flex items-center justify-center">
                            <FaInbox className="w-8 h-8 text-foreground/50" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              منتج #{item.product?.toString().slice(-6) || 'غير محدد'}
                            </p>
                            <p className="text-foreground/70 text-base">
                              الكمية: {item.quantity} × {item.price.toFixed(2)} ريال
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {(item.price * item.quantity).toFixed(2)} ريال
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-foreground/5 rounded-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-xl">
                      <span className="text-foreground/70">المجموع الفرعي:</span>
                      <span className="font-bold">{order.totalAmount.toFixed(2)} ريال</span>
                    </div>
                    <div className="flex justify-between text-3xl font-bold border-t border-foreground/10 pt-5">
                      <span className="text-foreground">الإجمالي:</span>
                      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{order.finalAmount.toFixed(2)} ريال</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 pt-8 border-t border-foreground/10">
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <SubdomainLink
                  href="/products"
                  className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-5 rounded-2xl font-bold shadow-lg hover:from-primary/90 hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  متابعة التسوق 🛒
                </SubdomainLink>
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-foreground to-foreground/80 text-foreground-contrast px-8 py-5 rounded-2xl font-bold shadow-lg hover:from-foreground/90 hover:to-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <FaPrint className="mr-4" />
                  طباعة الطلب 🖨️
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-5 rounded-2xl font-bold shadow-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <FaDownload className="mr-4" />
                  تنزيل الطلب 💾
                </button>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-10 text-center">
              <p className="text-base text-foreground/70 mb-2">
                مرحباً {user?.name || user?.email}، هذا الطلب مرتبط بحسابك
              </p>
              <p className="text-sm text-foreground/50">
                تم التحقق من ملكيتك لهذا الطلب
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}