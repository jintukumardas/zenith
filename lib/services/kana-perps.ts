import axios from "axios";

const KANA_API_BASE_URL = "https://perps-tradeapi.kanalabs.io";
const KANA_WS_URL = "wss://perps-sdk-ws.kanalabs.io";

// API Key should be stored in environment variables
const API_KEY = process.env.NEXT_PUBLIC_KANA_API_KEY || "";

const kanaApi = axios.create({
  baseURL: KANA_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY && { "X-API-Key": API_KEY }),
  },
});

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  fundingRate: number;
  openInterest: number;
}

export interface OrderParams {
  market: string;
  side: "long" | "short";
  type: "market" | "limit";
  size: number;
  price?: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface PositionData {
  id: string;
  market: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
}

class KanaPerpsService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Get market data for a specific market
  async getMarketData(market: string): Promise<MarketData> {
    try {
      const response = await kanaApi.get(`/markets/${market}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching market data:", error);
      // Return mock data for development
      return this.getMockMarketData(market);
    }
  }

  // Get all available markets
  async getAllMarkets(): Promise<MarketData[]> {
    try {
      const response = await kanaApi.get("/markets");
      return response.data;
    } catch (error) {
      console.error("Error fetching markets:", error);
      return this.getMockAllMarkets();
    }
  }

  // Place an order
  async placeOrder(params: OrderParams): Promise<any> {
    try {
      const response = await kanaApi.post("/orders", params);
      return response.data;
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  }

  // Get user positions
  async getPositions(userAddress: string): Promise<PositionData[]> {
    try {
      const response = await kanaApi.get(`/positions/${userAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      return [];
    }
  }

  // Close a position
  async closePosition(positionId: string): Promise<any> {
    try {
      const response = await kanaApi.post(`/positions/${positionId}/close`);
      return response.data;
    } catch (error) {
      console.error("Error closing position:", error);
      throw error;
    }
  }

  // Get funding rates
  async getFundingRates(): Promise<Record<string, number>> {
    try {
      const response = await kanaApi.get("/funding-rates");
      return response.data;
    } catch (error) {
      console.error("Error fetching funding rates:", error);
      return {
        "APT-PERP": 0.0001,
        "BTC-PERP": 0.00015,
        "ETH-PERP": 0.00012,
      };
    }
  }

  // WebSocket connection for real-time data
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: any) => void) {
    try {
      this.ws = new WebSocket(KANA_WS_URL);

      this.ws.onopen = () => {
        console.log("Kana Perps WebSocket connected");
        this.reconnectAttempts = 0;
        // Subscribe to all markets
        this.ws?.send(
          JSON.stringify({
            type: "subscribe",
            channels: ["APT-PERP", "BTC-PERP", "ETH-PERP"],
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            this.connectWebSocket(onMessage, onError);
          }, 5000);
        }
      };
    } catch (error) {
      console.error("Error connecting WebSocket:", error);
      onError?.(error);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Mock data for development (remove in production)
  private getMockMarketData(market: string): MarketData {
    const mockPrices: Record<string, number> = {
      "APT-PERP": 8.45,
      "BTC-PERP": 64500.0,
      "ETH-PERP": 3200.0,
    };

    return {
      symbol: market,
      price: mockPrices[market] || 100,
      change24h: Math.random() * 10 - 5,
      volume24h: Math.random() * 10000000,
      high24h: (mockPrices[market] || 100) * 1.05,
      low24h: (mockPrices[market] || 100) * 0.95,
      fundingRate: 0.0001,
      openInterest: Math.random() * 1000000,
    };
  }

  private getMockAllMarkets(): MarketData[] {
    return ["APT-PERP", "BTC-PERP", "ETH-PERP"].map((market) =>
      this.getMockMarketData(market)
    );
  }
}

export const kanaPerpsService = new KanaPerpsService();
