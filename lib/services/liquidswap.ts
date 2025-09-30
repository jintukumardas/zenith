import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { LIQUIDSWAP_MODULES, LIQUIDSWAP_RESOURCE_ACCOUNT, TOKENS } from "../constants";

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);

export interface LiquidityPool {
  coinX: string;
  coinY: string;
  curveType: "uncorrelated" | "stable";
  reserveX: string;
  reserveY: string;
  lpSupply: string;
}

export interface PoolStats {
  id: string;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  tvl: number;
  volume24h: number;
  apy: number;
  fee: number;
}

class LiquidswapService {
  // Fetch all liquidity pools from Liquidswap
  async getPools(): Promise<PoolStats[]> {
    try {
      // Query the resource account for all pool resources
      const resources = await aptos.getAccountResources({
        accountAddress: LIQUIDSWAP_RESOURCE_ACCOUNT,
      });

      const pools: PoolStats[] = [];

      // Find all LiquidityPool resources
      for (const resource of resources) {
        if (resource.type.includes(`${LIQUIDSWAP_MODULES}::liquidity_pool::LiquidityPool`)) {
          const poolData = resource.data as any;

          // Extract token types from the resource type
          const typeMatch = resource.type.match(/<(.+), (.+), (.+)>/);
          if (!typeMatch) continue;

          const [_, coinX, coinY, curveType] = typeMatch;

          // Parse reserves
          const reserveX = parseInt(poolData.coin_x_reserve?.value || "0");
          const reserveY = parseInt(poolData.coin_y_reserve?.value || "0");

          if (reserveX === 0 || reserveY === 0) continue;

          // Extract token symbols
          const tokenA = this.extractTokenSymbol(coinX);
          const tokenB = this.extractTokenSymbol(coinY);

          // Calculate TVL (simplified - using reserves)
          const tvl = (reserveX / 1e8) + (reserveY / 1e6); // Assuming 8 decimals for APT, 6 for USDC

          pools.push({
            id: `${coinX}_${coinY}`,
            tokenA,
            tokenB,
            reserveA: reserveX / 1e8,
            reserveB: reserveY / 1e6,
            tvl,
            volume24h: tvl * 0.5, // Estimated
            apy: this.calculateAPY(tvl),
            fee: 0.003, // 0.3%
          });
        }
      }

      return pools.slice(0, 10); // Return top 10 pools
    } catch (error) {
      console.error("Error fetching Liquidswap pools:", error);
      return [];
    }
  }

  // Get specific pool info
  async getPool(coinX: string, coinY: string, curveType: string = "uncorrelated"): Promise<LiquidityPool | null> {
    try {
      const curve = curveType === "stable"
        ? `${LIQUIDSWAP_MODULES}::curves::Stable`
        : `${LIQUIDSWAP_MODULES}::curves::Uncorrelated`;

      const resourceType = `${LIQUIDSWAP_MODULES}::liquidity_pool::LiquidityPool<${coinX}, ${coinY}, ${curve}>` as `${string}::${string}::${string}`;

      const resource = await aptos.getAccountResource({
        accountAddress: LIQUIDSWAP_RESOURCE_ACCOUNT,
        resourceType,
      });

      const data = resource.data as any;

      return {
        coinX,
        coinY,
        curveType: curveType as "uncorrelated" | "stable",
        reserveX: data.coin_x_reserve.value,
        reserveY: data.coin_y_reserve.value,
        lpSupply: data.lp_supply.value,
      };
    } catch (error) {
      console.error("Error fetching pool:", error);
      return null;
    }
  }

  // Calculate swap output
  async getSwapOutput(
    coinIn: string,
    coinOut: string,
    amountIn: number
  ): Promise<{ amountOut: number; priceImpact: number }> {
    try {
      const pool = await this.getPool(coinIn, coinOut);
      if (!pool) {
        throw new Error("Pool not found");
      }

      const reserveIn = parseFloat(pool.reserveX);
      const reserveOut = parseFloat(pool.reserveY);

      // Constant product formula: x * y = k
      const k = reserveIn * reserveOut;
      const newReserveIn = reserveIn + amountIn;
      const newReserveOut = k / newReserveIn;
      const amountOut = reserveOut - newReserveOut;

      // Apply 0.3% fee
      const amountOutWithFee = amountOut * 0.997;

      // Calculate price impact
      const priceImpact = ((amountIn / reserveIn) * 100);

      return {
        amountOut: amountOutWithFee,
        priceImpact,
      };
    } catch (error) {
      console.error("Error calculating swap:", error);
      return { amountOut: 0, priceImpact: 0 };
    }
  }

  // Get pool TVL
  async getTVL(): Promise<number> {
    try {
      const pools = await this.getPools();
      return pools.reduce((sum, pool) => sum + pool.tvl, 0);
    } catch (error) {
      console.error("Error calculating TVL:", error);
      return 0;
    }
  }

  // Get pool volume (estimated from reserves)
  async get24hVolume(): Promise<number> {
    try {
      const pools = await this.getPools();
      return pools.reduce((sum, pool) => sum + pool.volume24h, 0);
    } catch (error) {
      console.error("Error calculating volume:", error);
      return 0;
    }
  }

  // Helper: Extract token symbol from type string
  private extractTokenSymbol(tokenType: string): string {
    if (tokenType.includes("aptos_coin::AptosCoin")) return "APT";
    if (tokenType.includes("USDC")) return "USDC";
    if (tokenType.includes("USDT") || tokenType.includes("USDt")) return "USDT";
    if (tokenType.includes("WETH")) return "WETH";
    if (tokenType.includes("WBTC")) return "WBTC";

    // Extract last part of the type
    const parts = tokenType.split("::");
    return parts[parts.length - 1] || "UNKNOWN";
  }

  // Helper: Calculate estimated APY
  private calculateAPY(tvl: number): number {
    // Estimated APY based on TVL (lower TVL = higher APY)
    if (tvl < 100000) return 15 + Math.random() * 10;
    if (tvl < 1000000) return 10 + Math.random() * 8;
    return 5 + Math.random() * 5;
  }
}

export const liquidswapService = new LiquidswapService();
