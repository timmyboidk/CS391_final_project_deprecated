import { NextResponse } from 'next/server';
import getCollection, { SNAPSHOTS_COLLECTION } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const collection = await getCollection(SNAPSHOTS_COLLECTION);

        // Fetch History (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const snapshots = await collection.find({
            timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: 1 }).toArray();

        if (!snapshots.length) {
            return NextResponse.json({ risingStars: [], highVolume: [], prizeCliffs: [] });
        }

        // Group data by Game
        const gameHistory: Record<string, any[]> = {};
        snapshots.forEach(doc => {
            if (!gameHistory[doc.gameNumber]) gameHistory[doc.gameNumber] = [];
            gameHistory[doc.gameNumber].push(doc);
        });

        const insights = {
            risingStars: [] as any[],
            highVolume: [] as any[],
            prizeCliffs: [] as any[]
        };

        // Mining & Analysis
        Object.keys(gameHistory).forEach(gameId => {
            const history = gameHistory[gameId];
            if (history.length < 2) return;

            const oldest = history[0];
            const newest = history[history.length - 1];

            // EV Velocity (Climbers)
            // Method: Compare current EV vs Oldest EV in range
            const evChange = ((newest.currentEV - oldest.currentEV) / oldest.currentEV) * 100;

            // Threshold: Only show if growth is > 0.5%
            if (evChange > 0.5) {
                insights.risingStars.push({
                    gameNumber: newest.gameNumber,
                    name: newest.name,
                    price: newest.price,
                    changePercent: evChange,
                    currentEV: newest.currentEV,
                    // Simplify history for the chart
                    history: history.map(h => ({
                        date: new Date(h.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
                        ev: h.currentEV
                    }))
                });
            }

            //Sales Volume Estimation (Hot Games)
            // Method: (Previous Prizes - Current Prizes via estimated tickets) / Days
            const daysElapsed = (new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 3600 * 24);

            if (daysElapsed > 0.1) {
                const ticketsSold = oldest.estimatedRemainingTickets - newest.estimatedRemainingTickets;

                if (ticketsSold > 0) {
                    const dailyVelocity = Math.round(ticketsSold / daysElapsed);
                    const dailyRevenue = dailyVelocity * newest.price;

                    insights.highVolume.push({
                        gameNumber: newest.gameNumber,
                        name: newest.name,
                        price: newest.price,
                        dailyVelocity,
                        dailyRevenue
                    });
                }
            }

            //Prize Cliff Warning
            // Method: Track specific changes in top 2 prize tiers
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

        // Sorting & Cleanup
        insights.risingStars.sort((a, b) => b.changePercent - a.changePercent);
        insights.highVolume.sort((a, b) => b.dailyRevenue - a.dailyRevenue);
        // Sort cliffs by magnitude of loss (top prize loss is prioritized)
        insights.prizeCliffs.sort((a, b) => b.topPrizeLost - a.topPrizeLost);

        return NextResponse.json(insights);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}