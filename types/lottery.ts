export interface PrizeTier {
    prize: string;
    prizeValue: number;
    odds: number;
    oddsText: string;
    prizesAtStart: number;
    prizesRemaining: number;
}

export interface LotteryGame {
    name: string;
    gameNumber: string;
    price: number;
    overallOdds: string;
    overallOddsValue: number;
    url: string;
    prizeTiers: PrizeTier[];
    lastUpdated?: string;
}

export interface GameWithEV extends LotteryGame {
    initialEV: number;
    currentEV: number;
    netInitialEV: number;
    netCurrentEV: number;
    evPerDollar: number; // Current EV per dollar spent
    estimatedTotalTickets: number;
    estimatedRemainingTickets: number;
}