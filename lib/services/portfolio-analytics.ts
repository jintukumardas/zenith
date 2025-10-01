import { noditService } from "./nodit";
import { pythOracleService } from "./pyth-oracle";
import { kanaPerpsService } from "./kana-perps";
import { vaultAggregatorService } from "./vault-aggregator";
import { fundingArbEngine } from "./funding-arb-engine";

export interface PortfolioPosition {
  id: string;
  type: "spot" | "perp" | "vault" | "arb";
  token: string;
  amount: number;
  value: number; // USD value
  costBasis: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  entryTime: number;
}

export interface PortfolioStats {
  totalValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: {
    spot: number;
    perps: number;
    vaults: number;
    arb: number;
  };
  riskMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
  };
}

export interface Transaction {
  hash: string;
  type: "deposit" | "withdraw" | "swap" | "trade" | "harvest";
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  token: string;
  status: "success" | "failed" | "pending";
  gasFee: number;
}

export interface PerformanceData {
  timestamp: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

class PortfolioAnalyticsService {
  private webhookSubscriptions: Map<string, any> = new Map();
  private performanceHistory: Map<string, PerformanceData[]> = new Map();

  /**
   * Get comprehensive portfolio overview
   */
  async getPortfolioOverview(
    userAddress: string
  ): Promise<{ positions: PortfolioPosition[]; stats: PortfolioStats }> {
    try {
      const [spotPositions, perpPositions, vaultPositions, arbPositions] =
        await Promise.all([
          this.getSpotPositions(userAddress),
          this.getPerpPositions(userAddress),
          this.getVaultPositions(userAddress),
          this.getArbPositions(userAddress),
        ]);

      const allPositions = [
        ...spotPositions,
        ...perpPositions,
        ...vaultPositions,
        ...arbPositions,
      ];

      const stats = this.calculatePortfolioStats(allPositions);

      return {
        positions: allPositions.sort((a, b) => b.value - a.value),
        stats,
      };
    } catch (error) {
      console.error("Error fetching portfolio overview:", error);
      return {
        positions: [],
        stats: this.getEmptyStats(),
      };
    }
  }

  /**
   * Get spot positions from wallet
   */
  private async getSpotPositions(
    userAddress: string
  ): Promise<PortfolioPosition[]> {
    try {
      const resources = await noditService.getAccountResources(userAddress);
      const positions: PortfolioPosition[] = [];

      // Get current prices
      const markets = await pythOracleService.getAllMarkets();
      const priceMap = new Map(markets.map((m) => [m.symbol, m.price]));

      for (const resource of resources) {
        if (resource.type.includes("0x1::coin::CoinStore")) {
          const coinType = resource.type.match(/<(.+)>/)?.[1] || "";
          const data = resource.data as any;
          const amount = parseInt(data.coin.value) / 1e8; // Assume 8 decimals

          if (amount > 0) {
            // Extract token symbol from coin type
            const symbol = coinType.split("::").pop() || "UNKNOWN";
            const price = priceMap.get(symbol) || 0;
            const value = amount * price;

            // Simplified cost basis (would need historical data)
            const costBasis = value * 0.95; // Assume 5% gain

            positions.push({
              id: `spot-${symbol}-${userAddress}`,
              type: "spot",
              token: symbol,
              amount,
              value,
              costBasis,
              currentPrice: price,
              unrealizedPnL: value - costBasis,
              unrealizedPnLPercent: ((value - costBasis) / costBasis) * 100,
              entryTime: Date.now() - 86400000, // Assume 1 day ago
            });
          }
        }
      }

      return positions;
    } catch (error) {
      console.error("Error fetching spot positions:", error);
      return [];
    }
  }

  /**
   * Get perpetual positions
   */
  private async getPerpPositions(
    userAddress: string
  ): Promise<PortfolioPosition[]> {
    try {
      const perpPositions = await kanaPerpsService.getPositions(userAddress);
      return perpPositions.map((pos) => ({
        id: `perp-${pos.id}`,
        type: "perp" as const,
        token: pos.market.replace("-PERP", ""),
        amount: pos.size,
        value: pos.margin + pos.unrealizedPnl,
        costBasis: pos.margin,
        currentPrice: pos.entryPrice * (1 + pos.unrealizedPnl / pos.margin),
        unrealizedPnL: pos.unrealizedPnl,
        unrealizedPnLPercent: (pos.unrealizedPnl / pos.margin) * 100,
        entryTime: Date.now() - 3600000, // Simplified
      }));
    } catch (error) {
      console.error("Error fetching perp positions:", error);
      return [];
    }
  }

  /**
   * Get vault positions
   */
  private async getVaultPositions(
    userAddress: string
  ): Promise<PortfolioPosition[]> {
    try {
      const vaultData = await vaultAggregatorService.getAggregatedVaults(
        userAddress
      );

      return vaultData.vaults
        .filter((v) => v.userPosition)
        .map((vault) => {
          const position = vault.userPosition!;
          return {
            id: `vault-${vault.id}`,
            type: "vault" as const,
            token: `${vault.token0}/${vault.token1}`,
            amount: position.shares,
            value: position.value,
            costBasis: position.value * 0.95, // Simplified
            currentPrice: position.value / position.shares,
            unrealizedPnL: position.value * 0.05,
            unrealizedPnLPercent: 5,
            entryTime: position.depositedAt,
          };
        });
    } catch (error) {
      console.error("Error fetching vault positions:", error);
      return [];
    }
  }

