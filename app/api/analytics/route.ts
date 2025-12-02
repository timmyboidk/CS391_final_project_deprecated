import { NextResponse } from 'next/server';
import getCollection from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const collection = await getCollection("game_snapshots");

        // Fetch snapshots from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const snapshots = await collection.find({
            timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: 1 }).toArray();

        if (!snapshots.length) return NextResponse.json({ risingStars: [], highVolume: [], prizeCliffs: [] });

        // Group by Game Number
        const gameHistory: Record<string, any[]> = {};
        snapshots.forEach(doc => {
            if (!gameHistory[doc.gameNumber]) gameHistory[doc.gameNumber] = [];
            gameHistory[doc.gameNumber].push(doc);
        });

        const insights = {
            risingStars: [] as any[], // Goal 1: EV Velocity
            highVolume: [] as any[],  // Goal 2: Sales Volume
            prizeCliffs: [] as any[]  // Goal 3: Prize Cliff
        };

        Object.keys(gameHistory).forEach(gameId => {
            const history = gameHistory[gameId];
            if (history.length < 2) return;

            const oldest = history[0];
            const newest = history[history.length - 1];

            // --- 1. EV Velocity ---
            // Compare current EV vs 7 days ago (simple velocity)
            const evChange = ((newest.currentEV - oldest.currentEV) / oldest.currentEV) * 100;
            if (evChange > 0.5) { // Only show meaningful growth (>0.5%)
                insights.risingStars.push({
                    gameNumber: newest.gameNumber,
                    name: newest.name,
                    price: newest.price,
                    changePercent: evChange,
                    currentEV: newest.currentEV,
                    history: history.map(h => ({ date: h.timestamp, ev: h.currentEV }))
                });
            }

            // --- 2. Sales Volume Estimation ---
            const daysElapsed = (new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 3600 * 24);
            if (daysElapsed > 0.1) {
                // Drop in Estimated Remaining Tickets = Sales
                const ticketsSold = oldest.estimatedRemainingTickets - newest.estimatedRemainingTickets;
                if (ticketsSold > 0) {
                    const dailyVelocity = Math.round(ticketsSold / daysElapsed);
                    insights.highVolume.push({
                        gameNumber: newest.gameNumber,
                        name: newest.name,
                        price: newest.price,
                        dailyVelocity,
                        dailyRevenue: dailyVelocity * newest.price
                    });
                }
            }

            // --- 3. Prize Cliff Warning ---
            // Check if top prizes have disappeared
            const topPrizeLost = oldest.topPrizeRemaining - newest.topPrizeRemaining;
            const secondPrizeLost = oldest.secondPrizeRemaining - newest.secondPrizeRemaining;

            if (topPrizeLost > 0 || secondPrizeLost > 0) {
                insights.prizeCliffs.push({
                    gameNumber: newest.gameNumber,
                    name: newest.name,
                    topPrizeLost,
                    secondPrizeLost,
                    remainingTop: newest.topPrizeRemaining,
                    topPrizeValue: newest.topPrizeValue
                });
            }
        });

        // Sort results for relevance
        insights.risingStars.sort((a, b) => b.changePercent - a.changePercent);
        insights.highVolume.sort((a, b) => b.dailyRevenue - a.dailyRevenue);
        // Sort cliffs by value lost (heuristic: top prize drops are more critical)
        insights.prizeCliffs.sort((a, b) => b.topPrizeLost - a.topPrizeLost);

        return NextResponse.json(insights);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}