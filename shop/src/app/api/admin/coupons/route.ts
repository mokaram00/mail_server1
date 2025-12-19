import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { getErrorMessage, getErrorDetails, getSuccessMessage } from '@/lib/errors';
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
    accessToken: process.env.POLAR_API_KEY!,
    });
// GET /api/admin/coupons - جلب جميع الكوبونات
export async function GET(request: NextRequest) {
    try {
        await authenticateAdmin(request);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const active = searchParams.get('active');

        const skip = (page - 1) * limit;

        // Fetch from Polar
        const polarDiscounts = await polar.discounts.list({ limit: 100 });
        const discounts = [];
        for await (const d of polarDiscounts) {
          discounts.push(d);
        }
        let coupons = discounts.map((d: any) => ({
          _id: d.id,
          code: d.code,
          discountType: d.type,
          discountValue: d.type === 'fixed' ? ((d as any).amountOff || 0) / 100 : ((d as any).percentOff || 0),
          startDate: d.startsAt,
          endDate: d.endsAt,
          usageLimit: d.maxRedemptions,
          usageCount: d.redemptionsCount || 0,
          isActive: true, // assume active
          createdAt: d.createdAt
        }));

        // Apply filters
        if (search) {
          coupons = coupons.filter((c: any) =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.discountType.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (active !== null) {
          coupons = coupons.filter((c: any) => c.isActive === (active === 'true'));
        }

        // Pagination
        const total = coupons.length;
        coupons = coupons.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(skip, skip + limit);

        return NextResponse.json({
            coupons,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalCoupons: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        });
    } catch (error: unknown) {
        console.error('خطأ في جلب الكوبونات:', error);

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

// POST /api/admin/coupons - إنشاء كوبون جديد
export async function POST(request: NextRequest) {
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

        // Check if coupon exists in Polar
        const existingDiscounts = await polar.discounts.list({ limit: 100 });
        const discounts = [];
        for await (const d of existingDiscounts) {
          discounts.push(d);
        }
        const existing = discounts.find((d: any) => d.code === code.toUpperCase());
        if (existing) {
            return NextResponse.json(
                {
                    error: getErrorMessage('COUPON_EXISTS', 'ar'),
                    code: 'COUPON_EXISTS',
                    details: getErrorDetails('COUPON_EXISTS', 'ar')
                },
                { status: 400 }
            );
        }

        // Get organization ID
        const organizations = await polar.organizations.list({ limit: 1 });
        let orgId;
        for await (const org of organizations) {
            orgId = (org as any).id;
            break;
        }

        // Create discount in Polar
        const createData: any = {
            organizationId: orgId,
            code: code.toUpperCase(),
            type: discountType,
            startsAt: startDate,
            endsAt: endDate,
            maxRedemptions: usageLimit,
            metadata: {
                minimumOrderAmount,
                maximumDiscountAmount,
                applicableProducts,
                applicableCategories
            }
        };

        if (discountType === 'fixed') {
            createData.amountOff = Math.round(discountValue * 100);
        } else {
            createData.percentOff = discountValue;
        }

        const polarDiscount = await polar.discounts.create(createData);

        return NextResponse.json({
            message: getSuccessMessage('COUPON_ADDED', 'ar'),
            coupon: {
                _id: polarDiscount.id,
                code: polarDiscount.code,
                discountType: polarDiscount.type,
                discountValue: polarDiscount.type === 'fixed' ? ((polarDiscount as any).amountOff || 0) / 100 : ((polarDiscount as any).percentOff || 0),
                startDate: polarDiscount.startsAt,
                endDate: polarDiscount.endsAt,
                usageLimit: polarDiscount.maxRedemptions,
                usageCount: polarDiscount.redemptionsCount || 0,
                isActive: true, // assume active
                createdAt: polarDiscount.createdAt
            },
            success: true
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('خطأ في إنشاء الكوبون:', error);

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
