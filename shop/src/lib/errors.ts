// error-codes/authErrors.ts

export const AUTH_ERRORS = {
    // Validation errors (local)
    MISSING_REQUIRED_FIELDS: {
      ar: 'جميع الحقول مطلوبة',
      en: 'All fields are required'
    },
    INVALID_EMAIL_FORMAT: {
      ar: 'البريد الإلكتروني غير صالح',
      en: 'Invalid email address format'
    },
    WEAK_PASSWORD: {
      ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      en: 'Password must be at least 6 characters long'
    },
    WEAK_PASSWORD_SUPABASE: {
      ar: 'كلمة المرور ضعيفة جداً، يرجى استخدام كلمة مرور أقوى',
      en: 'Password is too weak, please use a stronger password'
    },
    PASSWORDS_DONT_MATCH: {
      ar: 'كلمات المرور غير متطابقة',
      en: 'Passwords do not match'
    },
  
    // Supabase Auth error codes
    email_address_invalid: {
      ar: 'البريد الإلكتروني غير صالح',
      en: 'Invalid email address'
    },
    email_address_not_authorized: {
      ar: 'البريد الإلكتروني غير مصرح له',
      en: 'Email is not authorized'
    },
    email_exists: {
      ar: 'هذا البريد الإلكتروني مستخدم مسبقاً',
      en: 'This email already exists'
    },
    invalid_credentials: {
      ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      en: 'Invalid email or password'
    },
    email_not_confirmed: {
      ar: 'البريد الإلكتروني لم يُؤكَّد بعد',
      en: 'Email not confirmed'
    },
    signup_disabled: {
      ar: 'تسجيل الحسابات معطّل حالياً',
      en: 'Sign ups are currently disabled'
    },
    user_not_found: {
      ar: 'المستخدم غير موجود',
      en: 'User not found'
    },
    invalid_login_credentials: {
      ar: 'بيانات الدخول غير صحيحة',
      en: 'Invalid login credentials'
    },
    // … يمكنك إضافة أكواد أخرى من الوثائق حسب الحاجة
  
    // Account status errors
    ACCOUNT_INACTIVE: {
      ar: 'الحساب غير نشط',
      en: 'Account is inactive'
    },
    PASSWORD_NOT_AVAILABLE: {
      ar: 'كلمة المرور غير متوفرة لهذا الحساب',
      en: 'Password not available for this account'
    },

    // General / Server errors
    SERVER_ERROR: {
      ar: 'حدث خطأ في الخادم الداخلي',
      en: 'Internal server error occurred'
    },
    NETWORK_ERROR: {
      ar: 'حدث خطأ في الشبكة',
      en: 'Network error occurred'
    },
    SUPABASE_ERROR: {
      ar: 'فشل في إنشاء الحساب أو هناك مشكلة في الخادم.',
      en: 'Failed to create account or there is a server issue.'
    },
    TOKEN_REQUIRED: {
      ar: 'رمز الدخول مطلوب',
      en: 'Access token is required'
    },
    INVALID_TOKEN: {
      ar: 'رمز الدخول غير صالح',
      en: 'Invalid access token'
    },
    USER_NOT_FOUND_DB: {
      ar: 'المستخدم غير موجود في قاعدة البيانات',
      en: 'User not found in database'
    },
    REFRESH_TOKEN_REQUIRED: {
      ar: 'رمز التحديث مطلوب',
      en: 'Refresh token is required'
    },
    REFRESH_TOKEN_INVALID: {
      ar: 'رمز التحديث غير صالح أو منتهي الصلاحية',
      en: 'Refresh token is invalid or expired'
    },
    SIGNOUT_FAILED: {
      ar: 'فشل في تسجيل الخروج',
      en: 'Failed to sign out'
    },
    ALL_FIELDS_REQUIRED: {
      ar: 'جميع الحقول مطلوبة',
      en: 'All fields are required'
    },
    NO_IMAGES_SELECTED: {
      ar: 'يجب اختيار صورة واحدة على الأقل',
      en: 'At least one image must be selected'
    },
    IMAGE_UPLOAD_FAILED: {
      ar: 'فشل في رفع الصورة',
      en: 'Failed to upload image'
    },
    CATEGORY_NOT_FOUND: {
      ar: 'الفئة غير موجودة',
      en: 'Category not found'
    },
    PRODUCT_NOT_FOUND: {
      ar: 'المنتج غير موجود',
      en: 'Product not found'
    },
    NAME_REQUIRED: {
      ar: 'اسم الفئة مطلوب',
      en: 'Category name is required'
    },
    DESCRIPTION_REQUIRED: {
      ar: 'وصف الفئة مطلوب',
      en: 'Category description is required'
    },
    NAME_LENGTH_INVALID: {
      ar: 'اسم الفئة يجب أن يكون بين 2 و 100 حرف',
      en: 'Category name must be between 2 and 100 characters'
    },
    DESCRIPTION_LENGTH_INVALID: {
      ar: 'وصف الفئة يجب أن يكون بين 10 و 500 حرف',
      en: 'Category description must be between 10 and 500 characters'
    },
    CATEGORY_EXISTS: {
      ar: 'الفئة موجودة مسبقاً',
      en: 'Category already exists'
    },
    CATEGORY_HAS_PRODUCTS: {
      ar: 'لا يمكن حذف الفئة لأنها تحتوي على منتجات',
      en: 'Cannot delete category because it has associated products'
    },
    COUPON_EXISTS: {
      ar: 'الكوبون موجود مسبقاً',
      en: 'Coupon already exists'
    },
    COUPON_VALIDATION_ERROR: {
      ar: 'خطأ في بيانات الكوبون',
      en: 'Coupon validation error'
    },
    PERMISSION_DENIED: {
      ar: 'ليس لديك صلاحية للوصول إلى هذا المحتوى',
      en: 'Permission denied'
    },
    COUPON_NOT_FOUND: {
      ar: 'الكوبون غير موجود',
      en: 'Coupon not found'
    },
    COUPON_IN_USE: {
      ar: 'لا يمكن حذف الكوبون لأنه مستخدم في طلبات سابقة',
      en: 'Cannot delete coupon because it has been used in previous orders'
    },
    USE_ADMIN_ENDPOINT: {
      ar: 'استخدم /api/admin/products لإنشاء المنتجات',
      en: 'Use /api/admin/products to create products'
    },
    EMPTY_CART: {
      ar: 'سلة التسوق فارغة',
      en: 'Shopping cart is empty'
    },
    WEBHOOK_VERIFICATION_FAILED: {
      ar: 'فشل في التحقق من صحة webhook',
      en: 'Webhook verification failed'
    }
  } as const;
  
  export type AuthErrorCode = keyof typeof AUTH_ERRORS;
  
  export function getErrorMessage(
    errorCode: string,
    language: 'ar' | 'en' = 'ar'
  ): string {
    if (errorCode in AUTH_ERRORS) {
      return AUTH_ERRORS[errorCode as AuthErrorCode][language];
    }
    // fallback: رسالة عامة
    return AUTH_ERRORS.SERVER_ERROR[language];
  }
  
  export function getErrorDetails(
    errorCode: string,
    language: 'ar' | 'en' = 'ar'
  ): string {
    const details: Partial<Record<AuthErrorCode, { ar: string; en: string }>> = {
      MISSING_REQUIRED_FIELDS: {
        ar: 'تأكد من إدخال جميع البيانات المطلوبة',
        en: 'Please make sure to fill in all required fields'
      },
      INVALID_EMAIL_FORMAT: {
        ar: 'تأكد من صحة البريد الإلكتروني المدخل',
        en: 'Please check your email address format'
      },
      WEAK_PASSWORD: {
        ar: 'استخدم كلمة مرور أقوى تحتوي على أرقام وحروف',
        en: 'Please use a stronger password with numbers and letters'
      },
      WEAK_PASSWORD_SUPABASE: {
        ar: 'استخدم كلمة مرور أقوى تحتوي على أرقام وحروف ورموز',
        en: 'Please use a stronger password with numbers, letters, and symbols'
      },
      email_exists: {
        ar: 'جرب تسجيل الدخول أو استخدم بريد إلكتروني آخر',
        en: 'Try signing in or use a different email address'
      },
      invalid_credentials: {
        ar: 'تأكد من صحة البيانات المدخلة',
        en: 'Please check your login credentials'
      },
      ACCOUNT_INACTIVE: {
        ar: 'يرجى التواصل مع الدعم الفني لتفعيل الحساب',
        en: 'Please contact support to activate your account'
      },
      PASSWORD_NOT_AVAILABLE: {
        ar: 'هذا الحساب يستخدم نظام مصادقة مختلف',
        en: 'This account uses a different authentication system'
      },
      SERVER_ERROR: {
        ar: 'يرجى المحاولة مرة أخرى لاحقاً',
        en: 'Please try again later'
      },
      TOKEN_REQUIRED: {
        ar: 'يجب تقديم رمز الدخول في رأس الطلب',
        en: 'Access token must be provided in the request header'
      },
      INVALID_TOKEN: {
        ar: 'رمز الدخول منتهي الصلاحية أو غير صحيح',
        en: 'Access token is expired or invalid'
      },
      USER_NOT_FOUND_DB: {
        ar: 'لم يتم العثور على بيانات المستخدم',
        en: 'User data not found'
      },
      REFRESH_TOKEN_REQUIRED: {
        ar: 'يجب تقديم رمز التحديث في الطلب',
        en: 'Refresh token must be provided in the request'
      },
      REFRESH_TOKEN_INVALID: {
        ar: 'رمز التحديث منتهي الصلاحية، يرجى تسجيل الدخول مرة أخرى',
        en: 'Refresh token is expired, please sign in again'
      },
      SIGNOUT_FAILED: {
        ar: 'حدث خطأ أثناء تسجيل الخروج، يرجى المحاولة مرة أخرى',
        en: 'Error occurred during sign out, please try again'
      },
      ALL_FIELDS_REQUIRED: {
        ar: 'تأكد من إدخال جميع البيانات المطلوبة',
        en: 'Please make sure to fill in all required fields'
      },
      NO_IMAGES_SELECTED: {
        ar: 'يجب اختيار صورة واحدة على الأقل للمنتج',
        en: 'You must select at least one image for the product'
      },
      IMAGE_UPLOAD_FAILED: {
        ar: 'حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى',
        en: 'Error occurred while uploading image, please try again'
      },
      CATEGORY_NOT_FOUND: {
        ar: 'الفئة المحددة غير موجودة في النظام',
        en: 'The selected category does not exist in the system'
      },
      PRODUCT_NOT_FOUND: {
        ar: 'المنتج المطلوب غير موجود',
        en: 'The requested product does not exist'
      },
      NAME_REQUIRED: {
        ar: 'يجب إدخال اسم الفئة',
        en: 'Category name must be provided'
      },
      DESCRIPTION_REQUIRED: {
        ar: 'يجب إدخال وصف الفئة',
        en: 'Category description must be provided'
      },
      NAME_LENGTH_INVALID: {
        ar: 'اسم الفئة يجب أن يكون بين 2 و 100 حرف',
        en: 'Category name must be between 2 and 100 characters'
      },
      DESCRIPTION_LENGTH_INVALID: {
        ar: 'وصف الفئة يجب أن يكون بين 10 و 500 حرف',
        en: 'Category description must be between 10 and 500 characters'
      },
      CATEGORY_EXISTS: {
        ar: 'هذا الاسم مستخدم لفئة أخرى، يرجى اختيار اسم مختلف',
        en: 'This name is already used by another category, please choose a different name'
      },
      CATEGORY_HAS_PRODUCTS: {
        ar: 'يجب حذف أو نقل جميع المنتجات المرتبطة بهذه الفئة أولاً',
        en: 'You must delete or move all products associated with this category first'
      },
      COUPON_EXISTS: {
        ar: 'هذا الرمز مستخدم لكوبون آخر، يرجى اختيار رمز مختلف',
        en: 'This code is already used by another coupon, please choose a different code'
      },
      COUPON_VALIDATION_ERROR: {
        ar: 'يرجى التحقق من صحة البيانات المدخلة للكوبون',
        en: 'Please check the validity of the coupon data entered'
      },
      PERMISSION_DENIED: {
        ar: 'يرجى تسجيل الدخول كمدير للوصول إلى هذا المحتوى',
        en: 'Please sign in as an admin to access this content'
      },
      COUPON_NOT_FOUND: {
        ar: 'الكوبون المطلوب غير موجود في النظام',
        en: 'The requested coupon does not exist in the system'
      },
      COUPON_IN_USE: {
        ar: 'يجب إلغاء جميع الاستخدامات السابقة للكوبون أولاً',
        en: 'You must cancel all previous uses of the coupon first'
      },
      USE_ADMIN_ENDPOINT: {
        ar: 'هذا المسار مخصص للعرض فقط، استخدم لوحة الإدارة لإنشاء المنتجات',
        en: 'This endpoint is for viewing only, use the admin panel to create products'
      },
      EMPTY_CART: {
        ar: 'يجب إضافة منتجات إلى سلة التسوق قبل المتابعة للدفع',
        en: 'You must add products to your cart before proceeding to checkout'
      },
      WEBHOOK_VERIFICATION_FAILED: {
        ar: 'فشل في التحقق من صحة البيانات المرسلة من Stripe',
        en: 'Failed to verify the data sent from Stripe'
      }
    };
  
    return details[errorCode as AuthErrorCode]?.[language] ?? '';
}

