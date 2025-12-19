import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const accessToken = authHeader.split(' ')[1];

    // Verify token with Supabase and get user info
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

    if (error || !supabaseUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user from MongoDB using Supabase ID
    const { User } = await import('@/models/User');
    const user = await User.findOne({ supabaseId: supabaseUser.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch order and verify ownership
    const order = await Order.findById(params.id).populate('items.product');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order
    if (order.user && order.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}