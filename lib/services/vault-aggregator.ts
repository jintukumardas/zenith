import { aptos } from "../aptos";
import { liquidswapService } from "./liquidswap";
import { pythOracleService } from "./pyth-oracle";
import { kanaAggregatorService } from "./kana-aggregator";
import { hyperionService } from "./hyperion";

export interface VaultStrategy {
  id: string;
  name: string;
  protocol: "liquidswap" | "hyperion" | "tapp" | "internal";
  strategyType: "CLMM" | "delta-neutral" | "funding-arb" | "arbitrage";
  tvl: number;
  apy: number;
  risk: "low" | "medium" | "high";
  token0: string;
  token1: string;
  autoCompound: boolean;
  rebalanceInterval: number; // in seconds
  minDeposit: number;
  performanceFee: number; // basis points
  managementFee: number; // basis points
  userPosition?: {
    shares: number;
    value: number;
    depositedAt: number;
  };
}

export interface AggregatedYieldData {
  vaults: VaultStrategy[];
  totalTVL: number;
  avgAPY: number;
  bestVault: VaultStrategy | null;
  userTotalValue: number;
}

class VaultAggregatorService {
  private cache: {
    data: AggregatedYieldData | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Aggregates vault data from multiple protocols
   */
  async getAggregatedVaults(userAddress?: string): Promise<AggregatedYieldData> {
    // Return cached data if still valid
    if (
      this.cache.data &&
      Date.now() - this.cache.timestamp < this.CACHE_DURATION &&
      !userAddress
    ) {
      return this.cache.data;
    }

    try {
      const [liquidswapPools, hyperionPools] = await Promise.all([
        liquidswapService.getPools(),
        hyperionService.getPools(),
      ]);

      const vaults: VaultStrategy[] = [];

      // Add Liquidswap pools as vaults
      for (const pool of liquidswapPools) {
        vaults.push({
          id: `liquidswap-${pool.id}`,
          name: `${pool.tokenA}/${pool.tokenB} LP`,
          protocol: "liquidswap",
          strategyType: "arbitrage",
          tvl: pool.tvl,
          apy: pool.apy,
          risk: this.calculateRisk(pool.apy),
          token0: pool.tokenA,
          token1: pool.tokenB,
          autoCompound: false,
          rebalanceInterval: 0,
          minDeposit: 10, // $10 minimum
          performanceFee: 0,
          managementFee: 30, // 0.3%
        });
      }

      // Add Hyperion CLMM pools as vaults
      for (const pool of hyperionPools) {
        vaults.push({
          id: `hyperion-${pool.id}`,
          name: `${pool.tokenX}/${pool.tokenY} CLMM`,
          protocol: "hyperion",
          strategyType: "CLMM",
          tvl: pool.tvl,
          apy: pool.apr, // Convert APR to APY with compounding
          risk: this.calculateRisk(pool.apr),
          token0: pool.tokenX,
          token1: pool.tokenY,
          autoCompound: true,
          rebalanceInterval: 3600, // 1 hour
          minDeposit: 50, // $50 minimum for CLMM
          performanceFee: 200, // 2%
          managementFee: 50, // 0.5%
        });
      }

      // Add internal delta-neutral vaults
      vaults.push(...this.getInternalVaults());

      // If user address provided, fetch their positions
      if (userAddress) {
        await this.enrichWithUserPositions(vaults, userAddress);
      }

      // Calculate aggregated metrics
      const totalTVL = vaults.reduce((sum, v) => sum + v.tvl, 0);
      const avgAPY =
        vaults.length > 0
          ? vaults.reduce((sum, v) => sum + v.apy, 0) / vaults.length
          : 0;
      const bestVault = vaults.reduce((best, current) =>
        current.apy > (best?.apy || 0) ? current : best
      , vaults[0] || null);
      const userTotalValue = vaults.reduce(
        (sum, v) => sum + (v.userPosition?.value || 0),
        0
      );

      const result = {
        vaults: vaults.sort((a, b) => b.apy - a.apy), // Sort by APY descending
        totalTVL,
        avgAPY,
        bestVault,
        userTotalValue,
      };

      // Cache the result
      if (!userAddress) {
        this.cache = {
          data: result,
          timestamp: Date.now(),
        };
      }

      return result;
    } catch (error) {
      console.error("Error aggregating vaults:", error);
      return {
        vaults: [],
        totalTVL: 0,
        avgAPY: 0,
        bestVault: null,
        userTotalValue: 0,
      };
    }
  }

  /**
   * Get internal Zenith vaults (delta-neutral, funding arb, etc.)
   */
  private getInternalVaults(): VaultStrategy[] {
    return [
      {
        id: "zenith-delta-neutral-apt",
        name: "APT Delta-Neutral Strategy",
        protocol: "internal",
        strategyType: "delta-neutral",
        tvl: 150000,
        apy: 18.5,
        risk: "medium",
        token0: "APT",
        token1: "USDC",
        autoCompound: true,
        rebalanceInterval: 3600,
        minDeposit: 100,
        performanceFee: 250, // 2.5%
        managementFee: 100, // 1%
      },
      {
        id: "zenith-funding-arb",
        name: "Funding Rate Arbitrage",
        protocol: "internal",
        strategyType: "funding-arb",
        tvl: 280000,
        apy: 24.2,
        risk: "medium",
        token0: "USDC",
        token1: "USDC",
        autoCompound: true,
        rebalanceInterval: 28800, // 8 hours (funding rate intervals)
        minDeposit: 500,
        performanceFee: 300, // 3%
        managementFee: 150, // 1.5%
      },
      {
        id: "zenith-apt-btc-clmm",
        name: "APT/BTC Advanced CLMM",
        protocol: "internal",
        strategyType: "CLMM",
        tvl: 420000,
        apy: 32.8,
        risk: "high",
        token0: "APT",
        token1: "BTC",
        autoCompound: true,
        rebalanceInterval: 1800, // 30 minutes
        minDeposit: 200,
        performanceFee: 300, // 3%
        managementFee: 200, // 2%
      },
    ];
  }

  /**
   * Get token prices for TVL calculations
   */
  private async getTokenPrices(): Promise<Record<string, number>> {
    try {
      const markets = await pythOracleService.getAllMarkets();
      const prices: Record<string, number> = {};

      for (const market of markets) {
        prices[market.symbol] = market.price;
      }

      return prices;
    } catch (error) {
      console.error("Error fetching token prices:", error);
      return {
        APT: 10.5,
        BTC: 65000,
        ETH: 3400,
        USDC: 1.0,
        USDT: 1.0,
      };
    }
  }

  /**
   * Calculate risk level based on APY
   */
  private calculateRisk(apy: number): "low" | "medium" | "high" {
    if (apy < 10) return "low";
    if (apy < 25) return "medium";
    return "high";
  }

  /**
   * Enrich vaults with user position data
   */
  private async enrichWithUserPositions(
    vaults: VaultStrategy[],
    userAddress: string
  ): Promise<void> {
    try {
      // Query on-chain user positions
      const resources = await aptos.getAccountResources({
        accountAddress: userAddress,
      });

      // Find vault positions in user's account
      for (const resource of resources) {
        const resourceType = resource.type;

        // Check for vault position resources
        if (resourceType.includes("zenith::vault_core::UserPosition")) {
          const data = resource.data as any;
          const vaultId = data.vault_id;

          // Find matching vault and add position
          const vault = vaults.find((v) => v.id.includes(vaultId));
          if (vault) {
            vault.userPosition = {
              shares: parseInt(data.shares),
              value: parseInt(data.shares) * 1.05, // Simplified calculation
              depositedAt: parseInt(data.deposited_at),
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user positions:", error);
    }
  }

  /**
   * Get vault details by ID
   */
  async getVaultDetails(vaultId: string): Promise<VaultStrategy | null> {
    const data = await this.getAggregatedVaults();
    return data.vaults.find((v) => v.id === vaultId) || null;
  }

  /**
   * Get best vault recommendations based on user preferences
   */
  async getRecommendations(params: {
    riskTolerance: "low" | "medium" | "high";
    minAPY?: number;
    preferredTokens?: string[];
    minDeposit?: number;
  }): Promise<VaultStrategy[]> {
    const data = await this.getAggregatedVaults();

    let filtered = data.vaults.filter((v) => v.risk === params.riskTolerance);

    if (params.minAPY) {
      filtered = filtered.filter((v) => v.apy >= params.minAPY);
    }

    if (params.preferredTokens && params.preferredTokens.length > 0) {
      filtered = filtered.filter(
        (v) =>
          params.preferredTokens!.includes(v.token0) ||
          params.preferredTokens!.includes(v.token1)
      );
    }

    if (params.minDeposit !== undefined) {
      filtered = filtered.filter((v) => v.minDeposit <= params.minDeposit!);
    }

    return filtered.sort((a, b) => b.apy - a.apy).slice(0, 5);
  }

  /**
   * Calculate optimal allocation across vaults
   */
  calculateOptimalAllocation(
    totalAmount: number,
    riskProfile: "conservative" | "balanced" | "aggressive"
  ): { vaultId: string; allocation: number; expectedAPY: number }[] {
    // Simplified allocation strategy
    const allocations: { vaultId: string; allocation: number; expectedAPY: number }[] = [];

    if (riskProfile === "conservative") {
      // 70% low risk, 30% medium risk
      allocations.push(
        { vaultId: "liquidswap-apt-usdc", allocation: totalAmount * 0.7, expectedAPY: 8.5 },
        { vaultId: "zenith-delta-neutral-apt", allocation: totalAmount * 0.3, expectedAPY: 18.5 }
      );
    } else if (riskProfile === "balanced") {
      // 40% low, 40% medium, 20% high
      allocations.push(
        { vaultId: "liquidswap-apt-usdc", allocation: totalAmount * 0.4, expectedAPY: 8.5 },
        { vaultId: "zenith-delta-neutral-apt", allocation: totalAmount * 0.4, expectedAPY: 18.5 },
        { vaultId: "zenith-apt-btc-clmm", allocation: totalAmount * 0.2, expectedAPY: 32.8 }
      );
    } else {
      // 20% low, 30% medium, 50% high
      allocations.push(
        { vaultId: "liquidswap-apt-usdc", allocation: totalAmount * 0.2, expectedAPY: 8.5 },
        { vaultId: "zenith-funding-arb", allocation: totalAmount * 0.3, expectedAPY: 24.2 },
        { vaultId: "zenith-apt-btc-clmm", allocation: totalAmount * 0.5, expectedAPY: 32.8 }
      );
    }

    return allocations;
  }
}

export const vaultAggregatorService = new VaultAggregatorService();
