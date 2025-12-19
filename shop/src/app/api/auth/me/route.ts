import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { supabase } from '@/lib/supabase-auth';
import { getErrorMessage, getErrorDetails } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get Supabase token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: getErrorMessage('TOKEN_REQUIRED', 'ar'),
          code: 'TOKEN_REQUIRED',
          details: getErrorDetails('TOKEN_REQUIRED', 'ar')
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(' ')[1];

    // Verify token with Supabase and get user info
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

    if (error || !supabaseUser) {
      return NextResponse.json(
        {
          error: getErrorMessage('INVALID_TOKEN', 'ar'),
          code: 'INVALID_TOKEN',
          details: getErrorDetails('INVALID_TOKEN', 'ar')
        },
        { status: 401 }
      );
    }

    // Get user from MongoDB using Supabase ID
    const user = await User.findOne({ supabaseId: supabaseUser.id });
    if (!user) {
      return NextResponse.json(
        {
          error: getErrorMessage('USER_NOT_FOUND_DB', 'ar'),
          code: 'USER_NOT_FOUND_DB',
          details: getErrorDetails('USER_NOT_FOUND_DB', 'ar')
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        supabaseId: user.supabaseId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        createdAt: user.createdAt,
        fullName: user.fullName,
      },
    });

  } catch (error: any) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return NextResponse.json(
      {
        error: getErrorMessage('SERVER_ERROR', 'ar'),
        code: 'SERVER_ERROR',
        details: getErrorDetails('SERVER_ERROR', 'ar')
      },
      { status: 500 }
    );
  }
}
