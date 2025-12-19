import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { getErrorMessage, getErrorDetails } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connectDB();

    // Convert URL-encoded name back to original format
    const productName = decodeURIComponent(params.name).replace(/-/g, ' ');

    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${productName}$`, 'i') }
    }).populate('category');

    if (!product) {
      return NextResponse.json(
        {
          error: getErrorMessage('PRODUCT_NOT_FOUND', 'en'),
          code: 'PRODUCT_NOT_FOUND',
          details: getErrorDetails('PRODUCT_NOT_FOUND', 'en')
        },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product by name:', error);
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
