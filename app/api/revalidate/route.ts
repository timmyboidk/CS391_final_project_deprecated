import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/revalidate
 * Manually clear the cache to force a refresh of data
 *
 * Optional: Add authentication here for production use
 */
export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (key) {
            // Invalidate specific cache key
            cache.invalidate(key);
            return NextResponse.json({
                success: true,
                message: `Cache invalidated for key: ${key}`,
                timestamp: new Date().toISOString()
            });
        } else {
            // Clear all cache
            cache.clear();
            return NextResponse.json({
                success: true,
                message: 'All cache cleared',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error in /api/revalidate:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to revalidate cache',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : 'An error occurred'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/revalidate
 * Get cache statistics
 */
export async function GET() {
    try {
        const allKey = 'games:all';
        const metadata = cache.getMetadata(allKey);

        if (!metadata) {
            return NextResponse.json({
                cached: false,
                message: 'No cached data available'
            });
        }

        return NextResponse.json({
            cached: true,
            age: Math.floor(metadata.age / 1000), // seconds
            ttl: Math.floor(metadata.ttl / 1000), // seconds
            ageMinutes: Math.floor(metadata.age / 1000 / 60),
            ttlMinutes: Math.floor(metadata.ttl / 1000 / 60),
        });
    } catch (error) {
        console.error('Error in GET /api/revalidate:', error);
        return NextResponse.json(
            {
                error: 'Failed to get cache status',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : 'An error occurred'
            },
            { status: 500 }
        );
    }
}