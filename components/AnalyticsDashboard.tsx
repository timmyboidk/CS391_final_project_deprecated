'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface AnalyticsData {
    risingStars: Array<{
        gameNumber: string;
        name: string;
        changePercent: number;
        currentEV: number;
        history: Array<{ date: string; ev: number }>;
    }>;
    highVolume: Array<{
        gameNumber: string;
        name: string;
        price: number;
        dailyVelocity: number;
        dailyRevenue: number;
    }>;
    prizeCliffs: Array<{
        gameNumber: string;
        name: string;
        topPrizeLost: number;
        secondPrizeLost: number;
        remainingTop: number;
        topPrizeValue: number;
    }>;
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="mt-12 text-center p-8 bg-white/50 rounded-3xl animate-pulse text-[#8b7b6b]">Mining historical data...</div>;
    if (!data || (!data.risingStars.length && !data.highVolume.length && !data.prizeCliffs.length)) return null;

    return (
        <div className="mt-12 space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#fec5bb' }}>Data Insights 📈</h2>
                <p className="text-[#8b7b6b]">7-Day Trends & Alerts</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Rising Stars (EV Velocity) */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-[#fcd5ce]">
                    <h3 className="text-xl font-bold mb-4 text-[#5a4a42] flex items-center gap-2">
                        🚀 Rising Stars <span className="text-xs bg-[#dcfce7] text-[#166534] px-2 py-1 rounded-full">EV Increasing</span>
                    </h3>
                    <div className="space-y-4">
                        {data.risingStars.slice(0, 3).map(game => (
                            <div key={game.gameNumber} className="p-4 rounded-xl bg-[#fae1dd20]">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-[#5a4a42]">{game.name}</span>
                                    <span className="text-[#4ade80] font-bold">+{game.changePercent.toFixed(2)}%</span>
                                </div>
                                <div className="h-16">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={game.history}>
                                            <Line type="monotone" dataKey="ev" stroke="#fec89a" strokeWidth={2} dot={false} />
                                            <Tooltip labelStyle={{display:'none'}} contentStyle={{borderRadius:'8px'}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                        {data.risingStars.length === 0 && <p className="text-center text-sm text-gray-400">No major EV jumps this week.</p>}
                    </div>
                </div>

                {/* 2. Hot Games (Sales Volume) */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-[#fcd5ce]">
                    <h3 className="text-xl font-bold mb-4 text-[#5a4a42] flex items-center gap-2">
                        🔥 Hot Games <span className="text-xs bg-[#ffe5d9] text-[#9a3412] px-2 py-1 rounded-full">High Volume</span>
                    </h3>
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#fcd5ce] text-[#8b7b6b]">
                            <th className="text-left pb-2">Game</th>
                            <th className="text-right pb-2">Daily Tix</th>
                            <th className="text-right pb-2">Daily Rev</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.highVolume.slice(0, 5).map(game => (
                            <tr key={game.gameNumber} className="border-b border-gray-50 hover:bg-[#fae1dd10]">
                                <td className="py-2 text-[#5a4a42]">{game.name}</td>
                                <td className="py-2 text-right text-[#8b7b6b]">~{game.dailyVelocity.toLocaleString()}</td>
                                <td className="py-2 text-right font-bold text-[#fec89a]">${game.dailyRevenue.toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* 3. Prize Cliff Warning */}
                {data.prizeCliffs.length > 0 && (
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl border-2 border-[#f87171]">
                        <h3 className="text-xl font-bold mb-4 text-[#5a4a42] flex items-center gap-2">
                            ⚠️ Prize Cliff Warning <span className="text-xs bg-[#fee2e2] text-[#991b1b] px-2 py-1 rounded-full">Top Prizes Claimed</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.prizeCliffs.map(game => (
                                <div key={game.gameNumber} className="flex items-center justify-between p-4 bg-[#fef2f2] rounded-xl">
                                    <div>
                                        <div className="font-bold text-[#5a4a42]">{game.name}</div>
                                        <div className="text-xs text-[#7f1d1d]">
                                            {game.topPrizeLost > 0 ? `🚨 ${game.topPrizeLost} Top Prize(s) Claimed!` : `${game.secondPrizeLost} 2nd Place Prize(s) Claimed`}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-[#8b7b6b]">Remaining Top:</div>
                                        <div className="text-xl font-bold text-[#ef4444]">{game.remainingTop}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}