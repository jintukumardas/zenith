"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Play,
  Pause,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  fundingArbEngine,
  type ArbitrageOpportunity,
  type ActiveArbPosition,
} from "@/lib/services/funding-arb-engine";
import { useToast } from "@/hooks/use-toast";

export default function ArbitragePage() {
  const { connected, account } = useWallet();
  const { toast } = useToast();

  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    []
  );
  const [activePositions, setActivePositions] = useState<ActiveArbPosition[]>(
    []
  );
  const [isScanning, setIsScanning] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(
    null
  );
  const [investAmount, setInvestAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && account) {
      loadData();
    }
  }, [connected, account]);

  const loadData = async () => {
    try {
      const [opps, positions] = await Promise.all([
        fundingArbEngine.scanMarkets(),
        account
          ? fundingArbEngine.monitorPositions(account.address)
          : Promise.resolve([]),
      ]);

      setOpportunities(opps);
      setActivePositions(positions);
    } catch (error) {
      console.error("Error loading arbitrage data:", error);
    }
  };

  const toggleScanning = () => {
    if (isScanning) {
      fundingArbEngine.stopScanning();
      setIsScanning(false);
      toast({
        title: "Scanner Stopped",
        description: "Funding rate scanner has been stopped.",
      });
    } else {
      fundingArbEngine.startScanning((opp) => {
        toast({
          title: "New Opportunity Found!",
          description: `${opp.market}: ${formatPercentage(opp.expectedAPY)} APY`,
        });
        loadData();
      });
      setIsScanning(true);
      toast({
        title: "Scanner Started",
        description: "Scanning for funding rate arbitrage opportunities...",
      });
    }
  };

  const executeArbitrage = async () => {
    if (!selectedOpp || !account || !investAmount) return;

    setLoading(true);
    try {
      const amount = parseFloat(investAmount);
      const result = await fundingArbEngine.executeArbitrage(
        selectedOpp,
        account.address,
        amount
      );

      if (result.success) {
        toast({
          title: "Success!",
          description: `Arbitrage position opened. ID: ${result.positionId}`,
        });
        setSelectedOpp(null);
        setInvestAmount("");
        await loadData();
      } else {
        toast({
          title: "Failed",
          description: result.error || "Failed to execute arbitrage",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPnL = fundingArbEngine.calculateTotalPnL(activePositions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funding Rate Arbitrage</h1>
          <p className="text-muted-foreground">
            Automated arbitrage using Kana Labs Perpetuals
          </p>
        </div>
        <Button
          onClick={toggleScanning}
          variant={isScanning ? "destructive" : "default"}
          size="lg"
        >
          {isScanning ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Stop Scanner
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Scanner
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      {activePositions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Positions
                  </p>
                  <p className="text-2xl font-bold">
                    {activePositions.length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total PnL</p>
                  <p
                    className={`text-2xl font-bold ${
                      totalPnL.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(totalPnL.totalPnL)}
                  </p>
                </div>
                <DollarSign
                  className={`h-8 w-8 ${
                    totalPnL.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Funding Accrued
                  </p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(totalPnL.totalFundingAccrued)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Unrealized PnL
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      totalPnL.totalUnrealizedPnL >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {formatCurrency(totalPnL.totalUnrealizedPnL)}
                  </p>
                </div>
                <TrendingUp
                  className={`h-8 w-8 ${
                    totalPnL.totalUnrealizedPnL >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Live Opportunities</CardTitle>
          <CardDescription>
            Current funding rate arbitrage opportunities across markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isScanning
                  ? "Scanning for opportunities..."
                  : "Start the scanner to find opportunities"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => setSelectedOpp(opp)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-lg">{opp.market}</p>
                      <Badge variant="outline">{opp.strategy}</Badge>
                      <Badge
                        variant={
                          opp.confidence > 0.7 ? "default" : "secondary"
                        }
                      >
                        {(opp.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Optimal Size: {formatCurrency(opp.optimalSize)} |
                      Required: {formatCurrency(opp.requiredCollateral)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {formatPercentage(opp.expectedAPY)}
                      </p>
                      <p className="text-sm text-muted-foreground">APY</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-semibold">
                        {formatCurrency(opp.estimatedProfit24h)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Est. 24h Profit
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          opp.riskScore < 30
                            ? "bg-green-500"
                            : opp.riskScore < 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                      <p className="text-sm text-muted-foreground">
                        Risk: {opp.riskScore.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execute Modal */}
      {selectedOpp && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Execute Arbitrage</CardTitle>
            <CardDescription>
              {selectedOpp.market} - {formatPercentage(selectedOpp.expectedAPY)}{" "}
              APY
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Strategy</p>
                <p className="font-semibold">{selectedOpp.strategy}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Confidence</p>
                <p className="font-semibold">
                  {(selectedOpp.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Optimal Size</p>
                <p className="font-semibold">
                  {formatCurrency(selectedOpp.optimalSize)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Required Collateral</p>
                <p className="font-semibold">
                  {formatCurrency(selectedOpp.requiredCollateral)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Investment Amount</label>
              <Input
                type="number"
                placeholder="Enter amount in USD"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: {formatCurrency(selectedOpp.requiredCollateral)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={executeArbitrage}
                disabled={
                  loading ||
                  !investAmount ||
                  parseFloat(investAmount) < selectedOpp.requiredCollateral
                }
                className="flex-1"
              >
                {loading ? "Executing..." : "Execute"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedOpp(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Positions */}
      {activePositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
            <CardDescription>Your current arbitrage positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePositions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {pos.opportunity?.market || "N/A"}
                      </p>
                      <Badge
                        variant={
                          pos.status === "active" ? "default" : "secondary"
                        }
                      >
                        {pos.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Size: {formatCurrency(pos.size)} | Collateral:{" "}
                      {formatCurrency(pos.collateral)}
                    </p>
                  </div>

                  <div className="flex gap-6 text-right">
                    <div>
                      <p
                        className={`text-lg font-semibold ${
                          pos.unrealizedPnL >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {formatCurrency(pos.unrealizedPnL)}
                      </p>
                      <p className="text-sm text-muted-foreground">Price PnL</p>
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-green-500">
                        +{formatCurrency(pos.fundingAccrued)}
                      </p>
                      <p className="text-sm text-muted-foreground">Funding</p>
                    </div>

                    <Button size="sm" variant="outline">
                      Close
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!connected && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">
              Connect Your Wallet
            </p>
            <p className="text-muted-foreground">
              Connect your wallet to start arbitrage trading
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
