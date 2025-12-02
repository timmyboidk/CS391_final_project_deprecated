// Known California Lottery Scratcher games
// Last updated: 2025-10-29
// Total games: 47

export const KNOWN_GAMES = [
    // $1 Games
    'https://www.calottery.com/scratchers/$1/seasons-greetings-1697',
    'https://www.calottery.com/scratchers/$1/the-lucky-spot-1555',
    'https://www.calottery.com/scratchers/$1/straight-8s-1674',

    // $2 Games
    'https://www.calottery.com/scratchers/$2/set-for-life-1693',
    'https://www.calottery.com/scratchers/$2/monopoly-1665',
    'https://www.calottery.com/scratchers/$2/citrus-twist-1679',
    'https://www.calottery.com/scratchers/$2/california-black-premium-1683',

    // $3 Games
    'https://www.calottery.com/scratchers/$3/california-crossword-1676',
    'https://www.calottery.com/scratchers/$3/loteria-1666',
    'https://www.calottery.com/scratchers/$3/15x-1684',
    'https://www.calottery.com/scratchers/$3/bingo-extra-1657',

    // $5 Games
    'https://www.calottery.com/scratchers/$5/happy-holidays-1698',
    'https://www.calottery.com/scratchers/$5/poker-nights-1694',
    'https://www.calottery.com/scratchers/$5/california-dreamin-1680',
    'https://www.calottery.com/scratchers/$5/the-big-spin-1623',
    'https://www.calottery.com/scratchers/$5/hot-spot-multiplier-1663',
    'https://www.calottery.com/scratchers/$5/tic-tac-toe-bonus-1658',
    'https://www.calottery.com/scratchers/$5/feeling-lucky-1685',
    'https://www.calottery.com/scratchers/$5/winner-winner-chicken-dinner-1632',
    'https://www.calottery.com/scratchers/$5/loteria-extra-1688',
    'https://www.calottery.com/scratchers/$5/monopoly-1667',
    'https://www.calottery.com/scratchers/$5/loteria-extra-1653',
    'https://www.calottery.com/scratchers/$5/mega-crossword-1628',

    // $10 Games
    'https://www.calottery.com/scratchers/$10/merry-multiplier-1699',
    'https://www.calottery.com/scratchers/$10/california-jackpot-1695',
    'https://www.calottery.com/scratchers/$10/los-angeles-chargers-1691',
    'https://www.calottery.com/scratchers/$10/los-angeles-rams-1690',
    'https://www.calottery.com/scratchers/$10/san-francisco-49ers-1689',
    'https://www.calottery.com/scratchers/$10/power-10s-1686',
    'https://www.calottery.com/scratchers/$10/single-double-triple-1633',
    'https://www.calottery.com/scratchers/$10/sunny-money-1677',
    'https://www.calottery.com/scratchers/$10/50x-the-cash-1671',
    'https://www.calottery.com/scratchers/$10/mystery-crossword-1659',
    'https://www.calottery.com/scratchers/$10/jokers-wild-poker-1668',

    // $20 Games
    'https://www.calottery.com/scratchers/$20/100x-1696',
    'https://www.calottery.com/scratchers/$20/monopoly-1669',
    'https://www.calottery.com/scratchers/$20/cash-king-1664',
    'https://www.calottery.com/scratchers/$20/double-the-luck-1672',
    'https://www.calottery.com/scratchers/$20/instant-prize-crossword-1590',
    'https://www.calottery.com/scratchers/$20/instant-prize-crossword-1682',
    'https://www.calottery.com/scratchers/$20/instant-prize-crossword-1634',

    // $25 Games
    'https://www.calottery.com/scratchers/$25/celebrate-2026-1700',

    // $30 Games
    'https://www.calottery.com/scratchers/$30/7s-1692',
    'https://www.calottery.com/scratchers/$30/200x-1638',
    'https://www.calottery.com/scratchers/$30/royal-riches-1625',
    'https://www.calottery.com/scratchers/$30/crossword-xtreme-1673',

    // $40 Games
    'https://www.calottery.com/scratchers/$40/40-years-of-play-1660',
];

/**
 * Helper function to add a game URL
 */
export function addGame(url: string): void {
    if (!KNOWN_GAMES.includes(url)) {
        KNOWN_GAMES.push(url);
    }
}