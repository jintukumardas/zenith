"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { pinataService, StrategyMetadata } from "@/lib/services/pinata-ipfs";
import { TrendingUp, Users, Award, Target, Star } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface Strategy extends StrategyMetadata {
  ipfsCid?: string;
}

export default function CopyTradingPage() {
  const { account } = useWallet();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = () => {
    // Mock strategies - in production, these would be loaded from IPFS
    const mockStrategies: Strategy[] = [
      {
        id: "1",
        name: "APT Bull Momentum",
        description: "Aggressive momentum strategy focusing on APT price breakouts with 70% win rate",
        performance: {
          totalReturn: 156.8,
          sharpeRatio: 2.4,
          maxDrawdown: -12.5,
          winRate: 70,
        },
        trades: 89,
        followers: 234,
        creator: "0x1234...5678",
        created: Date.now() - 30 * 24 * 60 * 60 * 1000,
      },
      {
        id: "2",
        name: "Stable Yield Farming",
        description: "Conservative USDC-based yield optimization with automated rebalancing",
        performance: {
          totalReturn: 42.3,
          sharpeRatio: 3.1,
          maxDrawdown: -3.2,
          winRate: 85,
        },
        trades: 156,
        followers: 567,
        creator: "0xabcd...ef12",
        created: Date.now() - 60 * 24 * 60 * 60 * 1000,
      },
      {
        id: "3",
        name: "DeFi Arbitrage Bot",
        description: "Cross-DEX arbitrage opportunities on Aptos with automated execution",
        performance: {
          totalReturn: 89.4,
          sharpeRatio: 2.8,
          maxDrawdown: -8.1,
          winRate: 78,
        },
        trades: 412,
        followers: 189,
        creator: "0x9876...4321",
        created: Date.now() - 45 * 24 * 60 * 60 * 1000,
      },
      {
        id: "4",
        name: "Multi-Chain Bridge Trader",
        description: "Exploits price differences across chains using LayerZero and Wormhole bridges",
        performance: {
          totalReturn: 124.7,
          sharpeRatio: 2.2,
          maxDrawdown: -15.8,
          winRate: 65,
        },
        trades: 67,
        followers: 145,
        creator: "0xdef0...789a",
        created: Date.now() - 20 * 24 * 60 * 60 * 1000,
      },
    ];

    setStrategies(mockStrategies);
  };

  const handleSubscribe = async (strategy: Strategy) => {
    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    setSubscribing(strategy.id);
    try {
      // Upload subscription to IPFS
      const subscriptionData = {
        strategyId: strategy.id,
        subscriber: account.address.toString(),
        subscribeAt: Date.now(),
        active: true,
      };

      const result = await pinataService.uploadJSON(subscriptionData, {
        name: `Subscription-${strategy.id}-${account.address.toString()}`,
        keyvalues: {
          type: "subscription",
          strategy: strategy.id,
          subscriber: account.address.toString(),
        },
      });

      alert(`Successfully subscribed to ${strategy.name}!\nIPFS CID: ${result.IpfsHash}`);
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Failed to subscribe. Check console for details.");
    } finally {
      setSubscribing(null);
    }
  };

  const getRiskLevel = (maxDrawdown: number): string => {
    if (Math.abs(maxDrawdown) < 5) return "Low";
    if (Math.abs(maxDrawdown) < 15) return "Medium";
    return "High";
  };

  const getRiskColor = (maxDrawdown: number): string => {
    if (Math.abs(maxDrawdown) < 5) return "text-green-500";
    if (Math.abs(maxDrawdown) < 15) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Copy Trading</h1>
        <p className="text-muted-foreground">
          Follow proven strategies with automated execution and IPFS-backed tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Strategies</p>
                <p className="text-2xl font-bold">{strategies.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Traders</p>
                <p className="text-2xl font-bold">
                  {strategies.reduce((sum, s) => sum + s.followers, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Return</p>
                <p className="text-2xl font-bold text-green-500">
                  {(
                    strategies.reduce((sum, s) => sum + s.performance.totalReturn, 0) /
                    strategies.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">
                  {strategies.reduce((sum, s) => sum + s.trades, 0).toLocaleString()}
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.map((strategy) => {
          const risk = getRiskLevel(strategy.performance.maxDrawdown);
          const riskColor = getRiskColor(strategy.performance.maxDrawdown);

          return (
            <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {strategy.name}
                      {strategy.performance.totalReturn > 100 && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{strategy.description}</CardDescription>
                  </div>
                  <span className={`text-sm font-semibold ${riskColor}`}>{risk} Risk</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className="text-xl font-bold text-green-500">
                      +{strategy.performance.totalReturn}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-xl font-bold">{strategy.performance.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-xl font-bold">{strategy.performance.sharpeRatio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className={`text-xl font-bold ${riskColor}`}>
                      {strategy.performance.maxDrawdown}%
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{strategy.followers} followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{strategy.trades} trades</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleSubscribe(strategy)}
                    disabled={!account || subscribing === strategy.id}
                  >
                    {subscribing === strategy.id
                      ? "Subscribing..."
                      : account
                      ? "Subscribe"
                      : "Connect Wallet"}
                  </Button>
                  <Button variant="outline" className="flex-1" disabled>
                    View Details
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Created by {strategy.creator.slice(0, 6)}...{strategy.creator.slice(-4)} •{" "}
                  {Math.floor((Date.now() - strategy.created) / (24 * 60 * 60 * 1000))} days ago
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
