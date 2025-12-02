'use client';

import { useState, useEffect, useMemo } from 'react';
import { GameWithEV } from '@/types/lottery';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';

type SortKey = keyof Pick<GameWithEV, 'name' | 'price' | 'overallOddsValue' | 'initialEV' | 'currentEV' | 'evPerDollar' | 'netCurrentEV'>;
type SortOrder = 'asc' | 'desc';

interface CacheInfo {
    hit: boolean;
    age: number;
    ttl: number;
}

export default function Home() {
    const [games, setGames] = useState<GameWithEV[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('netCurrentEV');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [lastFetched, setLastFetched] = useState<string | null>(null);
    const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

    const fetchGames = async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch all games
            const url = forceRefresh ? '/api/games?refresh=true' : '/api/games';
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setGames(data.games || []);
            setLastFetched(data.lastFetched);
            setCacheInfo(data.cache || null);
        } catch (err) {
            console.error('Failed to fetch games:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch games');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    // Filter and sort games
    const filteredAndSortedGames = useMemo(() => {
        let filtered = games;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = games.filter(
                (game) =>
                    game.name.toLowerCase().includes(term) ||
                    game.gameNumber.includes(term) ||
                    game.price.toString().includes(term)
            );
        }

        // Sort
        const sorted = [...filtered].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return 0;
        });

        return sorted;
    }, [games, searchTerm, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return <span style={{ color: '#fcd5ce' }}>⇅</span>;
        return <span style={{ color: '#fec89a' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <main className="min-h-screen py-12 flex justify-center">
            <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
                <header className="mb-12 text-center">
                    <div className="inline-block mb-4 text-6xl">🎰✨</div>
                    <h1 className="text-5xl font-bold mb-3" style={{
                        background: 'linear-gradient(135deg, #fec5bb 0%, #fec89a 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        CA Lottery Scratcher EV Calculator
                    </h1>
                    <p className="text-lg" style={{ color: '#8b7b6b' }}>
                        Compare expected values across California Lottery Scratcher games ✨
                    </p>
                </header>

                {/* Search and info */}
                <div className="mb-6 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
                        <div className="flex items-center gap-3 flex-1 max-w-md">
                            <div className="text-2xl">🔍</div>
                            <input
                                type="text"
                                placeholder="Search by game name, number, or price..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl shadow-md focus:outline-none focus:shadow-lg"
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #fcd5ce',
                                    color: '#5a4a42'
                                }}
                            />
                        </div>
                        {!loading && (
                            <>
                                <div className="px-6 py-3 rounded-2xl shadow-md text-center" style={{
                                    backgroundColor: '#ffe5d9',
                                    color: '#8b7b6b',
                                    fontWeight: '600'
                                }}>
                                    {filteredAndSortedGames.length} of {games.length} games
                                </div>
                                <button
                                    onClick={() => fetchGames(true)}
                                    disabled={refreshing}
                                    className="px-8 py-3 rounded-2xl shadow-md font-medium transition-all duration-150 whitespace-nowrap"
                                    style={{
                                        backgroundColor: refreshing ? '#fcd5ce' : '#fec5bb',
                                        color: '#5a4a42',
                                        cursor: refreshing ? 'not-allowed' : 'pointer',
                                        opacity: refreshing ? 0.7 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!refreshing) {
                                            e.currentTarget.style.backgroundColor = '#fec89a';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!refreshing) {
                                            e.currentTarget.style.backgroundColor = '#fec5bb';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Cache info */}
                    {!loading && cacheInfo && (
                        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center text-sm">
                            <div className="px-4 py-2 rounded-xl" style={{
                                backgroundColor: cacheInfo.hit ? '#d8e2dc40' : '#ffe5d940',
                                color: '#8b7b6b'
                            }}>
                                {cacheInfo.hit ? '✓ From cache' : '✨ Fresh data'}
                            </div>
                            {lastFetched && (
                                <div className="px-4 py-2 rounded-xl" style={{
                                    backgroundColor: '#fae1dd40',
                                    color: '#8b7b6b'
                                }}>
                                    Updated: {new Date(lastFetched).toLocaleTimeString()}
                                </div>
                            )}
                            {cacheInfo.hit && cacheInfo.age > 0 && (
                                <div className="px-4 py-2 rounded-xl" style={{
                                    backgroundColor: '#fcd5ce40',
                                    color: '#8b7b6b'
                                }}>
                                    Cache age: {Math.floor(cacheInfo.age / 60)}m {cacheInfo.age % 60}s
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="text-center py-16 px-4 rounded-3xl shadow-xl" style={{ backgroundColor: '#ffffff' }}>
                        <div className="inline-block text-6xl mb-4 animate-bounce">🎲</div>
                        <p className="text-xl font-semibold mb-2" style={{ color: '#fec5bb' }}>
                            Loading games and calculating EV...
                        </p>
                        <p className="text-sm" style={{ color: '#8b7b6b' }}>
                            This may take a minute... Fetching all 47 scratcher games! ✨
                        </p>
                    </div>
                )}

                {/* Refreshing overlay */}
                {refreshing && (
                    <div className="text-center py-12 px-4 rounded-3xl shadow-xl mb-6" style={{ backgroundColor: '#ffe5d9' }}>
                        <div className="inline-block text-4xl mb-3 animate-spin">🔄</div>
                        <p className="text-lg font-semibold" style={{ color: '#5a4a42' }}>
                            Fetching latest data...
                        </p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="rounded-3xl shadow-xl p-6" style={{
                        backgroundColor: '#fec5bb',
                        border: '2px solid #fec89a'
                    }}>
                        <div className="text-4xl mb-3">⚠️</div>
                        <h3 className="font-bold mb-2 text-lg" style={{ color: '#5a4a42' }}>
                            Error loading games
                        </h3>
                        <p className="text-sm" style={{ color: '#8b7b6b' }}>{error}</p>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && filteredAndSortedGames.length > 0 && (
                    <div className="rounded-3xl shadow-xl overflow-hidden w-full" style={{ backgroundColor: '#ffffff' }}>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full" style={{ minWidth: '100%' }}>
                                <thead style={{ backgroundColor: '#fae1dd' }}>
                                <tr>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="pl-6 pr-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{
                                            color: '#8b7b6b',
                                            borderBottom: '2px solid #fcd5ce'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            🎮 Game <SortIcon column="name" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('price')}
                                        className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            💵 Price <SortIcon column="price" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('overallOddsValue')}
                                        className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            🎲 Odds <SortIcon column="overallOddsValue" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('initialEV')}
                                        className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            📊 Initial EV <SortIcon column="initialEV" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('currentEV')}
                                        className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            💫 Current EV <SortIcon column="currentEV" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('evPerDollar')}
                                        className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            💰 EV per $ <SortIcon column="evPerDollar" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('netCurrentEV')}
                                        className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            ⭐ Net Current <SortIcon column="netCurrentEV" />
                                        </div>
                                    </th>
                                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8b7b6b', borderBottom: '2px solid #fcd5ce' }}>
                                        🔗 Link
                                    </th>
                                </tr>
                                </thead>
                                <tbody style={{ backgroundColor: '#ffffff' }}>
                                {filteredAndSortedGames.map((game, index) => (
                                    <tr
                                        key={game.gameNumber}
                                        className="transition-colors duration-150"
                                        style={{
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#fae1dd20',
                                            borderBottom: '1px solid #fcd5ce'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffe5d9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fae1dd20'}
                                    >
                                        <td className="pl-6 pr-3 sm:px-6 py-4">
                                            <div className="font-semibold" style={{ color: '#5a4a42' }}>
                                                {game.name}
                                            </div>
                                            <div className="text-xs" style={{ color: '#8b7b6b' }}>
                                                #{game.gameNumber}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium" style={{ color: '#5a4a42' }}>
                                            {formatCurrency(game.price)}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#8b7b6b' }}>
                                            1 in {formatNumber(game.overallOddsValue)}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium" style={{ color: '#5a4a42' }}>
                                            {formatCurrency(game.initialEV)}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium" style={{ color: '#5a4a42' }}>
                                            {formatCurrency(game.currentEV)}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold">
                        <span style={{
                            color: game.evPerDollar >= 1 ? '#4ade80' : game.evPerDollar >= 0.75 ? '#fbbf24' : '#f87171',
                            backgroundColor: game.evPerDollar >= 1 ? '#dcfce720' : game.evPerDollar >= 0.75 ? '#fef3c720' : '#fee2e220',
                            padding: '4px 8px',
                            borderRadius: '8px'
                        }}>
                          ${game.evPerDollar.toFixed(2)}
                        </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold">
                        <span style={{
                            color: game.netCurrentEV >= 0 ? '#4ade80' : '#f87171',
                            backgroundColor: game.netCurrentEV >= 0 ? '#dcfce720' : '#fee2e220',
                            padding: '4px 8px',
                            borderRadius: '8px'
                        }}>
                          {formatCurrency(game.netCurrentEV)}
                        </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <a
                                                href={game.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block px-6 py-2 rounded-full font-medium transition-all duration-150 whitespace-nowrap"
                                                style={{
                                                    backgroundColor: '#fec5bb',
                                                    color: '#5a4a42'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fec89a';
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fec5bb';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                View
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && !error && filteredAndSortedGames.length === 0 && games.length > 0 && (
                    <div className="text-center py-16 px-4 rounded-3xl shadow-xl" style={{ backgroundColor: '#ffffff' }}>
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-lg" style={{ color: '#8b7b6b' }}>
                            No games match your search. Try a different keyword!
                        </p>
                    </div>
                )}

                {!loading && !error && (
                    <AnalyticsDashboard />
                )}

                {/* Legend */}
                <div className="mt-12 rounded-3xl shadow-xl p-8" style={{ backgroundColor: '#ffffff' }}>
                    <div className="text-center mb-6">
                        <div className="inline-block text-4xl mb-2">📚</div>
                        <h2 className="text-2xl font-bold" style={{ color: '#fec5bb' }}>
                            Understanding the Metrics
                        </h2>
                    </div>
                    <dl className="space-y-4">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#fae1dd20' }}>
                            <dt className="font-bold mb-1" style={{ color: '#5a4a42' }}>📊 Initial EV:</dt>
                            <dd style={{ color: '#8b7b6b' }}>
                                Total initial prize pool ÷ estimated total tickets
                            </dd>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#ffe5d920' }}>
                            <dt className="font-bold mb-1" style={{ color: '#5a4a42' }}>💫 Current EV:</dt>
                            <dd style={{ color: '#8b7b6b' }}>
                                Total remaining prize pool ÷ estimated remaining tickets
                            </dd>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#d8e2dc20' }}>
                            <dt className="font-bold mb-1" style={{ color: '#5a4a42' }}>💰 EV per $:</dt>
                            <dd style={{ color: '#8b7b6b' }}>
                                Expected value per dollar spent (Current EV ÷ ticket price). Values closer to $1.00 are better. Most games range from $0.50-$0.70.
                            </dd>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#fec5bb20' }}>
                            <dt className="font-bold mb-1" style={{ color: '#5a4a42' }}>⭐ Net Current EV:</dt>
                            <dd style={{ color: '#8b7b6b' }}>
                                Current EV minus ticket price (positive = better than break-even on average)
                            </dd>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#ffe5d920' }}>
                            <dt className="font-bold mb-1" style={{ color: '#5a4a42' }}>🎯 Ticket Estimation:</dt>
                            <dd style={{ color: '#8b7b6b' }}>
                                Median of (odds × prizes) across all prize tiers
                            </dd>
                        </div>
                    </dl>
                    <p className="mt-6 text-center text-sm p-4 rounded-xl" style={{
                        backgroundColor: '#fec5bb20',
                        color: '#8b7b6b'
                    }}>
                        ⚠️ This calculator is for educational purposes. All lottery games have negative expected value on average. Play responsibly.
                    </p>
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8 pb-4 text-center border-t-2" style={{ borderColor: '#fcd5ce' }}>
                    <p className="text-sm" style={{ color: '#8b7b6b' }}>
                        © {new Date().getFullYear()} Natalie King. All rights reserved.
                    </p>
                    <p className="text-xs mt-2" style={{ color: '#ababab' }}>
                        Made with 💖 and pastel colors
                    </p>
                </footer>
            </div>
        </main>
    );
}
