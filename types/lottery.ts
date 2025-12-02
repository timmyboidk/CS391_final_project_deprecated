import { ObjectId } from "mongodb";

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

// The shape of the data stored in your MongoDB 'cs391-final' collection
export interface GameSnapshot {
    _id: ObjectId;
    gameNumber: string;
    name: string;
    price: number;
    timestamp: Date;
    currentEV: number;
    evPerDollar: number;
    estimatedRemainingTickets: number;
    topPrizeRemaining: number;
    secondPrizeRemaining: number;
    topPrizeValue: number;
}

// Analytics Result Types
export interface RisingStar {
    gameNumber: string;
    name: string;
    price: number;
    changePercent: number;
    currentEV: number;
    history: { date: string | Date; ev: number }[];
}

export interface HighVolumeGame {
    gameNumber: string;
    name: string;
    price: number;
    dailyVelocity: number;
    dailyRevenue: number;
}

export interface PrizeCliff {
    gameNumber: string;
    name: string;
    topPrizeLost: number;
    secondPrizeLost: number;
    remainingTop: number;
    topPrizeValue: number;
}