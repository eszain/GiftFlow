import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { userRolesSchema } from '@/lib/validations/user';

// GET /api/analytics - Get patron analytics
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check patron role
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userRolesSchema.parse(user.roles);
    if (!roles.patron) {
      return NextResponse.json({ error: 'Patron role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'year'; // year, month, week
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      const now = new Date();
      let start: Date;
      
      switch (period) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
        default:
          start = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: now,
        },
      };
    }

    // Get fulfillments with related wish data
    const fulfillments = await prisma.fulfillment.findMany({
      where: {
        patronId: user.id,
        status: 'SUCCEEDED',
        ...dateFilter,
      },
      include: {
        wish: {
          select: {
            id: true,
            title: true,
            tags: true,
            city: true,
            type: true,
            charity: {
              select: {
                city: true,
              },
            },
          },
        },
      },
    });

    // Calculate analytics
    const totalAmount = fulfillments.reduce((sum, f) => sum + f.amountCents, 0);
    const totalFulfillments = fulfillments.length;
    const averageFulfillment = totalFulfillments > 0 ? totalAmount / totalFulfillments : 0;

    // Breakdown by tags
    const tagBreakdown: Record<string, { count: number; amount: number }> = {};
    fulfillments.forEach(fulfillment => {
      fulfillment.wish.tags.forEach(tag => {
        if (!tagBreakdown[tag]) {
          tagBreakdown[tag] = { count: 0, amount: 0 };
        }
        tagBreakdown[tag].count += 1;
        tagBreakdown[tag].amount += fulfillment.amountCents;
      });
    });

    // Breakdown by city
    const cityBreakdown: Record<string, { count: number; amount: number }> = {};
    fulfillments.forEach(fulfillment => {
      const city = fulfillment.wish.city;
      if (!cityBreakdown[city]) {
        cityBreakdown[city] = { count: 0, amount: 0 };
      }
      cityBreakdown[city].count += 1;
      cityBreakdown[city].amount += fulfillment.amountCents;
    });

    // Breakdown by wish type
    const typeBreakdown: Record<string, { count: number; amount: number }> = {};
    fulfillments.forEach(fulfillment => {
      const type = fulfillment.wish.type;
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { count: 0, amount: 0 };
      }
      typeBreakdown[type].count += 1;
      typeBreakdown[type].amount += fulfillment.amountCents;
    });

    // Recent activity
    const recentFulfillments = fulfillments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(f => ({
        id: f.id,
        wishTitle: f.wish.title,
        amount: f.amountCents,
        date: f.createdAt,
        tags: f.wish.tags,
      }));

    // Create analytics snapshot
    const analyticsData = {
      period,
      startDate: dateFilter.createdAt?.gte,
      endDate: dateFilter.createdAt?.lte,
      totals: {
        totalAmount,
        totalFulfillments,
        averageFulfillment,
      },
      breakdowns: {
        byTag: tagBreakdown,
        byCity: cityBreakdown,
        byType: typeBreakdown,
      },
      recentActivity: recentFulfillments,
    };

    // Save snapshot to database
    await prisma.analyticsSnapshot.create({
      data: {
        patronId: user.id,
        periodStart: dateFilter.createdAt?.gte || new Date(),
        periodEnd: dateFilter.createdAt?.lte || new Date(),
        totals: analyticsData.totals,
        breakdowns: analyticsData.breakdowns,
      },
    });

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/export - Export analytics as CSV
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check patron role
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userRolesSchema.parse(user.roles);
    if (!roles.patron) {
      return NextResponse.json({ error: 'Patron role required' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, format = 'csv' } = body;

    // Get fulfillments for export
    const fulfillments = await prisma.fulfillment.findMany({
      where: {
        patronId: user.id,
        status: 'SUCCEEDED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        wish: {
          select: {
            title: true,
            tags: true,
            city: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Date',
        'Wish Title',
        'Amount ($)',
        'Tags',
        'City',
        'Type',
        'Fulfillment ID',
      ];

      const csvRows = fulfillments.map(f => [
        f.createdAt.toISOString().split('T')[0],
        f.wish.title,
        (f.amountCents / 100).toFixed(2),
        f.wish.tags.join('; '),
        f.wish.city,
        f.wish.type,
        f.id,
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="giftflow-analytics-${startDate}-to-${endDate}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      fulfillments: fulfillments.map(f => ({
        id: f.id,
        date: f.createdAt,
        wishTitle: f.wish.title,
        amount: f.amountCents,
        tags: f.wish.tags,
        city: f.wish.city,
        type: f.wish.type,
      })),
    });

  } catch (error) {
    console.error('Analytics export failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
