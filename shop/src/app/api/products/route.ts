import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage, getErrorDetails } from '@/lib/errors';

// GET - جلب المنتجات
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // بناء فلتر البحث
    let filter: any = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // إضافة فلتر للمنتجات المتوفرة فقط
    filter.stock = { $gt: 0 };

    const products = await find(filter)
      .populate('category', 'name')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await countDocuments(filter);

    return NextResponse.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('خطأ في جلب المنتجات:', error);
    return NextResponse.json(
      {
        error: getErrorMessage('SERVER_ERROR', 'en'),
        code: 'SERVER_ERROR',
        details: getErrorDetails('SERVER_ERROR', 'en')
      },
      { status: 500 }
    );
  }
}

// POST - إنشاء منتج جديد (تم نقله إلى /api/admin/products)
export async function POST(request: NextRequest) {
  // تم نقل هذه الوظيفة إلى /api/admin/products
  return NextResponse.json(
    {
      error: getErrorMessage('USE_ADMIN_ENDPOINT', 'en'),
      code: 'USE_ADMIN_ENDPOINT',
      details: getErrorDetails('USE_ADMIN_ENDPOINT', 'en')
    },
    { status: 404 }
  );
}
