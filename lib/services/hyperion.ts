import axios from "axios";
import { aptos } from "../aptos";

const HYPERION_API_BASE_URL = "https://api.hyperion.xyz";

const hyperionApi = axios.create({
  baseURL: HYPERION_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Pool {
  id: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  liquidity: number;
  tvl: number;
  apy: number;
  volume24h: number;
}

export interface Position {
  id: string;
  poolId: string;
  owner: string;
  liquidity: number;
  tickLower: number;
  tickUpper: number;
  feesEarned: number;
}

export interface AddLiquidityParams {
  poolId: string;
  tokenAAmount: number;
  tokenBAmount: number;
  tickLower: number;
  tickUpper: number;
  slippage: number;
}

class HyperionService {
  // Get all CLMM pools
  async getPools(): Promise<Pool[]> {
    try {
      const response = await hyperionApi.get("/pools");
      return response.data;
    } catch (error) {
      console.error("Error fetching pools:", error);
      return this.getMockPools();
    }
  }

  // Get pool by ID
  async getPool(poolId: string): Promise<Pool> {
    try {
      const response = await hyperionApi.get(`/pools/${poolId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching pool:", error);
      return this.getMockPool(poolId);
    }
  }

  // Get user positions
  async getPositions(userAddress: string): Promise<Position[]> {
    try {
      const response = await hyperionApi.get(`/positions/${userAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      return [];
    }
  }

  // Get position by ID
  async getPosition(positionId: string): Promise<Position> {
    try {
      const response = await hyperionApi.get(`/position/${positionId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching position:", error);
      throw error;
    }
  }

  // Calculate optimal tick range based on volatility
  calculateOptimalRange(
    currentPrice: number,
    volatility: number
  ): { tickLower: number; tickUpper: number } {
    // Simplified calculation - in production, use historical data
    const range = volatility * currentPrice;
    const tickLower = Math.floor((currentPrice - range) / 0.01);
    const tickUpper = Math.ceil((currentPrice + range) / 0.01);
    return { tickLower, tickUpper };
  }

  // Add liquidity to pool
  async addLiquidity(params: AddLiquidityParams): Promise<any> {
    try {
      // In production, this would build and submit a transaction
      // For now, we'll simulate the transaction
      console.log("Adding liquidity with params:", params);
      return {
        success: true,
        positionId: `pos_${Date.now()}`,
        liquidity: params.tokenAAmount + params.tokenBAmount,
      };
    } catch (error) {
      console.error("Error adding liquidity:", error);
      throw error;
    }
  }

  // Remove liquidity from position
  async removeLiquidity(positionId: string, percentage: number): Promise<any> {
    try {
      console.log(`Removing ${percentage}% liquidity from position ${positionId}`);
      return {
        success: true,
        positionId,
        amountRemoved: percentage,
      };
    } catch (error) {
      console.error("Error removing liquidity:", error);
      throw error;
    }
  }

  // Collect fees from position
  async collectFees(positionId: string): Promise<any> {
    try {
      console.log(`Collecting fees from position ${positionId}`);
      return {
        success: true,
        positionId,
        feesCollected: Math.random() * 100,
      };
    } catch (error) {
      console.error("Error collecting fees:", error);
      throw error;
    }
  }

  // Swap tokens
  async swap(
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    minAmountOut: number
  ): Promise<any> {
    try {
      console.log(`Swapping ${amountIn} ${tokenIn} for ${tokenOut}`);
      return {
        success: true,
        amountOut: amountIn * 0.99, // Simplified
        priceImpact: 0.5,
      };
    } catch (error) {
      console.error("Error swapping:", error);
      throw error;
    }
  }

  // Calculate impermanent loss
  calculateImpermanentLoss(
    priceChange: number
  ): number {
    // IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const priceRatio = 1 + priceChange / 100;
    return (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
  }

  // Mock data for development
  private getMockPools(): Pool[] {
    return [
      {
        id: "pool_1",
        tokenA: "APT",
        tokenB: "USDC",
        fee: 0.3,
        liquidity: 5000000,
        tvl: 2500000,
        apy: 24.5,
        volume24h: 1200000,
      },
      {
        id: "pool_2",
        tokenA: "BTC",
        tokenB: "USDC",
        fee: 0.3,
        liquidity: 8000000,
        tvl: 4000000,
        apy: 18.2,
        volume24h: 3500000,
      },
      {
        id: "pool_3",
        tokenA: "ETH",
        tokenB: "USDC",
        fee: 0.3,
        liquidity: 6500000,
        tvl: 3250000,
        apy: 21.8,
        volume24h: 2100000,
      },
    ];
  }

  private getMockPool(poolId: string): Pool {
    return {
      id: poolId,
      tokenA: "APT",
      tokenB: "USDC",
      fee: 0.3,
      liquidity: 5000000,
      tvl: 2500000,
      apy: 24.5,
      volume24h: 1200000,
    };
  }
}

export const hyperionService = new HyperionService();
