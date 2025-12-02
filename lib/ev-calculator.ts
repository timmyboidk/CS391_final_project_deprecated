import { LotteryGame, GameWithEV, PrizeTier } from '@/types/lottery';

/**
 * Estimate total tickets as the median of (odds × initial prizes) across all tiers
 */
function estimateTotalTickets(prizeTiers: PrizeTier[]): number {
    const estimates = prizeTiers
        .filter(tier => tier.odds > 0 && tier.prizesAtStart > 0)
        .map(tier => tier.odds * tier.prizesAtStart);

    if (estimates.length === 0) return 0;

    // Calculate median
    estimates.sort((a, b) => a - b);
    const mid = Math.floor(estimates.length / 2);

    if (estimates.length % 2 === 0) {
        return (estimates[mid - 1] + estimates[mid]) / 2;
    } else {
        return estimates[mid];
    }
}

/**
 * Estimate remaining tickets based on remaining prizes
 */
function estimateRemainingTickets(prizeTiers: PrizeTier[]): number {
    const estimates = prizeTiers
        .filter(tier => tier.odds > 0 && tier.prizesRemaining > 0)
        .map(tier => tier.odds * tier.prizesRemaining);

    if (estimates.length === 0) return 0;

    // Calculate median
    estimates.sort((a, b) => a - b);
    const mid = Math.floor(estimates.length / 2);

    if (estimates.length % 2 === 0) {
        return (estimates[mid - 1] + estimates[mid]) / 2;
    } else {
        return estimates[mid];
    }
}

/**
 * Calculate total prize pool (initial)
 */
function calculateInitialPrizePool(prizeTiers: PrizeTier[]): number {
    return prizeTiers.reduce((sum, tier) => {
        return sum + (tier.prizeValue * tier.prizesAtStart);
    }, 0);
}

/**
 * Calculate remaining prize pool
 */
function calculateRemainingPrizePool(prizeTiers: PrizeTier[]): number {
    return prizeTiers.reduce((sum, tier) => {
        return sum + (tier.prizeValue * tier.prizesRemaining);
    }, 0);
}

/**
 * Calculate Initial EV = total initial prize pool ÷ estimated total tickets
 */
function calculateInitialEV(game: LotteryGame, totalTickets: number): number {
    if (totalTickets === 0) return 0;
    const initialPrizePool = calculateInitialPrizePool(game.prizeTiers);
    return initialPrizePool / totalTickets;
}

/**
 * Calculate Current EV = total remaining prize pool ÷ estimated remaining tickets
 */
function calculateCurrentEV(game: LotteryGame, remainingTickets: number): number {
    if (remainingTickets === 0) return 0;
    const remainingPrizePool = calculateRemainingPrizePool(game.prizeTiers);
    return remainingPrizePool / remainingTickets;
}

/**
 * Calculate EV metrics for a single game
 */
export function calculateEVForGame(game: LotteryGame): GameWithEV {
    const estimatedTotalTickets = estimateTotalTickets(game.prizeTiers);
    const estimatedRemainingTickets = estimateRemainingTickets(game.prizeTiers);

    const initialEV = calculateInitialEV(game, estimatedTotalTickets);
    const currentEV = calculateCurrentEV(game, estimatedRemainingTickets);

    const netInitialEV = initialEV - game.price;
    const netCurrentEV = currentEV - game.price;

    // Calculate expected value per dollar spent
    const evPerDollar = game.price > 0 ? currentEV / game.price : 0;

    return {
        ...game,
        initialEV,
        currentEV,
        netInitialEV,
        netCurrentEV,
        evPerDollar,
        estimatedTotalTickets,
        estimatedRemainingTickets
    };
}

/**
 * Calculate EV metrics for multiple games
 */
export function calculateEVForGames(games: LotteryGame[]): GameWithEV[] {
    return games.map(calculateEVForGame);
}