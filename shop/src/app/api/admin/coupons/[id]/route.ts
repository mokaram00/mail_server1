import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';

// GET /api/admin/coupons/[id] - جلب كوبون محدد
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await authenticateAdmin(request);

        const coupon = await Coupon.findById(params.id)
            .populate('applicableProducts', 'name')
            .populate('applicableCategories', 'name');

        if (!coupon) {
            return NextResponse.json(
                {
                    error: getErrorMessage('COUPON_NOT_FOUND', 'ar'),
                    code: 'COUPON_NOT_FOUND',
                    details: getErrorDetails('COUPON_NOT_FOUND', 'ar')
                },
                { status: 404 }
            );
        }

        return NextResponse.json({ coupon });
    } catch (error: unknown) {
        console.error('خطأ في جلب الكوبون:', error);

        const status = error instanceof Error && (error.message?.includes('صلاحيات') || error.message?.includes('ليس لديك صلاحية'))
            ? 403
            : 500;

        return NextResponse.json(
            {
                error: getErrorMessage(status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR', 'ar'),
                code: status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR',
                details: getErrorDetails(status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR', 'ar')
            },
            { status }
        );
    }
}

// PUT /api/admin/coupons/[id] - تعديل كوبون
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await authenticateAdmin(request);

        const body = await request.json();
        const {
            code,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscountAmount,
            startDate,
            endDate,
            usageLimit,
            active,
            applicableProducts,
            applicableCategories,
        } = body;

        const coupon = await Coupon.findById(params.id);

        if (!coupon) {
            return NextResponse.json(
                {
                    error: getErrorMessage('COUPON_NOT_FOUND', 'ar'),
                    code: 'COUPON_NOT_FOUND',
                    details: getErrorDetails('COUPON_NOT_FOUND', 'ar')
                },
                { status: 404 }
            );
        }

        // التحقق من وجود الكوبون الجديد مسبقاً (إذا تم تغيير الرمز)
        if (code && code.toUpperCase() !== coupon.code) {
            const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (existingCoupon) {
                return NextResponse.json(
                    {
                        error: getErrorMessage('COUPON_EXISTS', 'ar'),
                        code: 'COUPON_EXISTS',
                        details: getErrorDetails('COUPON_EXISTS', 'ar')
                    },
                    { status: 400 }
                );
            }
        }

        // تحديث البيانات
        if (code) coupon.code = code.toUpperCase();
        if (discountType) coupon.discountType = discountType;
        if (discountValue !== undefined) coupon.discountValue = discountValue;
        if (minimumOrderAmount !== undefined) coupon.minimumOrderAmount = minimumOrderAmount;
        if (maximumDiscountAmount !== undefined) coupon.maximumDiscountAmount = maximumDiscountAmount;
        if (startDate) coupon.startDate = startDate;
        if (endDate) coupon.endDate = endDate;
        if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
        if (active !== undefined) coupon.active = active;
        if (applicableProducts) coupon.applicableProducts = applicableProducts;
        if (applicableCategories) coupon.applicableCategories = applicableCategories;

        const updatedCoupon = await coupon.save();

        return NextResponse.json({
            message: getSuccessMessage('COUPON_UPDATED', 'ar'),
            coupon: updatedCoupon,
            success: true
        });
    } catch (error: unknown) {
        console.error('خطأ في تعديل الكوبون:', error);

        if (error instanceof Error && (error as { name?: string }).name === 'ValidationError') {
            return NextResponse.json(
                {
                    error: getErrorMessage('COUPON_VALIDATION_ERROR', 'ar'),
                    code: 'COUPON_VALIDATION_ERROR',
                    details: getErrorDetails('COUPON_VALIDATION_ERROR', 'ar')
                },
                { status: 400 }
            );
        }

        const status = error instanceof Error && (error.message?.includes('صلاحيات') || error.message?.includes('ليس لديك صلاحية'))
            ? 403
            : 500;

        return NextResponse.json(
            {
                error: getErrorMessage(status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR', 'ar'),
                code: status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR',
                details: getErrorDetails(status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR', 'ar')
            },
            { status }
        );
    }
}

// DELETE /api/admin/coupons/[id] - حذف كوبون
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await authenticateAdmin(request);

        const coupon = await Coupon.findById(params.id);

        if (!coupon) {
            return NextResponse.json(
                {
                    error: getErrorMessage('COUPON_NOT_FOUND', 'ar'),
                    code: 'COUPON_NOT_FOUND',
                    details: getErrorDetails('COUPON_NOT_FOUND', 'ar')
                },
                { status: 404 }
            );
        }

        // التحقق من استخدام الكوبون في طلبات سابقة
        if (coupon.usedCount > 0) {
            return NextResponse.json(
                {
                    error: getErrorMessage('COUPON_IN_USE', 'ar'),
                    code: 'COUPON_IN_USE',
                    details: getErrorDetails('COUPON_IN_USE', 'ar')
                },
                { status: 400 }
            );
        }

        await Coupon.findByIdAndDelete(params.id);

        return NextResponse.json({
            message: getSuccessMessage('COUPON_DELETED', 'ar'),
            success: true
        });
    } catch (error: unknown) {
        console.error('خطأ في حذف الكوبون:', error);

        const status = error instanceof Error && (error.message?.includes('صلاحيات') || error.message?.includes('ليس لديك صلاحية'))
            ? 403
            : 500;

        return NextResponse.json(
            {
                error: getErrorMessage(status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR', 'ar'),
                code: status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR',
                details: getErrorDetails(status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR', 'ar')
            },
            { status }
        );
    }
}
