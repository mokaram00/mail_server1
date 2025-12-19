'use client';

import { useState, useEffect } from 'react';
import AddProductDialog from '@/components/admin/AddProductDialog';
import EditProductDialog from '@/components/admin/EditProductDialog';
import DeleteProductDialog from '@/components/admin/DeleteProductDialog';
import AddCouponDialog from '@/components/admin/coupons/AddCouponDialog';
import EditCouponDialog from '@/components/admin/coupons/EditCouponDialog';
import Loading from './loading';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string[]; // array من مسارات الصور كـ strings
  createdAt: string;
}

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  createdAt: string;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  active?: boolean;
  usedCount?: number;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalUsers: 0,
    availableProducts: 0,
    outOfStockProducts: 0,
    featuredProducts: 0,
    activeCoupons: 0,
    expiredCoupons: 0,
    newOrders: 0,
    activeUsers: 0,
    averageOrderValue: 0
  });

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: string;
    stock: string;
    featured: boolean;
    images: Array<{
      data: string;
      filename: string;
      contentType: string;
    }>;
  }>({
    name: '',
    description: '',
    price: '',
    stock: '',
    featured: false,
    images: []
  });

  // Filter states for products
  const [productFilters, setProductFilters] = useState({
    search: '',
    status: 'all', // all, available, unavailable
    priceRange: { min: '', max: '' }
  });

  // Pagination states for products
  const [productPagination, setProductPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 0,
    hasPrev: false,
    hasNext: false
  });

  // Global product statistics from API
  const [globalProductStats, setGlobalProductStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    outOfStockProducts: 0,
    featuredProducts: 0
  });



  // تحديث الإحصائيات عند تغيير البيانات
  useEffect(() => {
    if (products.length > 0 || coupons.length > 0 || globalProductStats.totalProducts >= 0) {
      loadDashboardStats();
    }
  }, [products, coupons, globalProductStats]);

  // التحقق من صلاحيات الأدمن عند تحميل الصفحة
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    console.log('🔄 Starting admin access check...');
    setAuthLoading(true);
    console.log('✅ authLoading set to true');

    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Token found:', !!token);

      if (!token) {
        console.log('❌ No token found');
        setErrorMessage('Login Required');
        setLoading(false);
        return;
      }

      console.log('🚀 Calling /api/auth/me...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('👤 User role:', data.user.role);
        if (data.user.role === 'admin') {
          console.log('✅ User is admin');
          setIsAdmin(true);
          setActiveTab('products');
          loadInitialData();
        } else {
          console.log('❌ User is not admin');
          setErrorMessage('Unauthorized access');
        }
      } else {
        console.log('❌ Auth failed');
        setErrorMessage('Identity verification failed');
      }
    } catch (error) {
      console.error('❌ Error in auth check:', error);
      setErrorMessage('Identity verification failed');
    } finally {
      console.log('🔄 Setting authLoading to false and loading to false');
      // Add minimum delay to ensure loading is visible
      setTimeout(() => {
        setAuthLoading(false);
        setLoading(false);
        console.log('✅ Loading states set to false after delay');
      }, 1000); // 1 second minimum delay
    }
  };

  // تحميل البيانات الأولية
  const loadInitialData = async () => {
    try {
      // تحميل البيانات بالتوازي
      await Promise.all([
        loadProducts(), // تحميل الصفحة الأولى من المنتجات
        loadCoupons()
      ]);
    } catch (error) {
      console.error('خطأ في تحميل البيانات الأولية:', error);
    }
  };

  // تحميل إحصائيات لوحة التحكم
  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      console.log('🔢 Calculating dashboard stats...');
      console.log('📦 Products count:', products.length);
      console.log('🎫 Coupons count:', coupons.length);

      // حساب إحصائيات المنتجات
      const totalProducts = globalProductStats.totalProducts ?? products.length;
      const availableProducts = globalProductStats.availableProducts ?? products.filter((p: Product) => p.stock > 0).length;
      const outOfStockProducts = globalProductStats.outOfStockProducts ?? products.filter((p: Product) => p.stock <= 0).length;
      const featuredProducts = globalProductStats.featuredProducts ?? products.filter((p: Product) => p.featured).length;

      // حساب إحصائيات الكوبونات
      const activeCoupons = coupons.filter((c: Coupon) => c.isActive).length;
      const expiredCoupons = coupons.filter((c: Coupon) =>
        !c.isActive || (c.endDate && new Date(c.endDate) < new Date())
      ).length;

      // حساب إحصائيات المبيعات (تقديرية لحين توفر بيانات الطلبات)
      const totalSales = products.reduce((sum: number, product: Product) => sum + (product.price * Math.min(product.stock, 10)), 0); // تقدير بـ 10 مبيعات لكل منتج
      const totalOrders = Math.floor(totalSales / 150); // تقدير متوسط قيمة الطلب 150 ريال
      const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

      console.log('📊 Calculated stats:', {
        totalProducts,
        availableProducts,
        outOfStockProducts,
        featuredProducts,
        activeCoupons,
        expiredCoupons,
        totalSales,
        totalOrders,
        averageOrderValue
      });

      setStats({
        totalProducts,
        totalOrders,
        totalSales,
        totalUsers: 0, // سيتم تحديثه عند توفر API المستخدمين
        availableProducts,
        outOfStockProducts,
        featuredProducts,
        activeCoupons,
        expiredCoupons,
        newOrders: 0, // سيتم تحديثه عند توفر API الطلبات الجديدة
        activeUsers: 0, // سيتم تحديثه عند توفر API المستخدمين النشطين
        averageOrderValue
      });
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  // تحميل الكوبونات
  const loadCoupons = async () => {
    try {
      setCouponsLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
        console.log('✅ Coupons loaded:', data.coupons?.length || 0);
      } else {
        console.error('❌ Failed to load coupons:', response.status);
      }
    } catch (error) {
      console.error('خطأ في تحميل الكوبونات:', error);
      setErrorMessage('Server error occurred');
    } finally {
      setCouponsLoading(false);
    }
  };

  // تحميل المنتجات
  const loadProducts = async (page: number = 1, limit: number = 10) => {
    try {
      setProductsLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      // إضافة فلاتر البحث والفئة إذا كانت موجودة
      if (productFilters.search) {
        params.append('search', productFilters.search);
      }
      if (productFilters.status && productFilters.status !== 'all') {
        params.append('status', productFilters.status);
      }
      if (productFilters.priceRange.min) {
        params.append('minPrice', productFilters.priceRange.min);
      }
      if (productFilters.priceRange.max) {
        params.append('maxPrice', productFilters.priceRange.max);
      }
      const apiUrl = `/api/admin/products?${params.toString()}`;
      console.log('🔍 Frontend API Call:', {
        url: apiUrl,
        page,
        limit,
        filters: productFilters
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 API Response Debug:', {
          requestedPage: page,
          requestedLimit: limit,
          filters: {
            search: productFilters.search,
          },
          apiResponse: {
            productsCount: data.products?.length || 0,
            pagination: data.pagination
          }
        });
        setProducts(data.products || []);
        // تحديث معلومات التصفح من الـ API
        setProductPagination(prev => {
          const newPagination = {
            ...prev,
            currentPage: data.pagination?.currentPage || page,
            totalPages: data.pagination?.totalPages || 1,
            totalItems: data.pagination?.totalProducts || 0,
            itemsPerPage: limit,
            hasPrev: data.pagination?.hasPrev || false,
            hasNext: data.pagination?.hasNext || false
          };
          console.log('🔄 Updated pagination state:', newPagination);
          return newPagination;
        });

        if (data.statistics) {
          setGlobalProductStats({
            totalProducts: data.statistics.totalProducts || 0,
            availableProducts: data.statistics.availableProducts || 0,
            outOfStockProducts: data.statistics.outOfStockProducts || 0,
            featuredProducts: data.statistics.featuredProducts || 0
          });

          setStats(prev => ({
            ...prev,
            totalProducts: data.statistics.totalProducts || 0,
            availableProducts: data.statistics.availableProducts || 0,
            outOfStockProducts: data.statistics.outOfStockProducts || 0,
            featuredProducts: data.statistics.featuredProducts || 0
          }));
        }
        console.log('✅ Products loaded with pagination:', {
          products: data.products?.length || 0,
          pagination: data.pagination
        });
      } else {
        console.error('❌ Failed to load products:', response.status);
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
      }
    } catch (error) {
      console.error('خطأ في تحميل المنتجات:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // دالة تحويل الملفات إلى base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('فشل في تحويل الملف إلى base64'));
        }
      };
      reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
      reader.readAsDataURL(file);
    });
  };

  // معالجة اختيار الصور وعرض المعاينات
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const previewUrls: string[] = [];

    // إنشاء معاينات للصور المختارة
    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        previewUrls.push(previewUrl);
      }
    });

    setSelectedImages(fileArray);
    setImagePreviews(previewUrls);
  };

  const openAddProductModal = () => {
    setShowProductModal(true);
  };


  const closeAddProductModal = () => {
    setShowProductModal(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      featured: false,
      images: []
    });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // فتح نموذج تعديل المنتج
  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      featured: product.featured,
      images: []
    });
    setShowEditProductModal(true);
    setShowProductModal(false);
  };

  // إغلاق نموذج تعديل المنتج
  const closeEditProductModal = () => {
    setShowEditProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      featured: false,
      images: []
    });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // تعديل المنتج
  const handleEditProduct = async (event: React.FormEvent, submittedFormData: FormData) => {
    event.preventDefault();

    if (!editingProduct) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage(t('loginRequired'));
      return;
    }

    setIsCreatingProduct(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setErrorMessage(t('identityVerificationFailed'));
      }

      const data = await response.json();
      if (data.user.role !== 'admin') {
        setErrorMessage(t('noPermissionToEditProducts'));
      }

      const editResponse = await fetch(`/api/admin/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submittedFormData,
      });

      const result = await editResponse.json();
      console.log('Edit API response:', result);
      console.log('Editing product ID:', editingProduct._id);
      console.log('Response product ID:', result.product._id);

      if (editResponse.ok) {
        console.log('✅ Edit successful, showing success message and closing dialog');
        setSuccessMessage(t('productUpdated'));
        closeEditProductModal();

        // تحديث المنتج في القائمة - فرض إعادة التصيير
        setProducts(prev => {
          const newProducts = prev.map((p: Product) =>
            p._id === editingProduct._id ? { ...result.product } : p
          );
          console.log('🔄 Forcing React re-render with new array reference');
          return [...newProducts]; // إنشاء مصفوفة جديدة لفرض إعادة التصيير
        });

      } else {
        console.log('❌ Edit failed:', result.error);
        setErrorMessage(result.error || t('productUpdateFailed'));
      }
    } catch (error: any) {
      console.error('خطأ في تعديل المنتج:', error);
      setErrorMessage(t('serverError'));
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // فتح حوار حذف المنتج
  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  // إغلاق حوار الحذف
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingProduct(null);
  };

  // تأكيد حذف المنتج
  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage(t('loginRequired'));
      closeDeleteModal();
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${deletingProduct._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(t('productDeleted'));
        // إزالة المنتج من القائمة
        setProducts(prev => prev.filter((p: Product) => p._id !== deletingProduct._id));
      } else {
        setErrorMessage(t('productDeleteFailed'));
      }
    } catch (error: any) {
      console.error('خطأ في حذف المنتج:', error);
      setErrorMessage(t('serverError'));
    } finally {
      closeDeleteModal();
    }
  };

  // إغلاق نموذج تعديل الكوبون
  const closeEditCouponModal = () => {
    setShowEditCouponModal(false);
    setEditingCoupon(null);
  };


  const handleAddProduct = async (event: React.FormEvent, productData: FormData) => {
    event.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage(t('loginRequired'));
      return;
    }

    // بدء عملية الإنشاء
    setIsCreatingProduct(true);
    setIsUploadingImages(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setErrorMessage(t('identityVerificationFailed'));
      }

      const data = await response.json();
      if (data.user.role !== 'admin') {
        setErrorMessage(t('noPermissionToCreateProducts'));
      }

      // إنشاء منتج مؤقت للـ optimistic update
      const optimisticProduct: Product = {
        _id: 'temp-' + Date.now(),
        name: productData.get('name') as string,
        description: productData.get('description') as string,
        price: parseFloat(productData.get('price') as string),
        stock: parseInt(productData.get('stock') as string),
        featured: productData.get('featured') === 'on',
        images: [],
        createdAt: new Date().toISOString()
      };

      setProducts(prev => [...prev, optimisticProduct]);

      const formData = new FormData();
      formData.append('name', productData.get('name') as string);
      formData.append('description', productData.get('description') as string);
      formData.append('price', productData.get('price') as string);
      formData.append('stock', productData.get('stock') as string);
      formData.append('featured', productData.get('featured') as string);

      // إضافة الصور المختارة
      selectedImages.forEach((file, index) => {
        formData.append('images', file);
      });

      console.log('📤 بدء رفع الصور...');

      const createResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: productData,
      });

      const result = await createResponse.json();

      if (createResponse.ok) {
        setSuccessMessage(t('productAdded'));

        // Don't close the dialog yet - wait for images to finish uploading
        // The dialog will be closed after the upload process completes

        // Replace optimistic product with real data
        setProducts(prev => prev.map((p: Product) =>
          p._id === optimisticProduct._id ? result.product : p
        ));

        // Update stats
        setStats(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }));

        // Close dialog after successful completion
        closeAddProductModal();
        setIsUploadingImages(false);
      } else {
        // Revert optimistic update on error
        setProducts(prev => prev.filter((p: Product) => p._id !== optimisticProduct._id));
        setErrorMessage(t('productAddFailed'));
        // Close dialog on error
        closeAddProductModal();
        setIsUploadingImages(false);
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setProducts(prev => prev.filter((p: Product) => p._id !== 'temp-' + Date.now()));
      console.error('خطأ في إرسال البيانات:', error);
      setErrorMessage(t('serverError'));
      // Close dialog on error
      closeAddProductModal();
      setIsUploadingImages(false);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleAddCoupon = async (event: React.FormEvent, couponData: FormData) => {
    event.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage(t('loginRequired'));
      return;
    }

    try {
      const payload = {
        code: couponData.get('code') as string,
        discountType: couponData.get('discountType') as string,
        discountValue: parseFloat(couponData.get('discountValue') as string),
        startDate: couponData.get('startDate') as string,
        endDate: couponData.get('endDate') as string,
        usageLimit: parseInt(couponData.get('usageLimit') as string) || 0,
        active: couponData.get('isActive') === 'on'
      };

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(t('success.couponAdded'));
        setShowCouponModal(false);
        setErrorMessage('');
        loadCoupons(); // إعادة تحميل الكوبونات
      } else {
        setErrorMessage(result.error || 'فشل في إضافة الكوبون');
      }
    } catch (error) {
      console.error('خطأ في إضافة الكوبون:', error);
      setErrorMessage(t('serverError'));
    }
  };

  const handleEditCoupon = async (event: React.FormEvent, couponData: FormData) => {
    event.preventDefault();

    if (!editingCoupon) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage(t('loginRequired'));
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${editingCoupon._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponData.get('code'),
          discountType: couponData.get('discountType'),
          discountValue: parseFloat(couponData.get('discountValue') as string),
          startDate: couponData.get('startDate'),
          endDate: couponData.get('endDate'),
          usageLimit: parseInt(couponData.get('usageLimit') as string) || 0,
          active: couponData.get('isActive') === 'on'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(t('couponUpdated'));
        closeEditCouponModal();
        loadCoupons(); // إعادة تحميل الكوبونات
      } else {
        setErrorMessage(t('couponUpdateFailed'));
      }
    } catch (error) {
      console.error('خطأ في تعديل الكوبون:', error);
      setErrorMessage(t('serverError'));
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage(t('loginRequired'));
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('تم حذف الكوبون بنجاح');
        loadCoupons(); // إعادة تحميل الكوبونات
        loadDashboardStats(); // تحديث الإحصائيات
      } else {
        setErrorMessage(result.error || 'فشل في حذف الكوبون');
      }
    } catch (error) {
      console.error('خطأ في حذف الكوبون:', error);
      setErrorMessage(t('serverError'));
    }
  };
  // دالة التنقل بين الصفحات
  const handleProductPageChange = async (page: number) => {
    if (page >= 1 && page <= productPagination.totalPages) {
      // تحديث الصفحة الحالية مؤقتاً
      setProductPagination(prev => ({ ...prev, currentPage: page }));
      // تحميل المنتجات من الصفحة الجديدة
      await loadProducts(page, productPagination.itemsPerPage);
    }
  };

  // إعادة تعيين الصفحة الحالية عند تغيير الفلاتر
  useEffect(() => {
    setProductPagination(prev => ({ ...prev, currentPage: 1 }));
    // إعادة تحميل المنتجات مع الفلاتر الجديدة
    loadProducts(1, productPagination.itemsPerPage);
  }, [productFilters]);
  // فلترة الأصناف

  // عرض رسالة الخطأ إذا لم يكن المستخدم أدمن (بعد انتهاء التحقق)
  if (!loading && !authLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('error.unauthorized')}</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <a
            href="/"
            className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-gray-800 hover:to-black transition-all duration-300 transform hover:scale-105 shadow-lg inline-block"
          >
            {t('common.backToHome')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {authLoading || loading ? (
        <Loading />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          {/* شريط التنقل العلوي */}
          <header className="bg-white shadow-xl border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
                    {t('admin.title')}
                  </h1>
                </div>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105">
                    {t('admin.logout')}
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* رسائل النجاح والخطأ - تظهر في الأعلى فوق كل شيء */}
            {successMessage && (
              <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full animate-in slide-in-from-top-2 fade-in-0 duration-300">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm flex items-center shadow-lg backdrop-blur-sm">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t('success.' + successMessage)}</p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="text-green-500 hover:text-green-700 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full animate-in slide-in-from-top-2 fade-in-0 duration-300">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center shadow-lg backdrop-blur-sm">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t('error.' + errorMessage)}</p>
                    {errorMessage.includes('فئات') && (
                      <div className="mt-2 text-xs">
                        <span className="font-medium text-red-600">الحل:</span> قم بإنشاء فئة جديدة أولاً من تبويب "الفئات" قبل إضافة منتجات.
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setErrorMessage('')}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8 rtl:space-x-reverse">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'products'
                    ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                >
                  {t('admin.products')}
                </button>
 
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'coupons'
                    ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                >
                  {t('admin.coupons')}
                </button>
              </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.totalProducts')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalProducts}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    📦
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.newOrders')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.newOrders}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    🛒
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('common.total')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${stats.totalSales.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    💰
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.totalUsers')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    👥
                  </div>
                </div>
              </div>
            </div>

            {/* إحصائيات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.availableProducts')}</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {stats.availableProducts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalProducts > 0 ? `${((stats.availableProducts / stats.totalProducts) * 100).toFixed(1)}% ${t('common.fromTotal')}` : '0%'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    ✅
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.outOfStockProducts')}</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {stats.outOfStockProducts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalProducts > 0 ? `${((stats.outOfStockProducts / stats.totalProducts) * 100).toFixed(1)}% ${t('common.fromTotal')}` : '0%'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    ❌
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.featuredProducts')}</p>
                    <p className="text-2xl font-semibold text-blue-600">
                      {stats.featuredProducts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalProducts > 0 ? `${((stats.featuredProducts / stats.totalProducts) * 100).toFixed(1)}% ${t('common.fromTotal')}` : '0%'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    ⭐
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t('admin.averageOrderValue')}</p>
                    <p className="text-2xl font-semibold text-purple-600">
                      ${stats.averageOrderValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalOrders > 0 ? `${stats.totalOrders} ${t('admin.totalOrders')}` : t('common.noOrders')}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    📊
                  </div>
                </div>
              </div>
            </div>

            {/* Products Management */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">{t('admin.products')}</h2>
                    <button
                      onClick={openAddProductModal}
                      className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-gray-800 hover:to-black transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {t('admin.addProduct')}
                    </button>
                  </div>
                </div>

                {/* فلترة المنتجات */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* شريط البحث */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('common.searchProducts')}
                      </label>
                      <input
                        type="text"
                        value={productFilters.search}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder={t('common.searchPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    {/* فلترة الحالة */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('common.status')}
                      </label>
                      <select
                        value={productFilters.status}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 bg-white"
                      >
                        <option value="all">{t('common.allStatuses')}</option>
                        <option value="available">{t('common.available')}</option>
                        <option value="unavailable">{t('common.unavailable')}</option>
                      </select>
                    </div>

                    {/* زر إعادة تعيين الفلاتر */}
                    <div>
                      <button
                        onClick={() => setProductFilters({
                          search: '',
                          status: 'all',
                          priceRange: { min: '', max: '' }
                        })}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                      >
                        {t('common.resetFilters')}
                      </button>
                    </div>
                  </div>

                  {/* فلترة النطاق السعري */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('common.minPrice')} ($)
                      </label>
                      <input
                        type="number"
                        value={productFilters.priceRange.min}
                        onChange={(e) => setProductFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: e.target.value }
                        }))}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('common.maxPrice')} ($)
                      </label>
                      <input
                        type="number"
                        value={productFilters.priceRange.max}
                        onChange={(e) => setProductFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: e.target.value }
                        }))}
                        placeholder="∞"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* إحصائيات النتائج */}
                  <div className="mt-4 text-sm text-gray-700 font-medium">
                    {t('common.showingResults')
                      .replace('{filtered}', `${((productPagination.currentPage - 1) * productPagination.itemsPerPage) + 1}-${Math.min(productPagination.currentPage * productPagination.itemsPerPage, productPagination.totalItems)}`)
                      .replace('{total}', productPagination.totalItems.toString())
                      .replace('{type}', productPagination.totalItems === 1 ? t('admin.product') : t('admin.products'))
                    }
                    {productPagination.totalPages > 1 && (
                      <span className="mr-2 rtl:ml-2">
                        - {t('admin.page')} {productPagination.currentPage} {t('common.from')} {productPagination.totalPages}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-16 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.image')}
                          </th>
                          <th className="w-40 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.name')}
                          </th>
                          <th className="w-20 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.price')}
                          </th>
                          <th className="w-20 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.stock')}
                          </th>
                          <th className="w-28 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productsLoading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <tr key={`product-skeleton-${index}`} className="animate-pulse">
                              <td className="px-3 py-4">
                                <div className="flex justify-end">
                                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded-full w-24 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded-full w-20 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded-full w-16 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex justify-end">
                                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                                  <div className="h-4 w-12 bg-gray-200 rounded-full" />
                                  <div className="h-4 w-16 bg-gray-200 rounded-full" />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : products.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-gray-700 font-medium">
                              {productFilters.search || productFilters.status !== 'all' || productFilters.priceRange.min || productFilters.priceRange.max
                                ? t('common.noFilterResults').replace('{type}', t('admin.products'))
                                : t('admin.noProducts')
                              }
                            </td>
                          </tr>
                        ) : (
                          products.map((product: Product) => (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 text-sm text-gray-900">
                                <div className="flex justify-end">
                                  <img
                                    src={product.images?.[0] || '/placeholder-product.png'}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                <div className="text-right">
                                  {product.name}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="text-right">
                                  ${product.price?.toFixed(2) || '0.00'}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="flex justify-end">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {product.stock > 0 ? t('common.available') : t('common.unavailable')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                                  <button
                                    onClick={() => openEditProductModal(product)}
                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(product)}
                                    className="text-red-600 hover:text-red-900 font-medium"
                                  >
                                    {t('common.deleteProduct')}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {productPagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                        <button
                          onClick={() => handleProductPageChange(productPagination.currentPage - 1)}
                          disabled={!productPagination.hasPrev && productPagination.currentPage <= 1}
                          className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 transition-all duration-300 border border-gray-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>{t('common.previous')}</span>
                        </button>

                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          {Array.from({ length: Math.min(productPagination.totalPages, 7) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handleProductPageChange(pageNum)}
                                className={`px-3 py-2 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${pageNum === productPagination.currentPage
                                  ? 'text-white bg-gradient-to-r from-black to-gray-800 shadow-lg scale-105'
                                  : 'text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          {productPagination.totalPages > 7 && productPagination.currentPage < productPagination.totalPages - 3 && (
                            <>
                              <span className="px-2 py-2 text-gray-400 font-medium">...</span>
                              <button
                                onClick={() => handleProductPageChange(productPagination.totalPages)}
                                className="px-3 py-2 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 transform hover:scale-105"
                              >
                                {productPagination.totalPages}
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => handleProductPageChange(productPagination.currentPage + 1)}
                          disabled={!productPagination.hasNext && productPagination.currentPage >= productPagination.totalPages}
                          className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 transition-all duration-300 border border-gray-200"
                        >
                          <span>{t('common.next')}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coupons Management */}
            {activeTab === 'coupons' && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">{t('admin.coupons')}</h2>
                    <button
                      onClick={() => setShowCouponModal(true)}
                      className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-gray-800 hover:to-black transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {t('admin.addCoupon')}
                    </button>
                  </div>
                </div>

                {/* فلترة الكوبونات */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* شريط البحث */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('admin.searchCoupons')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('admin.searchCouponsPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    {/* زر إعادة تعيين الفلاتر */}
                    <div className="md:col-span-1">
                      <button className="w-full px-3 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium">
                        {t('common.resetFilters')}
                      </button>
                    </div>
                  </div>

                  {/* إحصائيات النتائج */}
                  <div className="mt-4 text-sm text-gray-700 font-medium">
                    {t('common.showingResults')
                      .replace('{filtered}', coupons.length.toString())
                      .replace('{total}', coupons.length.toString())
                      .replace('{type}', coupons.length === 1 ? t('admin.coupon') : t('admin.coupons'))
                    }                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.couponCode')}
                          </th>
                          <th className="w-20 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.discountType')}
                          </th>
                          <th className="w-20 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.discountValue')}
                          </th>
                          <th className="w-28 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.startDate')}
                          </th>
                          <th className="w-28 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.endDate')}
                          </th>
                          <th className="w-16 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('common.status')}
                          </th>
                          <th className="w-20 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.usageCount')}
                          </th>
                          <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                            {t('admin.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {couponsLoading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <tr key={`coupon-skeleton-${index}`} className="animate-pulse">
                              <td className="px-3 py-4">
                                <div className="h-5 bg-gray-200 rounded w-24 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded w-20 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex justify-end">
                                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                                  <div className="h-4 w-12 bg-gray-200 rounded-full" />
                                  <div className="h-4 w-20 bg-gray-200 rounded-full" />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : coupons.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-4 text-center text-gray-700 font-medium">
                              {t('admin.noCoupons')}
                            </td>
                          </tr>
                        ) : (
                          coupons.map((coupon: Coupon) => (
                            <tr key={coupon._id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                <div className="text-right font-mono bg-gray-100 px-2 py-1 rounded">
                                  {coupon.code}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="text-right">
                                  {coupon.discountType === 'percentage' ? t('admin.percentageDiscount') : t('admin.fixedDiscount')}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="text-right">
                                  {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}%`
                                    : `$${coupon.discountValue}`}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="text-right">
                                  {coupon.createdAt ? new Date(coupon.createdAt).toLocaleDateString('en-US') : '—'}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="text-right">
                                  {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('en-US') : '—'}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="flex justify-end">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(coupon.isActive ?? coupon.active)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {(coupon.isActive ?? coupon.active) ? t('admin.couponActive') : t('admin.couponInactive')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="text-right">
                                  {(coupon.usageCount ?? coupon.usedCount ?? 0)}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                                  <button
                                    onClick={() => {
                                      setEditingCoupon(coupon);
                                      setShowEditCouponModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(coupon._id)}
                                    className="text-red-600 hover:text-red-900 font-medium"
                                  >
                                    {t('common.deleteCoupon')}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* نافذة إضافة منتج جديد */}
            <AddProductDialog
              isOpen={showProductModal}
              onClose={closeAddProductModal}
              onAddProduct={handleAddProduct}
            />

            {/* حوار تأكيد حذف المنتج */}
            <DeleteProductDialog
              isOpen={showDeleteModal}
              onClose={closeDeleteModal}
              product={deletingProduct}
              onConfirmDelete={confirmDeleteProduct}
            />
            <EditProductDialog
              isOpen={showEditProductModal}
              onClose={closeEditProductModal}
              product={editingProduct}
              onEditProduct={handleEditProduct}
              setErrorMessage={setErrorMessage}
              setSuccessMessage={setSuccessMessage}
            />

            {/* نافذة إضافة كوبون جديد */}
            <AddCouponDialog
              isOpen={showCouponModal}
              onClose={() => setShowCouponModal(false)}
              onAddCoupon={handleAddCoupon}
              setErrorMessage={setErrorMessage}
              setSuccessMessage={setSuccessMessage}
            />

            {/* نافذة تعديل الكوبون */}
            <EditCouponDialog
              isOpen={showEditCouponModal}
              onClose={closeEditCouponModal}
              coupon={editingCoupon}
              onEditCoupon={handleEditCoupon}
              setErrorMessage={setErrorMessage}
              setSuccessMessage={setSuccessMessage}
            />

          </div>
        </div>
      )
      }
    </>
  );
}
