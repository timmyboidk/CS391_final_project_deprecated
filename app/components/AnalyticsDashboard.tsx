'use client';

import { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
    risingStars: Array<{
        gameNumber: string;
        name: string;
        price: number;
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
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="mt-12 text-center p-8 bg-white/50 rounded-3xl animate-pulse">
            <p className="text-[#8b7b6b]">⛏️ Mining historical data from cs391-final...</p>
        </div>
    );

    if (!data || (!data.risingStars.length && !data.highVolume.length && !data.prizeCliffs.length)) return null;

    return (
        <div className="mt-12 space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#fec5bb' }}>
                    Data Insights 📈
                </h2>
                <p className="text-[#8b7b6b]">7-Day Market Analysis</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Rising Stars (Velocity) */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-[#fcd5ce]">
                    <h3 className="text-xl font-bold mb-4 text-[#5a4a42] flex items-center gap-2">
                        🚀 Rising Stars
                        <span className="text-xs bg-[#dcfce7] text-[#166534] px-2 py-1 rounded-full font-normal">
              EV Increasing
            </span>
                    </h3>
                    <div className="space-y-4">
                        {data.risingStars.slice(0, 3).map(game => (
                            <div key={game.gameNumber} className="p-4 rounded-xl bg-[#fae1dd20]">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-[#5a4a42]">{game.name}</div>
                                        <div className="text-xs text-[#8b7b6b]">${game.price} • Current EV: ${game.currentEV.toFixed(2)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-[#4ade80]">+{game.changePercent.toFixed(2)}%</div>
                                        <div className="text-xs text-[#8b7b6b]">7-Day Growth</div>
                                    </div>
                                </div>
                                <div className="h-16 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={game.history}>
                                            <Line
                                                type="monotone"
                                                dataKey="ev"
                                                stroke="#fec89a"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #fcd5ce' }}
                                                labelStyle={{ display: 'none' }}
                                                formatter={(val: number) => [`$${val.toFixed(2)}`, 'EV']}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                        {data.risingStars.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">No major EV climbers this week.</p>
                        )}
                    </div>
                </div>

                {/* 2. Hot Games (Volume) */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-[#fcd5ce]">
                    <h3 className="text-xl font-bold mb-4 text-[#5a4a42] flex items-center gap-2">
                        🔥 Hot Games
                        <span className="text-xs bg-[#ffe5d9] text-[#9a3412] px-2 py-1 rounded-full font-normal">
              High Volume
            </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-[#fcd5ce] text-[#8b7b6b]">
                                <th className="text-left pb-2 pl-2">Game</th>
                                <th className="text-right pb-2">Daily Tix</th>
                                <th className="text-right pb-2 pr-2">Daily Rev</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.highVolume.slice(0, 5).map((game, i) => (
                                <tr key={game.gameNumber} className="border-b border-gray-50 hover:bg-[#fae1dd10]">
                                    <td className="py-3 pl-2 font-medium text-[#5a4a42]">
                                        <span className="text-[#fec5bb] font-bold mr-2">#{i+1}</span>
                                        {game.name}
                                    </td>
                                    <td className="py-3 text-right font-mono text-[#8b7b6b]">
                                        ~{game.dailyVelocity.toLocaleString()}
                                    </td>
                                    <td className="py-3 pr-2 text-right font-mono text-[#fec89a] font-bold">
                                        ${game.dailyRevenue.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Prize Cliff Warning */}
                {data.prizeCliffs.length > 0 && (
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl border-2 border-[#f87171]">
                        <h3 className="text-xl font-bold mb-4 text-[#5a4a42] flex items-center gap-2">
                            ⚠️ Prize Cliff Warning
                            <span className="text-xs bg-[#fee2e2] text-[#991b1b] px-2 py-1 rounded-full font-normal">
                Top Prizes Claimed Recently
              </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.prizeCliffs.map(game => (
                                <div key={game.gameNumber} className="flex items-center justify-between p-4 bg-[#fef2f2] rounded-xl border border-[#fecaca]">
                                    <div>
                                        <div className="font-bold text-[#5a4a42]">{game.name}</div>
                                        <div className="text-sm text-[#7f1d1d] font-semibold mt-1">
                                            {game.topPrizeLost > 0
                                                ? `🚨 ${game.topPrizeLost} Top Prize(s) Claimed!`
                                                : `📉 ${game.secondPrizeLost} Second Place Prize(s) Gone`}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-[#8b7b6b]">Remaining Top Prizes</div>
                                        <div className="text-2xl font-bold text-[#ef4444]">{game.remainingTop}</div>
                                        <div className="text-xs text-[#8b7b6b]">Value: ${game.topPrizeValue.toLocaleString()}</div>
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