import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { AuthService } from '@/lib/supabase-auth';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {

    const { email, password, fullName, phone, address, language } = await request.json();
    const userLanguage = language || 'ar'; // استخدام اللغة المرسلة أو العربية كافتراضية

    // التحقق من البيانات المطلوبة
    if (!email || !password || !fullName) {
      return NextResponse.json(
        {
          error: getErrorMessage('MISSING_REQUIRED_FIELDS', userLanguage),
          code: 'MISSING_REQUIRED_FIELDS',
          details: getErrorDetails('MISSING_REQUIRED_FIELDS', userLanguage)
        },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: getErrorMessage('INVALID_EMAIL_FORMAT', userLanguage),
          code: 'INVALID_EMAIL_FORMAT',
          details: getErrorDetails('INVALID_EMAIL_FORMAT', userLanguage)
        },
        { status: 400 }
      );
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: getErrorMessage('WEAK_PASSWORD', userLanguage),
          code: 'WEAK_PASSWORD',
          details: getErrorDetails('WEAK_PASSWORD', userLanguage)
        },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم مسبقاً في Supabase
    try {
      // محاولة إنشاء المستخدم في Supabase أولاً
      const { supabaseUser, mongoUser } = await AuthService.createUserWithSupabase(
        email.toLowerCase(),
        password,
        fullName
      );

      // إضافة البيانات الإضافية في MongoDB
      const updatedUser = await User.findOneAndUpdate(
        { supabaseId: supabaseUser.id },
        {
          phone,
          address,
          preferences: {
            language: userLanguage,
            currency: 'SAR',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          }
        },
        { new: true }
      );

      return NextResponse.json({
        message: getSuccessMessage('REGISTER_SUCCESS', userLanguage),
        user: {
          id: updatedUser?._id || mongoUser._id,
          supabaseId: supabaseUser.id,
          email: supabaseUser.email,
          fullName: supabaseUser.user_metadata?.full_name || fullName,
          role: 'customer',
          emailVerified: supabaseUser.email_confirmed_at ? true : false,
        },
        success: true
      });

    } catch (supabaseError: any) {
      console.error('Supabase auth error:', supabaseError);

      // رسائل خطأ محددة حسب نوع الخطأ من Supabase
      let errorMessage = getErrorMessage('SUPABASE_ERROR', userLanguage);
      let errorCode = 'SUPABASE_ERROR';

      // التحقق من كود الخطأ أولاً (الطريقة الصحيحة لـ Supabase)
      if (supabaseError.code) {
        errorMessage = getErrorMessage(supabaseError.code, userLanguage);
        errorCode = supabaseError.code;
      }
      // التحقق من الرسالة كنسخة احتياطية
      else if (supabaseError.message?.includes('already registered') || supabaseError.message?.includes('email_exists')) {
        errorMessage = getErrorMessage('email_exists', userLanguage);
        errorCode = 'email_exists';
      } else if (supabaseError.message?.includes('Password should be') || supabaseError.message?.includes('weak password')) {
        errorMessage = getErrorMessage('WEAK_PASSWORD_SUPABASE', userLanguage);
        errorCode = 'WEAK_PASSWORD_SUPABASE';
      } else if (supabaseError.message?.includes('Invalid email')) {
        errorMessage = getErrorMessage('email_address_invalid', userLanguage);
        errorCode = 'email_address_invalid';
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
          details: getErrorDetails(errorCode, userLanguage)
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('خطأ في إنشاء الحساب:', error);
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
