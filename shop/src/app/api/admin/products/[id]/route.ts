import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-auth';
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
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

// تحديث منتج - ملاحظة: Polar API يسمح فقط بتحديث metadata (stock, featured)
// المعلومات الأساسية (name, description, price) والصور محفوظة في قاعدة البيانات المحلية
export async function patch(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAdmin(request);

    const { id } = params;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stockValue = formData.get('stock') as string;
    const stock = stockValue ? parseInt(stockValue) : 0;
    const featured = formData.get('featured') === 'on';

    // التحقق من البيانات المطلوبة (المعلومات الأساسية لا يمكن تحديثها عبر Polar API)
    if (stockValue === null || stockValue === undefined || stockValue === '') {
      return NextResponse.json(
        { CODE: 'STOCK_REQUIRED' },
        { status: 400 }
      );
    }

    // Get current product from Polar
    let currentProduct;
    try {
      currentProduct = await polar.products.get({ id });
    } catch (error) {
      return NextResponse.json(
        { CODE: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }


    // رفع الصور الجديدة على Supabase Storage إذا تم اختيار صور جديدة
    const imageFiles = formData.getAll('images') as File[];
    let updatedImages = currentProduct.medias.map((m: any) => (m as any).url); // الاحتفاظ بالصور الموجودة

    if (imageFiles.length > 0) {
      console.log(`📸 تم العثور على ${imageFiles.length} صورة جديدة للرفع`);

      // رفع الصور الجديدة على Supabase
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (file instanceof File && file.type.startsWith('image/')) {
          try {
            console.log(`📤 رفع الصورة الجديدة ${i + 1}/${imageFiles.length}: ${file.name}`);
            const uploadedImage = await uploadImageToSupabase(file, id);
            updatedImages.push(uploadedImage.url); // إضافة مسار الصورة الجديدة
            console.log(`✅ تم رفع الصورة الجديدة ${i + 1} بنجاح`);
          } catch (error) {
            console.error(`❌ فشل في رفع الصورة الجديدة ${file.name}:`, error);
            return NextResponse.json(
              { CODE: 'IMAGE_UPLOAD_FAILED' },
              { status: 500 }
            );
          }
        }
      }
    }

    // Update product in Polar (only metadata can be updated via API)
    const updatedPolarProduct = await polar.products.update({
      id,
      productUpdate: {
        metadata: {
          stock,
          featured
        }
      }
    });

    console.log('✅ تم تحديث metadata المنتج في Polar بنجاح');
    console.log('📊 إحصائيات المنتج المحدث:', {
      id: updatedPolarProduct.id,
      name: updatedPolarProduct.name,
      stock: stock,
      featured: featured,
      imagesCount: updatedPolarProduct.medias.length,
      newImagesCount: imageFiles.length
    });

    return NextResponse.json({
      message: 'تم تحديث معلومات المنتج بنجاح (المعلومات الأساسية والصور محفوظة في قاعدة البيانات المحلية)',
      product: {
        _id: updatedPolarProduct.id,
        name: updatedPolarProduct.name,
        description: updatedPolarProduct.description,
        price: (updatedPolarProduct.prices[0] as any).amount / 100,
        stock,
        featured,
        images: updatedPolarProduct.medias,
        createdAt: updatedPolarProduct.createdAt
      },
    });

  } catch (error: any) {
    console.error('خطأ في تحديث المنتج:', error);
    return NextResponse.json(
      { CODE: 'SERVER_ERROR' },
      { status: error.message?.includes('صلاحيات') || error.message?.includes('ليس لديك صلاحية') ? 403 : 500 }
    );
  }
}
