import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('polar-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET!)
      .update(body, 'utf8')
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    console.log('Polar webhook event:', event.type, event.data);

    // Handle different event types
    switch (event.type) {
      case 'checkout.completed':
        // Handle checkout completed
        console.log('Checkout completed:', event.data.id);
        break;
      case 'checkout.canceled':
        // Handle checkout canceled
        console.log('Checkout canceled:', event.data.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}