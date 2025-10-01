import { aptos, TAPP_HOOKS_ADDRESS } from "../aptos";
import { pythOracleService } from "./pyth-oracle";

export interface TappPool {
  id: string;
  address: string;
  tokenA: string;
  tokenB: string;
  fee: number; // in basis points
  feeTier: "dynamic" | "fixed";
  hooks: string[]; // active hook addresses
  tvl: number;
  volume24h: number;
  apy: number;
  reserveA: number;
  reserveB: number;
}

export interface TappHook {
  id: string;
  name: string;
  type: "dynamic-fee" | "limit-order" | "twap" | "nft-gated";
  description: string;
  address: string;
  active: boolean;
  parameters?: Record<string, any>;
}

export interface LimitOrder {
  id: number;
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minAmountOut: number;
  triggerPrice: number;
  expiry: number;
  filled: boolean;
}

export interface TWAPOrder {
  id: number;
  user: string;
  tokenIn: string;
  tokenOut: string;
  totalAmount: number;
  amountPerInterval: number;
  intervalSeconds: number;
  intervalsRemaining: number;
  lastExecution: number;
}

class TappExchangeService {
  /**
   * Get available pools on Tapp.Exchange
   */
  async getPools(): Promise<TappPool[]> {
    try {
      // In production, query Tapp.Exchange API or indexer
      // For now, return mock data with real hooks
      return [
        {
          id: "tapp-apt-usdc",
          address: "0x123...abc",
          tokenA: "APT",
          tokenB: "USDC",
          fee: 30, // 0.3%
          feeTier: "dynamic",
          hooks: ["dynamic-fee", "limit-order", "twap"],
          tvl: 2500000,
          volume24h: 450000,
          apy: 15.3,
          reserveA: 250000,
          reserveB: 2250000,
        },
        {
          id: "tapp-apt-btc",
          address: "0x456...def",
          tokenA: "APT",
          tokenB: "BTC",
          fee: 50, // 0.5%
          feeTier: "dynamic",
          hooks: ["dynamic-fee", "nft-gated"],
          tvl: 1800000,
          volume24h: 320000,
          apy: 18.7,
          reserveA: 180000,
          reserveB: 28,
        },
        {
          id: "tapp-eth-usdc",
          address: "0x789...ghi",
          tokenA: "ETH",
          tokenB: "USDC",
          fee: 30,
          feeTier: "fixed",
          hooks: ["limit-order", "twap"],
          tvl: 3200000,
          volume24h: 680000,
          apy: 12.5,
          reserveA: 950,
          reserveB: 2250000,
        },
      ];
    } catch (error) {
      console.error("Error fetching Tapp pools:", error);
      return [];
    }
  }

  /**
   * Get available hooks
   */
  async getAvailableHooks(): Promise<TappHook[]> {
    return [
      {
        id: "dynamic-fee",
        name: "Dynamic Fee Hook",
        type: "dynamic-fee",
        description:
          "Automatically adjusts fees based on market volatility and volume",
        address: TAPP_HOOKS_ADDRESS,
        active: true,
        parameters: {
          baseFee: 30,
          volatilityMultiplier: 2,
          volumeThreshold: 1000000,
          highVolumeDiscount: 10,
        },
      },
      {
        id: "limit-order",
        name: "Limit Order Hook",
        type: "limit-order",
        description:
          "Place limit orders that execute automatically when price reaches target",
        address: TAPP_HOOKS_ADDRESS,
        active: true,
      },
      {
        id: "twap",
        name: "TWAP Execution Hook",
        type: "twap",
        description:
          "Time-Weighted Average Price orders split into multiple intervals",
        address: TAPP_HOOKS_ADDRESS,
        active: true,
        parameters: {
          minInterval: 300, // 5 minutes
          maxInterval: 86400, // 24 hours
        },
      },
      {
        id: "nft-gated",
        name: "NFT-Gated Trading",
        type: "nft-gated",
        description:
          "Reduced fees for NFT holders from specified collections",
        address: TAPP_HOOKS_ADDRESS,
        active: true,
        parameters: {
          baseFee: 30,
          nftHolderDiscount: 50, // 50% discount
        },
      },
    ];
  }

