import { kanaPerpsService } from "./kana-perps";
import { pythOracleService } from "./pyth-oracle";
import { aptos } from "../aptos";

export interface FundingRateData {
  market: string;
  fundingRate: number; // annual percentage
  fundingInterval: number; // seconds
  nextFundingTime: number;
  openInterest: number;
  longShortRatio: number;
}

export interface ArbitrageOpportunity {
  id: string;
  market: string;
  fundingRate: number;
  expectedAPY: number;
  optimalSize: number;
  requiredCollateral: number;
  riskScore: number;
  strategy: "long-perp" | "short-perp" | "basis-trade";
  confidence: number;
  expiresAt: number;
  estimatedProfit24h: number;
}

export interface ActiveArbPosition {
  id: string;
  opportunity: ArbitrageOpportunity;
  entryTime: number;
  entryPrice: number;
  size: number;
  collateral: number;
  unrealizedPnL: number;
  fundingAccrued: number;
  status: "active" | "closing" | "closed";
}

class FundingArbEngineService {
  private opportunities: ArbitrageOpportunity[] = [];
  private scanInterval: NodeJS.Timeout | null = null;
  private readonly SCAN_FREQUENCY = 60000; // 1 minute
  private readonly MIN_FUNDING_RATE = 0.05; // 5% APY minimum
  private readonly MAX_LEVERAGE = 3; // 3x maximum for safety

