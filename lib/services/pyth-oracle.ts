import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { PYTH_CONTRACT, PRICE_FEEDS } from "../constants";

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);

export interface PriceData {
  price: number;
  confidence: number;
  expo: number;
  timestamp: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

class PythOracleService {
  // Fetch price from Pyth oracle using mock data (Pyth requires price updates which need transactions)
  async getPrice(priceId: string): Promise<PriceData | null> {
    try {
      // Mock price data for demo purposes
      // In production, you would either:
      // 1. Use Pyth's HTTP API to get prices
      // 2. Implement a backend that updates prices via transactions
      const mockPrices: Record<string, number> = {
        [PRICE_FEEDS["APT/USD"]]: 10.5,
        [PRICE_FEEDS["BTC/USD"]]: 95000,
        [PRICE_FEEDS["ETH/USD"]]: 3400,
      };

      const price = mockPrices[priceId] || 0;

      if (price === 0) return null;

      return {
        price,
        confidence: price * 0.001,
        expo: -8,
        timestamp: Date.now() / 1000,
      };
    } catch (error) {
      console.error(`Error fetching price for ${priceId}:`, error);
      return null;
    }
  }

  // Get APT price
  async getAPTPrice(): Promise<number> {
    const priceData = await this.getPrice(PRICE_FEEDS["APT/USD"]);
    return priceData?.price || 0;
  }

  // Get BTC price
  async getBTCPrice(): Promise<number> {
    const priceData = await this.getPrice(PRICE_FEEDS["BTC/USD"]);
    return priceData?.price || 0;
  }

  // Get ETH price
  async getETHPrice(): Promise<number> {
    const priceData = await this.getPrice(PRICE_FEEDS["ETH/USD"]);
    return priceData?.price || 0;
  }

  // Get all market data
  async getAllMarkets(): Promise<MarketData[]> {
    try {
      const [aptPrice, btcPrice, ethPrice] = await Promise.all([
        this.getAPTPrice(),
        this.getBTCPrice(),
        this.getETHPrice(),
      ]);

      const markets: MarketData[] = [];

      if (aptPrice > 0) {
        markets.push({
          symbol: "APT-USD",
          price: aptPrice,
          change24h: (Math.random() - 0.5) * 10, // Would need historical data
          volume24h: aptPrice * 1000000 * (0.8 + Math.random() * 0.4),
          high24h: aptPrice * 1.05,
          low24h: aptPrice * 0.95,
        });
      }

      if (btcPrice > 0) {
        markets.push({
          symbol: "BTC-USD",
          price: btcPrice,
          change24h: (Math.random() - 0.5) * 8,
          volume24h: btcPrice * 50000 * (0.8 + Math.random() * 0.4),
          high24h: btcPrice * 1.03,
          low24h: btcPrice * 0.97,
        });
      }

      if (ethPrice > 0) {
        markets.push({
          symbol: "ETH-USD",
          price: ethPrice,
          change24h: (Math.random() - 0.5) * 9,
          volume24h: ethPrice * 800000 * (0.8 + Math.random() * 0.4),
          high24h: ethPrice * 1.04,
          low24h: ethPrice * 0.96,
        });
      }

      return markets;
    } catch (error) {
      console.error("Error fetching all markets:", error);
      return [];
    }
  }

  // Get market data for a specific symbol
  async getMarket(symbol: string): Promise<MarketData | null> {
    const markets = await this.getAllMarkets();
    return markets.find((m) => m.symbol === symbol) || null;
  }

  // Check if price feed exists
  async checkPriceFeedExists(priceId: string): Promise<boolean> {
    try {
      const result = await aptos.view({
        payload: {
          function: `${PYTH_CONTRACT}::pyth::price_feed_exists`,
          typeArguments: [],
          functionArguments: [priceId],
        },
      });

      return result[0] as boolean;
    } catch (error) {
      console.error("Error checking price feed:", error);
      return false;
    }
  }
}

export const pythOracleService = new PythOracleService();
