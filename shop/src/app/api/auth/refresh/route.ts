import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a client-side Supabase client for token refresh
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: getErrorMessage('REFRESH_TOKEN_REQUIRED', 'en'),
          code: 'REFRESH_TOKEN_REQUIRED',
          details: getErrorDetails('REFRESH_TOKEN_REQUIRED', 'en')
        },
        { status: 400 }
      );
    }

    // Refresh the session using Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          error: getErrorMessage('REFRESH_TOKEN_INVALID', 'en'),
          code: 'REFRESH_TOKEN_INVALID',
          details: getErrorDetails('REFRESH_TOKEN_INVALID', 'en')
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: getSuccessMessage('REFRESH_SUCCESS', 'en'),
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      success: true
    });

  } catch (error: any) {
    console.error('Error refreshing token:', error);
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