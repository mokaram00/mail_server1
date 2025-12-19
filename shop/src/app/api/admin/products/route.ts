import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-auth';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';
import { Polar } from "@polar-sh/sdk";


const polar = new Polar({
  accessToken: process.env.POLAR_API_KEY!,
});

// دالة رفع الصورة على Supabase Storage
async function uploadImageToSupabase(file: File, productId: string): Promise<{ url: string, filename: string, size: number }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `products/${productId}/${fileName}`;

  // تحويل الملف إلى Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // رفع الملف على Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from('product-images')
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`فشل في رفع الصورة: ${error.message}`);
  }

  // الحصول على الرابط العام للصورة
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    filename: fileName,
    size: file.size
  };
}

// إضافة منتج جديد مع رفع الصور على Supabase
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 بدء عملية إضافة منتج جديد');
    const { user } = await authenticateAdmin(request);

    console.log('✅ تم التحقق من صلاحيات الأدمن:', user.email);

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stockValue = formData.get('stock') as string;
    const stock = stockValue ? parseInt(stockValue) : 0;
    const featured = formData.get('featured') === 'on';

    console.log('📝 بيانات المنتج الخام:', {
      name,
      description,
      price,
      stockValue,
      stock,
      featured,
      stockValueType: typeof stockValue,
      stockType: typeof stock
    });

    // التحقق من البيانات المطلوبة
    if (!name || !description || !price || stockValue === null || stockValue === undefined || stockValue === '') {
      console.error('❌ بيانات المنتج غير مكتملة - القيم:', {
        name: !name,
        description: !description,
        price: !price,
        stockValue: stockValue === null || stockValue === undefined || stockValue === ''
      });
      return NextResponse.json(
        {
          error: getErrorMessage('ALL_FIELDS_REQUIRED', 'ar'),
          code: 'ALL_FIELDS_REQUIRED',
          details: getErrorDetails('ALL_FIELDS_REQUIRED', 'ar')
        },
        { status: 400 }
      );
    }

    // رفع الصور على Supabase Storage
    const images: Array<{ url: string, filename: string, size: number }> = [];
    const imageFiles = formData.getAll('images') as File[];

    console.log(`📸 تم العثور على ${imageFiles.length} صورة للرفع`);

    if (imageFiles.length === 0) {
      console.error('❌ لم يتم اختيار أي صور');
      return NextResponse.json(
        {
          error: getErrorMessage('NO_IMAGES_SELECTED', 'ar'),
          code: 'NO_IMAGES_SELECTED',
          details: getErrorDetails('NO_IMAGES_SELECTED', 'ar')
        },
        { status: 400 }
      );
    }

    // Generate a temporary ID for image uploads
    const tempId = Math.random().toString(36).substring(7);
    console.log('🆔 تم إنشاء ID مؤقت للصور:', tempId);


    // إنشاء قائمة بمسارات الصور فقط (بدلاً من objects كاملة)
    const imageUrls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file instanceof File && file.type.startsWith('image/')) {
        try {
          console.log(`📤 رفع الصورة ${i + 1}/${imageFiles.length}: ${file.name} (${Math.round(file.size / 1024)}KB)`);
          const uploadedImage = await uploadImageToSupabase(file, tempId);
          imageUrls.push(uploadedImage.url); // حفظ مسار الصورة فقط
          console.log(`✅ تم رفع الصورة ${i + 1} بنجاح:`, uploadedImage.filename);
        } catch (error) {
          console.error(`❌ فشل في رفع الصورة ${file.name}:`, error);
          // حذف الصور المرفوعة في حالة فشل
          for (const url of imageUrls) {
            const filePath = url.split('/storage/v1/object/public/product-images/')[1];
            await supabaseAdmin.storage.from('product-images').remove([filePath]);
          }
          return NextResponse.json(
            {
              error: getErrorMessage('IMAGE_UPLOAD_FAILED', 'ar'),
              code: 'IMAGE_UPLOAD_FAILED',
              details: getErrorDetails('IMAGE_UPLOAD_FAILED', 'ar')
            },
            { status: 500 }
          );
        }
      }
    }

    // Get organization ID from Polar
    const organizations = await polar.organizations.list({ limit: 1 });
    let orgId;
    for await (const org of organizations) {
      orgId = (org as any).id;
      break;
    }
    console.log('🆔 Organization ID:', orgId);

    // Create product in Polar
    console.log('📦 إنشاء منتج في Polar...');
    const polarProduct = await polar.products.create({
      organizationId: orgId,
      name,
      description,
      prices: [{ amountType: 'fixed', priceAmount: Math.round(price * 100), priceCurrency: 'usd' }],
      medias: imageUrls,
      metadata: {
        stock,
        featured
      }
    });

    console.log('✅ تم إنشاء المنتج في Polar بنجاح');
    console.log('📊 إحصائيات المنتج في Polar:', {
      id: polarProduct.id,
      name: polarProduct.name,
      price: (polarProduct.prices && polarProduct.prices.length > 0 && (polarProduct.prices[0] as any).amount) ? (polarProduct.prices[0] as any).amount : 0,
      mediasCount: polarProduct.medias.length,
      firstImageUrl: polarProduct.medias[0]
    });

    return NextResponse.json({
      message: getSuccessMessage('PRODUCT_ADDED', 'ar'),
      product: {
        _id: polarProduct.id,
        name: polarProduct.name,
        description: polarProduct.description,
        price: (polarProduct.prices && polarProduct.prices.length > 0 && (polarProduct.prices[0] as any).amount) ? ((polarProduct.prices[0] as any).amount / 100) : 0,
        stock,
        featured,
        images: polarProduct.medias,
        createdAt: polarProduct.createdAt
      },
      success: true
    });

  } catch (error: any) {
    console.error('❌ خطأ عام في إضافة المنتج:', error);
    const status = error.message?.includes('صلاحيات') || error.message?.includes('ليس لديك صلاحية') ? 403 : 500;
    return NextResponse.json(
      {
        error: getErrorMessage('SERVER_ERROR', 'ar'),
        code: 'SERVER_ERROR',
        details: getErrorDetails('SERVER_ERROR', 'ar')
      },
      { status }
    );
  }
}

