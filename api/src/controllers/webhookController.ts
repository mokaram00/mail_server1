import { Request, Response } from 'express';
import crypto from 'crypto';

export const polarWebhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = JSON.stringify(req.body);
    const signature = req.headers['polar-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'No signature' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET || '')
      .update(body, 'utf8')
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

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

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook error' });
  }
};