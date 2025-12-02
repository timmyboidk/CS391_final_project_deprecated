import { NextResponse } from 'next/server';
import { getAllGames } from '@/lib/scraper';
import { calculateEVForGames } from '@/lib/ev-calculator';
import { cache, getCacheTTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Keep dynamic for cache control

/**
 * GET /api/games
 * Returns all lottery games with EV calculations
 * Uses in-memory caching to avoid scraping on every request
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : undefined;
        const forceRefresh = searchParams.get('refresh') === 'true';

        // Define cache key (include limit in key if specified)
        const cacheKey = limit ? `games:limit:${limit}` : 'games:all';

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cachedData = cache.get<any>(cacheKey);
            if (cachedData) {
                const metadata = cache.getMetadata(cacheKey);
                console.log(`Cache hit for ${cacheKey}`);

                return NextResponse.json({
                    ...cachedData,
                    cache: {
                        hit: true,
                        age: metadata ? Math.floor(metadata.age / 1000) : 0, // seconds
                        ttl: metadata ? Math.floor(metadata.ttl / 1000) : 0, // seconds
                    }
                });
            }
        }

        console.log(`Cache miss for ${cacheKey}, fetching fresh data...`);

        // Fetch all games
        const games = await getAllGames(limit);

        if (games.length === 0) {
            return NextResponse.json(
                { error: 'No games found' },
                { status: 404 }
            );
        }

        // Calculate EV for all games
        const gamesWithEV = calculateEVForGames(games);

        // Sort by current EV descending (best deals first)
        gamesWithEV.sort((a, b) => b.currentEV - a.currentEV);

        const responseData = {
            games: gamesWithEV,
            count: gamesWithEV.length,
            lastFetched: new Date().toISOString()
        };

        // Cache the results
        const ttl = getCacheTTL();
        cache.set(cacheKey, responseData, ttl);
        console.log(`Cached ${cacheKey} for ${ttl / 1000 / 60} minutes`);

        return NextResponse.json({
            ...responseData,
            cache: {
                hit: false,
                age: 0,
                ttl: Math.floor(ttl / 1000), // seconds
            }
        });
    } catch (error) {
        console.error('Error in /api/games:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch games',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : 'An error occurred'
            },
            { status: 500 }
        );
    }
}