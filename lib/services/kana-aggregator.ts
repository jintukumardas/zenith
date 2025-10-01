import { APTOS_NETWORK } from "../constants";
import axios from "axios";

const KANA_API_BASE = "https://ag.kanalabs.io";
const KANA_API_KEY = process.env.NEXT_PUBLIC_KANA_API_KEY || "";

const kanaApi = axios.create({
  baseURL: KANA_API_BASE,
  headers: {
    "Content-Type": "application/json",
    ...(KANA_API_KEY && { "X-API-Key": KANA_API_KEY }),
  },
});

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  fee: string;
  route: any[];
}

export interface CrossChainQuote {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedTime: number;
  bridgeFee: string;
  route: any[];
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price?: number;
}

class KanaAggregatorService {
  private tokenCache: { data: TokenInfo[]; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60000; // 1 minute
  private lastRequestTime = 0;
  private readonly REQUEST_INTERVAL = 6000; // 6 seconds (10 requests per minute)

  // Get available tokens for Aptos with rate limiting and caching
  async getTokenList(): Promise<TokenInfo[]> {
    // Return cached data if still valid
    if (
      this.tokenCache &&
      Date.now() - this.tokenCache.timestamp < this.CACHE_DURATION
    ) {
      return this.tokenCache.data;
    }

    // Rate limiting - wait if necessary
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    try {
      // Aptos chain ID is 2 in Kanalabs API
      const response = await fetch("https://ag.kanalabs.io/tokens?chain=2");
      this.lastRequestTime = Date.now();

      const result = await response.json();

      if (result.status === "success" && result.data) {
        const tokens: TokenInfo[] = result.data.map((token: any) => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI,
          price: token.usd || 0,
        }));

        // Cache the result
        this.tokenCache = {
          data: tokens,
          timestamp: Date.now(),
        };

        return tokens;
      }

      return this.getDefaultTokens();
    } catch (error) {
      console.error("Error fetching token list:", error);
      return this.getDefaultTokens();
    }
  }

  // Get swap quote for same-chain swap
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number = 0.5
  ): Promise<SwapQuote | null> {
    try {
      const response = await kanaApi.post("/swap/quote", {
        chain: "aptos",
        network: APTOS_NETWORK,
        fromToken,
        toToken,
        amount,
        slippage,
      });

      const quote = response.data;

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quote.toAmount || "0",
        priceImpact: quote.priceImpact || 0,
        fee: quote.fee || "0",
        route: quote.route || [],
      };
    } catch (error) {
      console.error("Error getting swap quote:", error);
      return null;
    }
  }

  // Execute swap
  async executeSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    walletAddress: string,
    slippage: number = 0.5
  ): Promise<any> {
    try {
      const response = await kanaApi.post("/swap/execute", {
        chain: "aptos",
        network: APTOS_NETWORK,
        fromToken,
        toToken,
        amount,
        slippage,
        wallet: walletAddress,
      });

      return response.data;
    } catch (error) {
      console.error("Error executing swap:", error);
      throw error;
    }
  }

  // Get cross-chain quote
  async getCrossChainQuote(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<CrossChainQuote | null> {
    try {
      const response = await kanaApi.post("/bridge/quote", {
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
      });

      const quote = response.data;

      return {
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quote.toAmount || "0",
        estimatedTime: quote.estimatedTime || 300,
        bridgeFee: quote.bridgeFee || "0",
        route: quote.route || [],
      };
    } catch (error) {
      console.error("Error getting cross-chain quote:", error);
      return null;
    }
  }

  // Execute cross-chain transfer
  async executeCrossChainTransfer(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    toAddress: string
  ): Promise<any> {
    try {
      const response = await kanaApi.post("/bridge/execute", {
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        fromAddress,
        toAddress,
      });

      return response.data;
    } catch (error) {
      console.error("Error executing cross-chain transfer:", error);
      throw error;
    }
  }

  // Claim cross-chain tokens
  async claimCrossChainTokens(
    chain: string,
    txHash: string,
    walletAddress: string
  ): Promise<any> {
    try {
      const response = await kanaApi.post("/bridge/claim", {
        chain,
        txHash,
        wallet: walletAddress,
      });

      return response.data;
    } catch (error) {
      console.error("Error claiming tokens:", error);
      throw error;
    }
  }

  // Get supported chains
  getSupportedChains(): string[] {
    return [
      "aptos",
      "ethereum",
      "bsc",
      "polygon",
      "arbitrum",
      "avalanche",
      "solana",
      "sui",
      "zkSync",
    ];
  }

  // Default tokens for Aptos testnet
  private getDefaultTokens(): TokenInfo[] {
    return [
      {
        address: "0x1::aptos_coin::AptosCoin",
        symbol: "APT",
        name: "Aptos",
        decimals: 8,
        price: 10.5,
      },
      {
        address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        price: 1.0,
      },
      {
        address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        price: 1.0,
      },
      {
        address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH",
        symbol: "WETH",
        name: "Wrapped Ethereum",
        decimals: 8,
        price: 3400,
      },
    ];
  }

  // Get best swap route using Kanalabs aggregation
  async getBestRoute(
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<{ dex: string; output: string; priceImpact: number }[]> {
    try {
      const quote = await this.getSwapQuote(fromToken, toToken, amount);
      if (!quote) return [];

      return quote.route.map((r: any) => ({
        dex: r.dex || "Liquidswap",
        output: r.outputAmount || "0",
        priceImpact: r.priceImpact || 0,
      }));
    } catch (error) {
      console.error("Error getting best route:", error);
      return [];
    }
  }
}

export const kanaAggregatorService = new KanaAggregatorService();