// الحصول على جميع المنتجات
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateAdmin(request); // تحقق قوي من الأدمن

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    console.log('🔍 API Request Debug:', {
      page,
      limit,
      search,
      url: request.url
    });

    const skip = (page - 1) * limit;

    // Fetch from Polar
    const polarProducts = await polar.products.list({ limit: 100 }); // fetch more for pagination
    const products = [];
    for await (const p of polarProducts) {
      products.push(p);
    }

    let mappedProducts = products.map((p: any) => ({
      _id: p.id,
      name: p.name,
      description: p.description,
      price: (p.prices && p.prices.length > 0 && (p.prices[0] as any).amount) ? ((p.prices[0] as any).amount / 100) : 0,
      stock: p.metadata?.stock || 0,
      featured: p.metadata?.featured || false,
      images: p.medias,
      createdAt: p.createdAt
    }));

    // Apply search filter
    if (search && search.trim()) {
      mappedProducts = mappedProducts.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    if (searchParams.get('status') === 'available') {
      mappedProducts = mappedProducts.filter((p: any) => (p.metadata?.stock || 0) > 0);
    } else if (searchParams.get('status') === 'unavailable') {
      mappedProducts = mappedProducts.filter((p: any) => (p.metadata?.stock || 0) <= 0);
    }

    // Apply price range filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      mappedProducts = mappedProducts.filter((p: any) => {
        const price = (p.prices && p.prices.length > 0 && (p.prices[0] as any).amount) ? ((p.prices[0] as any).amount / 100) : 0;
        const min = parseFloat(minPrice || '0');
        const max = parseFloat(maxPrice || 'Infinity');

        return price >= min && price <= max;
      });
    }

    // Pagination
    const total = mappedProducts.length;
    mappedProducts = mappedProducts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);

    // Calculate stats from mappedProducts array
    const stats = {
      totalProducts: total,
      availableProducts: mappedProducts.filter((p: any) => (p.metadata?.stock || 0) > 0).length,
      outOfStockProducts: mappedProducts.filter((p: any) => (p.metadata?.stock || 0) <= 0).length,
      featuredProducts: mappedProducts.filter((p: any) => (p.metadata?.featured || false)).length,
    };

    console.log('🔍 Database results:', {
      productsFound: mappedProducts.length,
      totalProducts: total,
      skip,
      limit,
      hasNext: (page * limit) < total,
      hasPrev: page > 1,
      stats,
    });

    return NextResponse.json({
      products: mappedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      statistics: {
        totalProducts: stats.totalProducts,
        availableProducts: stats.availableProducts,
        outOfStockProducts: stats.outOfStockProducts,
        featuredProducts: stats.featuredProducts,
      },
    });

  } catch (error: any) {
    console.error('خطأ في جلب المنتجات:', error);
    const status = error.message?.includes('صلاحيات') ? 403 : 500;
    return NextResponse.json(
      {
        error: getErrorMessage('SERVER_ERROR', 'ar'),
        code: 'SERVER_ERROR',
        details: getErrorDetails('SERVER_ERROR', 'ar')
      },
      { status }
    );
  }
}