// Success messages utility
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: {
    ar: 'تم تسجيل الدخول بنجاح',
    en: 'Login successful'
  },
  REGISTER_SUCCESS: {
    ar: 'تم إنشاء الحساب بنجاح',
    en: 'Account created successfully'
  },
  LOGOUT_SUCCESS: {
    ar: 'تم تسجيل الخروج بنجاح',
    en: 'Logout successful'
  },
  REFRESH_SUCCESS: {
    ar: 'تم تحديث الجلسة بنجاح',
    en: 'Session refreshed successfully'
  },
  PRODUCT_ADDED: {
    ar: 'تم إضافة المنتج بنجاح',
    en: 'Product added successfully'
  },
  CATEGORY_ADDED: {
    ar: 'تم إضافة الفئة بنجاح',
    en: 'Category added successfully'
  },
  CATEGORY_UPDATED: {
    ar: 'تم تحديث الفئة بنجاح',
    en: 'Category updated successfully'
  },
  CATEGORY_DELETED: {
    ar: 'تم حذف الفئة بنجاح',
    en: 'Category deleted successfully'
  },
  COUPON_ADDED: {
    ar: 'تم إضافة الكوبون بنجاح',
    en: 'Coupon added successfully'
  },
  COUPON_UPDATED: {
    ar: 'تم تعديل الكوبون بنجاح',
    en: 'Coupon updated successfully'
  },
  COUPON_DELETED: {
    ar: 'تم حذف الكوبون بنجاح',
    en: 'Coupon deleted successfully'
  }
} as const;

export type SuccessMessageCode = keyof typeof SUCCESS_MESSAGES;

export function getSuccessMessage(
  successCode: string,
  language: 'ar' | 'en' = 'ar'
): string {
  if (successCode in SUCCESS_MESSAGES) {
    return SUCCESS_MESSAGES[successCode as SuccessMessageCode][language];
  }
  return '';
}
  