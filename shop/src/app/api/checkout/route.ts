import { NextRequest, NextResponse } from 'next/server';
import { Polar } from "@polar-sh/sdk";


const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  });
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Create checkout in Polar
    const checkout = await polar.checkouts.create({
      products: items.map((item: any) => item._id),
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        items: JSON.stringify(items)
      }
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Error creating checkout' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'No session_id' }, { status: 400 });
  }

  try {
    const checkout = await polar.checkouts.get({ id: sessionId });

    // Parse items from metadata
    const items = JSON.parse(String(checkout.metadata.items) || '[]');

    // Map to order format
    const order = {
      _id: checkout.id,
      status: checkout.status,
      paymentStatus: checkout.status,
      paymentMethod: 'polar',
      totalAmount: checkout.totalAmount / 100,
      items: items.map((item: any) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error getting checkout:', error);
    return NextResponse.json({ error: 'Error getting order' }, { status: 500 });
  }
}