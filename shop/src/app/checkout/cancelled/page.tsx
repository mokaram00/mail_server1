import Link from 'next/link';

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="text-red-400 text-6xl mb-6">❌</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          تم إلغاء الدفع
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          لم يتم إتمام عملية الدفع. يمكنك المحاولة مرة أخرى أو الرجوع للتسوق.
        </p>

        <div className="space-y-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-800 text-right">
              إذا واجهت أي مشكلة في عملية الدفع، يرجى المحاولة مرة أخرى أو التواصل معنا للحصول على المساعدة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/cart"
              className="flex-1 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              العودة لسلة التسوق
            </Link>
            <Link
              href="/products"
              className="flex-1 inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              متابعة التسوق
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              هل تحتاج مساعدة؟{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                تواصل معنا
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
