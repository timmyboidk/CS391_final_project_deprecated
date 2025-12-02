import { NextResponse } from 'next/server';
import getCollection, { SNAPSHOTS_COLLECTION } from '@/db';
import { getAllGames } from '@/lib/scraper';
import { calculateEVForGames } from '@/lib/ev-calculator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Optional Security: Verify CRON_SECRET if set in .env
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Scrape live data
        const rawGames = await getAllGames();
        if (!rawGames.length) throw new Error("Scraper returned no games");

        // Calculate EV and Metrics
        const games = calculateEVForGames(rawGames);
        const timestamp = new Date();

        // Create Snapshots
        const snapshots = games.map(game => ({
            gameNumber: game.gameNumber,
            name: game.name,
            price: game.price,
            timestamp,
            currentEV: game.currentEV,
            evPerDollar: game.evPerDollar,

            // Inventory data for Volume Analysis
            estimatedRemainingTickets: game.estimatedRemainingTickets,

            // Prize Tier data for Prize Cliff Analysis
            // We store the count of the #1 and #2 prizes specifically
            topPrizeRemaining: game.prizeTiers[0]?.prizesRemaining || 0,
            secondPrizeRemaining: game.prizeTiers[1]?.prizesRemaining || 0,
            topPrizeValue: game.prizeTiers[0]?.prizeValue || 0
        }));

        // Write to MongoDB
        const collection = await getCollection(SNAPSHOTS_COLLECTION);
        const result = await collection.insertMany(snapshots);

        return NextResponse.json({
            success: true,
            count: result.insertedCount,
            collection: SNAPSHOTS_COLLECTION,
            timestamp
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}