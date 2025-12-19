import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a client-side Supabase client for sign out
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: getErrorMessage('TOKEN_REQUIRED', 'en'),
          code: 'TOKEN_REQUIRED',
          details: getErrorDetails('TOKEN_REQUIRED', 'en')
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(' ')[1];

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        {
          error: getErrorMessage('SIGNOUT_FAILED', 'en'),
          code: 'SIGNOUT_FAILED',
          details: getErrorDetails('SIGNOUT_FAILED', 'en')
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: getSuccessMessage('LOGOUT_SUCCESS', 'en'),
      success: true
    });

  } catch (error: any) {
    console.error('Error signing out:', error);
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