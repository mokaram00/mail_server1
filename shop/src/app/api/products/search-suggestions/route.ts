import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { getErrorMessage, getErrorDetails } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Find products that match the search query
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name description')
    .limit(10)
    .lean();

    // Extract unique suggestions from product names and descriptions
    const suggestions = new Set<string>();

    products.forEach((product: any) => {
      // Add product name as suggestion
      suggestions.add(product.name);

      // Add individual words from description as suggestions
      if (product.description) {
        const words = product.description
          .split(' ')
          .filter((word: string) => word.length > 2 && word.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3); // Limit to 3 words per product

        words.forEach((word: string) => suggestions.add(word));
      }
    });

    return NextResponse.json(Array.from(suggestions).slice(0, 5));
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
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
