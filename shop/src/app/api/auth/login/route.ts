import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { AuthService } from '@/lib/supabase-auth';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, language } = await request.json();
    const userLanguage = language || 'ar'; // استخدام اللغة المرسلة أو العربية كافتراضية

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return NextResponse.json(
        {
          error: getErrorMessage('MISSING_REQUIRED_FIELDS', userLanguage),
          code: 'MISSING_REQUIRED_FIELDS',
          details: getErrorDetails('MISSING_REQUIRED_FIELDS', userLanguage)
        },
        { status: 400 }
      );
    }

    // تسجيل الدخول عبر Supabase أولاً
    try {
      const { user: supabaseUser, session } = await AuthService.signInWithSupabase(
        email.toLowerCase(),
        password
      );

      if (!supabaseUser) {
        return NextResponse.json(
          {
            error: getErrorMessage('invalid_credentials', userLanguage),
            code: 'INVALID_CREDENTIALS',
            details: getErrorDetails('invalid_credentials', userLanguage)
          },
          { status: 401 }
        );
      }

      // مزامنة البيانات مع MongoDB
      let mongoUser = await User.findOne({ supabaseId: supabaseUser.id });

      if (!mongoUser) {
        // إنشاء سجل جديد في MongoDB إذا لم يكن موجوداً
        mongoUser = new User({
          supabaseId: supabaseUser.id,
          email: supabaseUser.email,
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email,
          emailVerified: supabaseUser.email_confirmed_at ? true : false,
          role: 'customer',
          preferences: {
            language: userLanguage,
            currency: 'SAR',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          },
        });
        await mongoUser.save();
      } else {
        // تحقق من حالة الحساب
        if (!mongoUser.isActive) {
          return NextResponse.json(
            {
              error: getErrorMessage('ACCOUNT_INACTIVE', userLanguage),
              code: 'ACCOUNT_INACTIVE',
              details: getErrorDetails('ACCOUNT_INACTIVE', userLanguage)
            },
            { status: 403 }
          );
        }

        // تحديث وقت آخر دخول
        await mongoUser.updateLastLogin();
      }

      // التأكد من وجود المستخدم والـ ID
      if (!mongoUser || !mongoUser._id) {
        throw new Error('فشل في إنشاء أو العثور على المستخدم');
      }

      return NextResponse.json({
        message: getSuccessMessage('LOGIN_SUCCESS', userLanguage),
        user: {
          id: mongoUser._id,
          supabaseId: supabaseUser.id,
          email: supabaseUser.email,
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email,
          role: mongoUser.role,
          emailVerified: supabaseUser.email_confirmed_at ? true : false,
        },
        // Return Supabase tokens instead of custom JWT
        access_token: session?.access_token,
        refresh_token: session?.refresh_token,
        success: true
      });

    } catch (supabaseError: any) {
      console.error('Supabase auth error:', supabaseError);

      // محاولة تسجيل الدخول بالطريقة التقليدية إذا فشل Supabase
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json(
          {
            error: getErrorMessage('user_not_found', userLanguage),
            code: 'USER_NOT_FOUND',
            details: getErrorDetails('invalid_credentials', userLanguage)
          },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            error: getErrorMessage('ACCOUNT_INACTIVE', userLanguage),
            code: 'ACCOUNT_INACTIVE',
            details: getErrorDetails('ACCOUNT_INACTIVE', userLanguage)
          },
          { status: 403 }
        );
      }

      // التحقق من كلمة المرور (للحسابات الموجودة سابقاً)
      if (!user.password) {
        return NextResponse.json(
          {
            error: getErrorMessage('PASSWORD_NOT_AVAILABLE', userLanguage),
            code: 'PASSWORD_NOT_AVAILABLE',
            details: getErrorDetails('PASSWORD_NOT_AVAILABLE', userLanguage)
          },
          { status: 401 }
        );
      }

      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            error: getErrorMessage('invalid_credentials', userLanguage),
            code: 'INVALID_CREDENTIALS',
            details: getErrorDetails('invalid_credentials', userLanguage)
          },
          { status: 401 }
        );
      }

      // تحديث وقت آخر دخول
      await user.updateLastLogin();

      return NextResponse.json({
        message: getSuccessMessage('LOGIN_SUCCESS', userLanguage),
        user: {
          id: user._id,
          supabaseId: user.supabaseId,
          email: user.email,
          fullName: user.fullName || user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        // For legacy accounts, we can't provide Supabase tokens
        // Users should migrate to Supabase authentication
        legacy_account: true,
        success: true
      });
    }

  } catch (error: any) {
    console.error('خطأ في تسجيل الدخول:', error);
    const { language } = await request.json().catch(() => ({ language: 'ar' }));
    const errorLanguage = language || 'ar';
    return NextResponse.json(
      {
        error: getErrorMessage('SERVER_ERROR', errorLanguage),
        code: 'SERVER_ERROR',
        details: getErrorDetails('SERVER_ERROR', errorLanguage)
      },
      { status: 500 }
    );
  }
}
