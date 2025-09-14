import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('Instagram handle API - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, instagramHandle } = body;
    console.log('Instagram handle API - Request data:', { companyId, instagramHandle });

    if (!companyId || !instagramHandle) {
      return NextResponse.json(
        { error: 'Company ID and Instagram handle are required' },
        { status: 400 }
      );
    }

    // Verify the company belongs to the user
    console.log('Instagram handle API - Looking for company:', { companyId, userId });
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        userId: userId
      }
    });

    console.log('Instagram handle API - Found company:', company);

    if (!company) {
      console.log('Instagram handle API - Company not found for user:', { companyId, userId });
      return NextResponse.json({ error: 'Company not found or does not belong to user' }, { status: 404 });
    }

    // Create or update the social profile (setup only, no scraping)
    const socialProfile = await db.socialProfile.upsert({
      where: {
        companyId_platform: {
          companyId: companyId,
          platform: 'instagram'
        }
      },
      update: {
        handle: instagramHandle,
        url: `https://instagram.com/${instagramHandle}`,
        updatedAt: new Date()
      },
      create: {
        companyId: companyId,
        platform: 'instagram',
        handle: instagramHandle,
        url: `https://instagram.com/${instagramHandle}`,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      handle: socialProfile.handle,
      url: socialProfile.url
    });

  } catch (error) {
    console.error('Instagram handle setup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}