  /**
   * Calculate dynamic fee for a swap
   */
  async calculateDynamicFee(
    poolAddress: string,
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<{ fee: number; breakdown: Record<string, number> }> {
    try {
      // Get market data for volatility calculation
      const markets = await pythOracleService.getAllMarkets();
      const market = markets.find((m) => m.symbol.includes(tokenIn));

      const volatility = market ? Math.abs(market.change24h) : 1;
      const volume24h = market?.volume24h || 0;

      // Base fee
      let fee = 30; // 0.3%

      // Adjust for volatility
      if (volatility > 5) {
        fee += volatility * 2;
      }

      // Adjust for volume (discount for high volume)
      if (volume24h > 10000000) {
        fee -= 5;
      }

      // Ensure fee is within bounds
      fee = Math.max(10, Math.min(100, fee));

      return {
        fee,
        breakdown: {
          baseFee: 30,
          volatilityAdjustment: volatility > 5 ? volatility * 2 : 0,
          volumeDiscount: volume24h > 10000000 ? -5 : 0,
        },
      };
    } catch (error) {
      console.error("Error calculating dynamic fee:", error);
      return { fee: 30, breakdown: { baseFee: 30 } };
    }
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(params: {
    user: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    triggerPrice: number;
    expiry: number;
  }): Promise<{ success: boolean; orderId?: number; error?: string }> {
    try {
      // In production, call the smart contract
      console.log("Placing limit order:", params);

      // Mock successful order placement
      return {
        success: true,
        orderId: Math.floor(Math.random() * 10000),
      };
    } catch (error: any) {
      console.error("Error placing limit order:", error);
      return {
        success: false,
        error: error.message || "Failed to place limit order",
      };
    }
  }

  /**
   * Get user's limit orders
   */
  async getUserLimitOrders(userAddress: string): Promise<LimitOrder[]> {
    try {
      // In production, query from contract state
      // For now, return mock data
      return [
        {
          id: 1,
          user: userAddress,
          tokenIn: "APT",
          tokenOut: "USDC",
          amountIn: 100,
          minAmountOut: 1050,
          triggerPrice: 10.5,
          expiry: Date.now() + 86400000,
          filled: false,
        },
        {
          id: 2,
          user: userAddress,
          tokenIn: "USDC",
          tokenOut: "ETH",
          amountIn: 3400,
          minAmountOut: 1,
          triggerPrice: 3400,
          expiry: Date.now() + 172800000,
          filled: false,
        },
      ];
    } catch (error) {
      console.error("Error fetching limit orders:", error);
      return [];
    }
  }

  /**
   * Cancel a limit order
   */
  async cancelLimitOrder(
    orderId: number,
    userAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Cancelling limit order:", orderId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a TWAP order
   */
  async createTWAPOrder(params: {
    user: string;
    tokenIn: string;
    tokenOut: string;
    totalAmount: number;
    intervals: number;
    intervalSeconds: number;
  }): Promise<{ success: boolean; orderId?: number; error?: string }> {
    try {
      console.log("Creating TWAP order:", params);

      return {
        success: true,
        orderId: Math.floor(Math.random() * 10000),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's TWAP orders
   */
  async getUserTWAPOrders(userAddress: string): Promise<TWAPOrder[]> {
    try {
      return [
        {
          id: 1,
          user: userAddress,
          tokenIn: "USDC",
          tokenOut: "BTC",
          totalAmount: 65000,
          amountPerInterval: 6500,
          intervalSeconds: 3600, // 1 hour
          intervalsRemaining: 8,
          lastExecution: Date.now() - 3600000,
        },
      ];
    } catch (error) {
      console.error("Error fetching TWAP orders:", error);
      return [];
    }
  }

  /**
   * Check if user holds required NFT for gated pool
   */
  async checkNFTEligibility(
    userAddress: string,
    poolAddress: string
  ): Promise<{ eligible: boolean; discount: number }> {
    try {
      // In production, query NFT ownership from contract
      // For now, return mock eligibility
      const hasNFT = Math.random() > 0.5;

      return {
        eligible: hasNFT,
        discount: hasNFT ? 50 : 0, // 50% fee discount
      };
    } catch (error) {
      console.error("Error checking NFT eligibility:", error);
      return { eligible: false, discount: 0 };
    }
  }

  /**
   * Get pool statistics with hooks data
   */
  async getPoolStats(poolId: string): Promise<{
    tvl: number;
    volume24h: number;
    fees24h: number;
    apy: number;
    activeHooks: string[];
    dynamicFeeRange: { min: number; max: number };
    limitOrders: number;
    twapOrders: number;
  }> {
    try {
      const pools = await this.getPools();
      const pool = pools.find((p) => p.id === poolId);

      if (!pool) {
        throw new Error("Pool not found");
      }

      return {
        tvl: pool.tvl,
        volume24h: pool.volume24h,
        fees24h: (pool.volume24h * pool.fee) / 10000,
        apy: pool.apy,
        activeHooks: pool.hooks,
        dynamicFeeRange: { min: 10, max: 100 },
        limitOrders: 45,
        twapOrders: 12,
      };
    } catch (error) {
      console.error("Error fetching pool stats:", error);
      throw error;
    }
  }

  /**
   * Swap with custom hook parameters
   */
  async swapWithHooks(params: {
    poolAddress: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    minAmountOut: number;
    userAddress: string;
    hooks?: {
      dynamicFee?: boolean;
      nftGated?: boolean;
    };
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Calculate fee with hooks
      const { fee } = await this.calculateDynamicFee(
        params.poolAddress,
        params.tokenIn,
        params.tokenOut,
        params.amountIn
      );

      // Check NFT eligibility if applicable
      let finalFee = fee;
      if (params.hooks?.nftGated) {
        const { eligible, discount } = await this.checkNFTEligibility(
          params.userAddress,
          params.poolAddress
        );
        if (eligible) {
          finalFee = (fee * (100 - discount)) / 100;
        }
      }

      console.log("Executing swap with hooks:", {
        ...params,
        calculatedFee: finalFee,
      });

      // In production, execute the actual swap
      return {
        success: true,
        txHash: "0x" + Math.random().toString(16).substring(2),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const tappExchangeService = new TappExchangeService();