  /**
   * Get arbitrage positions
   */
  private async getArbPositions(
    userAddress: string
  ): Promise<PortfolioPosition[]> {
    try {
      const arbPositions = await fundingArbEngine.monitorPositions(
        userAddress
      );

      return arbPositions.map((pos) => ({
        id: `arb-${pos.id}`,
        type: "arb" as const,
        token: pos.opportunity?.market || "ARB",
        amount: pos.size,
        value: pos.collateral + pos.unrealizedPnL + pos.fundingAccrued,
        costBasis: pos.collateral,
        currentPrice: pos.entryPrice,
        unrealizedPnL: pos.unrealizedPnL + pos.fundingAccrued,
        unrealizedPnLPercent:
          ((pos.unrealizedPnL + pos.fundingAccrued) / pos.collateral) * 100,
        entryTime: pos.entryTime,
      }));
    } catch (error) {
      console.error("Error fetching arb positions:", error);
      return [];
    }
  }

  /**
   * Calculate portfolio statistics
   */
  private calculatePortfolioStats(
    positions: PortfolioPosition[]
  ): PortfolioStats {
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    const totalCostBasis = positions.reduce((sum, p) => sum + p.costBasis, 0);
    const totalUnrealizedPnL = totalValue - totalCostBasis;
    const totalUnrealizedPnLPercent =
      totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

    // Calculate allocation
    const spotValue = positions
      .filter((p) => p.type === "spot")
      .reduce((sum, p) => sum + p.value, 0);
    const perpsValue = positions
      .filter((p) => p.type === "perp")
      .reduce((sum, p) => sum + p.value, 0);
    const vaultsValue = positions
      .filter((p) => p.type === "vault")
      .reduce((sum, p) => sum + p.value, 0);
    const arbValue = positions
      .filter((p) => p.type === "arb")
      .reduce((sum, p) => sum + p.value, 0);

    const allocation = {
      spot: totalValue > 0 ? (spotValue / totalValue) * 100 : 0,
      perps: totalValue > 0 ? (perpsValue / totalValue) * 100 : 0,
      vaults: totalValue > 0 ? (vaultsValue / totalValue) * 100 : 0,
      arb: totalValue > 0 ? (arbValue / totalValue) * 100 : 0,
    };

    // Simplified day change (would need historical data)
    const dayChange = totalUnrealizedPnL * 0.1; // Assume 10% is from today
    const dayChangePercent = totalCostBasis > 0 ? (dayChange / totalCostBasis) * 100 : 0;

    // Simplified risk metrics
    const riskMetrics = {
      sharpeRatio: 1.5,
      maxDrawdown: -8.5,
      volatility: 12.3,
    };

    return {
      totalValue,
      totalCostBasis,
      totalUnrealizedPnL,
      totalUnrealizedPnLPercent,
      dayChange,
      dayChangePercent,
      allocation,
      riskMetrics,
    };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userAddress: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    try {
      const txns = await noditService.getAccountTransactions(
        userAddress,
        limit
      );

      return txns.map((tx) => ({
        hash: tx.hash,
        type: this.inferTransactionType(tx),
        timestamp: tx.timestamp,
        from: tx.sender,
        to: tx.payload?.function || "",
        amount: 0, // Would need to parse from events
        token: "APT",
        status: tx.success ? "success" : "failed",
        gasFee: tx.gas_unit_price * tx.max_gas_amount,
      }));
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return [];
    }
  }

  /**
   * Subscribe to real-time updates via Nodit webhooks
   */
  subscribeToUpdates(
    userAddress: string,
    onUpdate: (data: any) => void
  ): () => void {
    // In production, this would set up a webhook with Nodit
    // For now, use polling
    const intervalId = setInterval(async () => {
      try {
        const portfolio = await this.getPortfolioOverview(userAddress);
        onUpdate(portfolio);
      } catch (error) {
        console.error("Error in portfolio update:", error);
      }
    }, 10000); // Poll every 10 seconds

    this.webhookSubscriptions.set(userAddress, intervalId);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      this.webhookSubscriptions.delete(userAddress);
    };
  }

  /**
   * Get performance history
   */
  async getPerformanceHistory(
    userAddress: string,
    period: "24h" | "7d" | "30d" | "all"
  ): Promise<PerformanceData[]> {
    try {
      // In production, this would fetch historical data
      // For now, generate sample data
      const dataPoints = period === "24h" ? 24 : period === "7d" ? 168 : 720;
      const current = await this.getPortfolioOverview(userAddress);
      const history: PerformanceData[] = [];

      const startValue = current.stats.totalCostBasis;
      const endValue = current.stats.totalValue;
      const change = endValue - startValue;

      for (let i = 0; i < dataPoints; i++) {
        const progress = i / dataPoints;
        const value = startValue + change * progress * (0.8 + Math.random() * 0.4);
        const pnl = value - startValue;
        const pnlPercent = (pnl / startValue) * 100;

        history.push({
          timestamp: Date.now() - (dataPoints - i) * 3600000,
          value,
          pnl,
          pnlPercent,
        });
      }

      return history;
    } catch (error) {
      console.error("Error fetching performance history:", error);
      return [];
    }
  }

  /**
   * Helper to infer transaction type
   */
  private inferTransactionType(tx: any): Transaction["type"] {
    const functionName = tx.payload?.function || "";

    if (functionName.includes("deposit")) return "deposit";
    if (functionName.includes("withdraw")) return "withdraw";
    if (functionName.includes("swap")) return "swap";
    if (functionName.includes("harvest")) return "harvest";
    return "trade";
  }

  /**
   * Get empty stats
   */
  private getEmptyStats(): PortfolioStats {
    return {
      totalValue: 0,
      totalCostBasis: 0,
      totalUnrealizedPnL: 0,
      totalUnrealizedPnLPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      allocation: {
        spot: 0,
        perps: 0,
        vaults: 0,
        arb: 0,
      },
      riskMetrics: {
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
      },
    };
  }
}

export const portfolioAnalytics = new PortfolioAnalyticsService();
