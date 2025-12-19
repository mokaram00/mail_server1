import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { supabase, supabaseAdmin } from '@/lib/supabase-auth';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Legacy JWT functions for backward compatibility
export function signToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Supabase token handling functions
export function getSupabaseTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authenticateUserWithSupabase(request: NextRequest) {
  const token = getSupabaseTokenFromRequest(request);
  if (!token) {
    throw new Error('رمز الدخول مطلوب');
  }

  // Verify token with Supabase (you can add token verification logic here)
  // For now, we'll assume the token is valid if it exists
  // In production, you should verify the token with Supabase

  return {
    token,
    // You can decode and return user info from the token if needed
  };
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try Supabase token first, then fallback to JWT
  return getSupabaseTokenFromRequest(request);
}

export async function authenticateUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new Error('رمز الدخول مطلوب');
  }

  // For Supabase tokens, we can't easily decode them without verification
  // In a real implementation, you'd verify the token with Supabase
  return {
    token,
    // Return minimal info for middleware purposes
  };
}

export async function authenticateAdmin(request: NextRequest) {
  const token = getSupabaseTokenFromRequest(request);
  if (!token) {
    throw new Error('رمز الدخول مطلوب');
  }

  try {
    // التحقق من التوكن مع Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('رمز الدخول غير صالح');
    }

    // الاتصال بقاعدة البيانات والحصول على معلومات المستخدم
    await connectDB();
    const dbUser = await User.findOne({ supabaseId: user.id });

    if (!dbUser) {
      throw new Error('المستخدم غير موجود في قاعدة البيانات');
    }

    if (dbUser.role !== 'admin') {
      throw new Error('ليس لديك صلاحية أدمن');
    }

    return {
      user: dbUser,
      token,
      supabaseUser: user
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('فشل في التحقق من الهوية');
  }
}
