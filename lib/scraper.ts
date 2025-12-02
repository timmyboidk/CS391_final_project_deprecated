import * as cheerio from 'cheerio';
import { LotteryGame, PrizeTier } from '@/types/lottery';

const BASE_URL = 'https://www.calottery.com';

import { KNOWN_GAMES } from './game-list';

/**
 * Fetch and parse the main scratchers page to get all game links
 */
export async function getAllGameLinks(): Promise<{ name: string; url: string; price: number }[]> {
    try {
        const response = await fetch(`${BASE_URL}/en/scratchers`, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch scratchers page: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const games: { name: string; url: string; price: number }[] = [];
        const seenUrls = new Set<string>();

        // Find all game links in the HTML
        $('a').each((_, element) => {
            const href = $(element).attr('href');

            if (href && href.match(/\/scratchers\/\$\d+\/[\w-]+-\d+/)) {
                const priceMatch = href.match(/\/scratchers\/\$(\d+)\//);
                const price = priceMatch ? parseInt(priceMatch[1]) : 0;

                if (price > 0) {
                    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

                    if (!seenUrls.has(fullUrl)) {
                        seenUrls.add(fullUrl);

                        const urlParts = href.split('/');
                        const lastPart = urlParts[urlParts.length - 1];
                        const name = $(element).text().trim() ||
                            lastPart.replace(/-/g, ' ').replace(/\d+$/, '').trim();

                        games.push({
                            name,
                            url: fullUrl,
                            price
                        });
                    }
                }
            }
        });

        // Also add games from our known games list
        for (const gameUrl of KNOWN_GAMES) {
            if (!seenUrls.has(gameUrl)) {
                seenUrls.add(gameUrl);

                const priceMatch = gameUrl.match(/\/\$(\d+)\//);
                const price = priceMatch ? parseInt(priceMatch[1]) : 0;

                const urlParts = gameUrl.split('/');
                const lastPart = urlParts[urlParts.length - 1];
                const name = lastPart.replace(/-/g, ' ').replace(/\d+$/, '').trim();

                games.push({
                    name,
                    url: gameUrl,
                    price
                });
            }
        }

        console.log(`Found ${games.length} unique games`);
        return games;
    } catch (error) {
        console.error('Error fetching game links:', error);
        return [];
    }
}

/**
 * Parse a number from text, handling various formats
 */
function parseNumber(text: string): number {
    const cleaned = text.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}

/**
 * Parse prize value (e.g., "$250,000" -> 250000, "Free Ticket" -> ticket price)
 */
function parsePrizeValue(prizeText: string, ticketPrice: number): number {
    if (prizeText.toLowerCase().includes('free') || prizeText.toLowerCase().includes('ticket')) {
        return ticketPrice;
    }
    return parseNumber(prizeText);
}

/**
 * Fetch and parse a single game page
 */
export async function parseGamePage(url: string): Promise<LotteryGame | null> {
    try {
        const response = await fetch(url, {
            cache: 'no-store', // Disable caching for testing
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch game page ${url}: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract game name and number - try multiple strategies
        let gameName = $('h1').first().text().trim();
        if (!gameName) {
            gameName = $('[data-test="game-name"]').text().trim();
        }
        if (!gameName) {
            // Fallback: extract from URL
            const urlParts = url.split('/');
            gameName = urlParts[urlParts.length - 1].replace(/-/g, ' ').replace(/\d+$/, '').trim();
        }

        const gameNumberMatch = gameName.match(/\((\d+)\)/) || url.match(/-(\d+)$/);
        const gameNumber = gameNumberMatch ? gameNumberMatch[1] : '';

        // Extract ticket price - try URL first as it's most reliable
        const urlPriceMatch = url.match(/\/\$(\d+)\//);
        let price = urlPriceMatch ? parseInt(urlPriceMatch[1]) : 0;

        if (price === 0) {
            const priceText = $('*').filter((_, el) => {
                const text = $(el).text();
                return text.includes('Ticket Price') || text.includes('Price:');
            }).text();
            price = parseNumber(priceText);
        }

        // Extract overall odds
        let overallOddsText = '1 in 1';
        let overallOddsValue = 1;

        $('*').each((_, el) => {
            const text = $(el).text();
            if (text.includes('Overall Odds') || text.includes('overall odds')) {
                const match = text.match(/1\s+in\s+([\d.,]+)/i);
                if (match) {
                    overallOddsText = text.trim();
                    overallOddsValue = parseFloat(match[1].replace(/,/g, ''));
                    return false; // break
                }
            }
        });

        // Extract last updated date
        let lastUpdated = '';
        $('*').each((_, el) => {
            const text = $(el).text();
            if (text.includes('Last Updated') || text.includes('Data Last Updated')) {
                lastUpdated = text.trim();
                return false; // break
            }
        });

        // Parse prize table - look for any table with prize data
        const prizeTiers: PrizeTier[] = [];

        $('table').each((_, table) => {
            const $table = $(table);

            // Try to find header row
            const headers = $table.find('th, thead td').map((_, th) =>
                $(th).text().trim().toLowerCase()
            ).get();

            // Look for tables with prize and odds columns
            const hasPrize = headers.some(h => h.includes('prize'));
            const hasOdds = headers.some(h => h.includes('odd'));

            if ((hasPrize && hasOdds) || headers.length >= 4) {
                // Process data rows
                const rows = $table.find('tbody tr, tr').filter((_, row) => {
                    const $row = $(row);
                    // Skip header rows
                    return $row.find('td').length > 0;
                });

                rows.each((_, row) => {
                    const $row = $(row);
                    const cells = $row.find('td').map((_, td) => $(td).text().trim()).get();

                    // Handle both 3-column (prize, odds, "X of Y") and 4-column formats
                    if (cells.length >= 3) {
                        const prizeText = cells[0];
                        const oddsText = cells[1];

                        // Skip if this looks like a header row
                        if (prizeText.toLowerCase().includes('prize') && oddsText.toLowerCase().includes('odd')) {
                            return;
                        }

                        let prizesRemaining = 0;
                        let prizesAtStart = 0;

                        if (cells.length === 3) {
                            // Format: "10 of 10" or "905 of 935"
                            const remainingText = cells[2];
                            const match = remainingText.match(/(\d[\d,]*)\s+of\s+(\d[\d,]*)/);
                            if (match) {
                                prizesRemaining = parseNumber(match[1]);
                                prizesAtStart = parseNumber(match[2]);
                            }
                        } else if (cells.length >= 4) {
                            // Separate columns for at start and remaining
                            prizesAtStart = parseNumber(cells[2]);
                            prizesRemaining = parseNumber(cells[3]);
                        }

                        const prizeValue = parsePrizeValue(prizeText, price);
                        const oddsMatch = oddsText.match(/([\d,]+)/);
                        const odds = oddsMatch ? parseNumber(oddsMatch[1]) : 0;

                        if (prizeValue > 0 && odds > 0 && prizesAtStart > 0) {
                            prizeTiers.push({
                                prize: prizeText,
                                prizeValue,
                                odds,
                                oddsText,
                                prizesAtStart,
                                prizesRemaining
                            });
                        }
                    }
                });
            }
        });

        if (prizeTiers.length === 0) {
            console.warn(`No prize tiers found for ${gameName} at ${url}`);
            return null;
        }

        return {
            name: gameName,
            gameNumber,
            price,
            overallOdds: overallOddsText,
            overallOddsValue,
            url,
            prizeTiers,
            lastUpdated
        };
    } catch (error) {
        console.error(`Error parsing game page ${url}:`, error);
        return null;
    }
}

/**
 * Fetch all games with a limit for testing
 */
export async function getAllGames(limit?: number): Promise<LotteryGame[]> {
    const gameLinks = await getAllGameLinks();
    const limitedLinks = limit ? gameLinks.slice(0, limit) : gameLinks;

    console.log(`Fetching ${limitedLinks.length} games...`);

    const games = await Promise.all(
        limitedLinks.map(link => parseGamePage(link.url))
    );

    return games.filter((game): game is LotteryGame => game !== null);
}