  /**
   * Start scanning for arbitrage opportunities
   */
  startScanning(
    onOpportunityFound?: (opportunity: ArbitrageOpportunity) => void
  ): void {
    if (this.scanInterval) {
      console.log("Scanning already active");
      return;
    }

    console.log("Starting funding rate arbitrage scanner...");

    const scan = async () => {
      try {
        const opportunities = await this.scanMarkets();
        this.opportunities = opportunities;

        // Notify about new high-value opportunities
        const highValueOpps = opportunities.filter(
          (opp) => opp.expectedAPY > 20 && opp.confidence > 0.7
        );

        for (const opp of highValueOpps) {
          onOpportunityFound?.(opp);
        }
      } catch (error) {
        console.error("Error scanning markets:", error);
      }
    };

    // Initial scan
    scan();

    // Set up interval
    this.scanInterval = setInterval(scan, this.SCAN_FREQUENCY);
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      console.log("Stopped funding rate arbitrage scanner");
    }
  }

  /**
   * Scan all markets for arbitrage opportunities
   */
  async scanMarkets(): Promise<ArbitrageOpportunity[]> {
    try {
      const [fundingRates, markets, spotPrices] = await Promise.all([
        kanaPerpsService.getFundingRates(),
        kanaPerpsService.getAllMarkets(),
        pythOracleService.getAllMarkets(),
      ]);

      const opportunities: ArbitrageOpportunity[] = [];

      for (const [market, fundingRate] of Object.entries(fundingRates)) {
        const marketData = markets.find((m) => m.symbol === market);
        const spotPrice = spotPrices.find((p) =>
          market.includes(p.symbol.replace("/USD", ""))
        );

        if (!marketData || !spotPrice) continue;

        // Calculate annualized funding rate (assuming 8-hour funding)
        const annualizedRate = fundingRate * 365 * 3; // 3 times per day

        // Only consider if funding rate meets minimum threshold
        if (Math.abs(annualizedRate) < this.MIN_FUNDING_RATE) continue;

        // Calculate optimal position size based on liquidity
        const optimalSize = Math.min(
          marketData.openInterest * 0.01, // Max 1% of OI
          100000 // Max $100k per position
        );

        // Calculate required collateral (with leverage)
        const leverage = Math.min(
          this.MAX_LEVERAGE,
          Math.floor(100 / Math.abs(annualizedRate * 100))
        );
        const requiredCollateral = optimalSize / leverage;

        // Calculate basis (difference between perp and spot)
        const basis =
          ((marketData.price - spotPrice.price) / spotPrice.price) * 100;

        // Determine strategy
        let strategy: "long-perp" | "short-perp" | "basis-trade";
        let expectedAPY: number;

        if (fundingRate > 0) {
          // Positive funding - shorts pay longs
          strategy = "long-perp";
          expectedAPY = annualizedRate * 100;
        } else {
          // Negative funding - longs pay shorts
          strategy = "short-perp";
          expectedAPY = Math.abs(annualizedRate) * 100;
        }

        // If basis is significant, consider basis trade
        if (Math.abs(basis) > 0.5) {
          strategy = "basis-trade";
          expectedAPY = Math.abs(annualizedRate) * 100 + Math.abs(basis);
        }

        // Calculate risk score (lower is better)
        const riskScore = this.calculateRiskScore(
          marketData,
          annualizedRate,
          basis
        );

        // Calculate confidence based on market conditions
        const confidence = this.calculateConfidence(
          marketData,
          spotPrice,
          fundingRate
        );

        // Estimate 24h profit
        const estimatedProfit24h =
          (optimalSize * Math.abs(annualizedRate)) / 365;

        const opportunity: ArbitrageOpportunity = {
          id: `arb-${market}-${Date.now()}`,
          market,
          fundingRate: annualizedRate * 100,
          expectedAPY,
          optimalSize,
          requiredCollateral,
          riskScore,
          strategy,
          confidence,
          expiresAt: Date.now() + 28800000, // 8 hours
          estimatedProfit24h,
        };

        opportunities.push(opportunity);
      }

      return opportunities.sort((a, b) => b.expectedAPY - a.expectedAPY);
    } catch (error) {
      console.error("Error scanning markets:", error);
      return [];
    }
  }

  /**
   * Get current opportunities
   */
  getOpportunities(): ArbitrageOpportunity[] {
    // Filter out expired opportunities
    const now = Date.now();
    return this.opportunities.filter((opp) => opp.expiresAt > now);
  }

  /**
   * Get best opportunity based on criteria
   */
  getBestOpportunity(params?: {
    minAPY?: number;
    maxRisk?: number;
    preferredMarket?: string;
  }): ArbitrageOpportunity | null {
    let opportunities = this.getOpportunities();

    if (params?.minAPY) {
      opportunities = opportunities.filter(
        (opp) => opp.expectedAPY >= params.minAPY!
      );
    }

    if (params?.maxRisk) {
      opportunities = opportunities.filter(
        (opp) => opp.riskScore <= params.maxRisk!
      );
    }

    if (params?.preferredMarket) {
      const preferred = opportunities.find(
        (opp) => opp.market === params.preferredMarket
      );
      if (preferred) return preferred;
    }

    // Return highest APY with good confidence
    return (
      opportunities
        .filter((opp) => opp.confidence > 0.6)
        .sort((a, b) => b.expectedAPY - a.expectedAPY)[0] || null
    );
  }

  /**
   * Execute arbitrage opportunity
   */
  async executeArbitrage(
    opportunity: ArbitrageOpportunity,
    userAddress: string,
    amount: number
  ): Promise<{ success: boolean; positionId?: string; error?: string }> {
    try {
      // Validate amount
      if (amount < opportunity.requiredCollateral) {
        return {
          success: false,
          error: `Insufficient collateral. Required: $${opportunity.requiredCollateral}`,
        };
      }

      // Calculate position size based on amount
      const leverage = Math.min(
        this.MAX_LEVERAGE,
        opportunity.optimalSize / amount
      );
      const positionSize = amount * leverage;

      // Determine side based on strategy
      const side = opportunity.strategy === "long-perp" ? "long" : "short";

      // Get current market price
      const marketData = await kanaPerpsService.getMarketData(
        opportunity.market
      );

      // Place the perp order
      const orderResult = await kanaPerpsService.placeOrder({
        market: opportunity.market,
        side,
        type: "market",
        size: positionSize,
        leverage,
      });

      // If basis trade, also execute spot side
      if (opportunity.strategy === "basis-trade") {
        // Execute spot trade via Kana Aggregator
        // This would hedge the perp position
        console.log("Executing spot hedge for basis trade...");
      }

      // Record position on-chain
      // This would call the funding_arbitrage.move contract
      console.log("Recording position on-chain...");

      return {
        success: true,
        positionId: orderResult.id || `pos-${Date.now()}`,
      };
    } catch (error: any) {
      console.error("Error executing arbitrage:", error);
      return {
        success: false,
        error: error.message || "Failed to execute arbitrage",
      };
    }
  }

  /**
   * Monitor active positions
   */
  async monitorPositions(userAddress: string): Promise<ActiveArbPosition[]> {
    try {
      // Get user's open perp positions
      const perpPositions = await kanaPerpsService.getPositions(userAddress);

      const activePositions: ActiveArbPosition[] = [];

      for (const position of perpPositions) {
        // Get current market data
        const marketData = await kanaPerpsService.getMarketData(
          position.market
        );

        // Calculate funding accrued (simplified)
        const hoursHeld =
          (Date.now() - Date.parse(position.entryPrice.toString())) /
          (1000 * 3600);
        const fundingPeriods = Math.floor(hoursHeld / 8);
        const fundingAccrued =
          (position.size *
            marketData.fundingRate *
            fundingPeriods *
            (position.side === "long" ? 1 : -1)) /
          100;

        // Find original opportunity (if still available)
        const opportunity = this.opportunities.find(
          (opp) => opp.market === position.market
        );

        activePositions.push({
          id: position.id,
          opportunity: opportunity || ({} as ArbitrageOpportunity),
          entryTime: Date.now() - hoursHeld * 3600000,
          entryPrice: position.entryPrice,
          size: position.size,
          collateral: position.margin,
          unrealizedPnL: position.unrealizedPnl,
          fundingAccrued,
          status: "active",
        });
      }

      return activePositions;
    } catch (error) {
      console.error("Error monitoring positions:", error);
      return [];
    }
  }

  /**
   * Calculate risk score for opportunity
   */
  private calculateRiskScore(
    marketData: any,
    fundingRate: number,
    basis: number
  ): number {
    let score = 0;

    // Higher funding rate = higher risk
    score += Math.abs(fundingRate) * 10;

    // Large basis = higher risk
    score += Math.abs(basis) * 5;

    // Low liquidity = higher risk
    if (marketData.volume24h < 1000000) score += 20;

    // High volatility = higher risk
    const volatility =
      ((marketData.high24h - marketData.low24h) / marketData.price) * 100;
    score += volatility * 2;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate confidence level for opportunity
   */
  private calculateConfidence(
    marketData: any,
    spotPrice: any,
    fundingRate: number
  ): number {
    let confidence = 0.5;

    // High volume = higher confidence
    if (marketData.volume24h > 10000000) confidence += 0.2;
    else if (marketData.volume24h > 1000000) confidence += 0.1;

    // Consistent funding = higher confidence
    if (Math.abs(fundingRate) > 0.0001 && Math.abs(fundingRate) < 0.001) {
      confidence += 0.2;
    }

    // Low volatility = higher confidence
    const volatility =
      ((marketData.high24h - marketData.low24h) / marketData.price) * 100;
    if (volatility < 5) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Calculate total PnL for all positions
   */
  calculateTotalPnL(positions: ActiveArbPosition[]): {
    totalUnrealizedPnL: number;
    totalFundingAccrued: number;
    totalPnL: number;
  } {
    const totalUnrealizedPnL = positions.reduce(
      (sum, pos) => sum + pos.unrealizedPnL,
      0
    );
    const totalFundingAccrued = positions.reduce(
      (sum, pos) => sum + pos.fundingAccrued,
      0
    );

    return {
      totalUnrealizedPnL,
      totalFundingAccrued,
      totalPnL: totalUnrealizedPnL + totalFundingAccrued,
    };
  }
}

export const fundingArbEngine = new FundingArbEngineService();
