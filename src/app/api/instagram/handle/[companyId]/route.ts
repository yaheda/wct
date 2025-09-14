import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await params;

    // Verify the company belongs to the user
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        userId: userId
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get Instagram social profile for the company
    const socialProfile = await db.socialProfile.findFirst({
      where: {
        companyId: companyId,
        platform: 'instagram',
        isActive: true
      }
    });

    if (!socialProfile) {
      return NextResponse.json({ handle: null, url: null });
    }

    return NextResponse.json({
      handle: socialProfile.handle,
      url: socialProfile.url,
      lastChecked: socialProfile.lastChecked
    });

  } catch (error) {
    console.error('Instagram handle fetch API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}