import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { InstagramScraper } from '@/lib/instagram-scraper';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, instagramHandle } = body;

    if (!companyId || !instagramHandle) {
      return NextResponse.json(
        { error: 'Company ID and Instagram handle are required' },
        { status: 400 }
      );
    }

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

    // Scrape Instagram data
    const scraper = new InstagramScraper();
    const result = await scraper.scrapeInstagramProfile(instagramHandle);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to scrape Instagram profile' },
        { status: 500 }
      );
    }

    // Create or update the social profile
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
        lastChecked: new Date()
      },
      create: {
        companyId: companyId,
        platform: 'instagram',
        handle: instagramHandle,
        url: `https://instagram.com/${instagramHandle}`,
        isActive: true,
        lastChecked: new Date()
      }
    });

    // Save the scraped data
    const snapshot = await db.socialSnapshot.create({
      data: {
        profileId: socialProfile.id,
        capturedAt: new Date(),
        metrics: {
          postsCount: result.data?.length || 0
        },
        raw: result.data as any
      }
    });

    // Extract latest posts with comments for notification
    const latestPosts = (result.data || []).map((post: any) => ({
      caption: post.caption || '',
      commentsCount: post.commentsCount || 0,
      comments: (post.latestComments || []).map((comment: any) => ({
        text: comment.text || ''
      }))
    }));

    // Queue notification for successful scrape
    const notificationResult = await emailService.queueNotification(
      userId,
      'instagram_scrape_complete',
      {
        userId,
        competitorName: company.name,
        changeType: 'instagram_scrape',
        changeSummary: `Instagram profile @${instagramHandle} scraped successfully`,
        impactLevel: 'medium',
        pageUrl: socialProfile.url || `https://instagram.com/${instagramHandle}`,
        pageType: 'social_media',
        // Instagram-specific variables
        handle: instagramHandle,
        postCount: result.data?.length || 0,
        scrapedAt: new Date().toLocaleString(),
        profileId: socialProfile.id,
        companyId: companyId,
        latestPosts: latestPosts
      },
      2, // medium priority
      new Date() // queue immediately
    );

    if (!notificationResult.success) {
      console.warn(`Failed to queue notification for Instagram scrape: ${notificationResult.error}`);
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      profile: {
        id: socialProfile.id,
        handle: instagramHandle,
        url: socialProfile.url
      },
      snapshotId: snapshot.id,
      notification: {
        queued: notificationResult.success,
        queueId: notificationResult.queueId
      }
    });

  } catch (error) {
    console.error('Instagram scraping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}