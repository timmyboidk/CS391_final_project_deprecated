import { NextResponse } from 'next/server';
import getCollection from '@/db';
import { getAllGames } from '@/lib/scraper';
import { calculateEVForGames } from '@/lib/ev-calculator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Security: Verify CRON_SECRET if it exists in env
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const rawGames = await getAllGames();
        if (!rawGames.length) throw new Error("Scraper returned no games");

        const games = calculateEVForGames(rawGames);
        const timestamp = new Date();

        const snapshots = games.map(game => ({
            gameNumber: game.gameNumber,
            name: game.name,
            price: game.price,
            timestamp,
            currentEV: game.currentEV,
            estimatedRemainingTickets: game.estimatedRemainingTickets,
            // CRITICAL for Prize Cliff: Store the count of the #1 and #2 prizes
            topPrizeRemaining: game.prizeTiers[0]?.prizesRemaining || 0,
            secondPrizeRemaining: game.prizeTiers[1]?.prizesRemaining || 0,
            topPrizeValue: game.prizeTiers[0]?.prizeValue || 0
        }));

        const collection = await getCollection("game_snapshots");
        const result = await collection.insertMany(snapshots);

        return NextResponse.json({ success: true, count: result.insertedCount });
    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}