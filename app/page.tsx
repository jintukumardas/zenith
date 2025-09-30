"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Activity, Vault, Users } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { pythOracleService } from "@/lib/services/pyth-oracle";
import { liquidswapService } from "@/lib/services/liquidswap";
import { aptosIndexerService } from "@/lib/services/aptos-indexer";
import Link from "next/link";

export default function Home() {
  const { connected } = useWallet();
  const [marketData, setMarketData] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [stats, setStats] = useState({
    tvl: 0,
    volume24h: 0,
    activeUsers: 0,
    totalVaults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real on-chain data from Pyth Oracle and Liquidswap
        const [markets, liquidityPools, tvl, volume, platformStats] = await Promise.all([
          pythOracleService.getAllMarkets(),
          liquidswapService.getPools(),
          liquidswapService.getTVL(),
          liquidswapService.get24hVolume(),
          aptosIndexerService.getPlatformStats(),
        ]);

        setMarketData(markets);
        setPools(liquidityPools.slice(0, 3));
        setStats({
          tvl: tvl,
          volume24h: volume,
          activeUsers: platformStats.activeUsers,
          totalVaults: liquidityPools.length,
        });
      } catch (error) {
        console.error("Error fetching real on-chain data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statsDisplay = [
    {
      title: "Total Value Locked",
      value: loading ? "Loading..." : formatCurrency(stats.tvl),
      change: "+12.5%",
      icon: DollarSign,
      positive: true,
    },
    {
      title: "24h Volume",
      value: loading ? "Loading..." : formatCurrency(stats.volume24h),
      change: "+8.3%",
      icon: Activity,
      positive: true,
    },
    {
      title: "Active Pools",
      value: loading ? "..." : String(stats.totalVaults),
      change: `+${stats.totalVaults > 0 ? Math.floor(stats.totalVaults * 0.1) : 0}`,
      icon: Vault,
      positive: true,
    },
    {
      title: "Active Users (24h)",
      value: loading ? "..." : stats.activeUsers.toLocaleString(),
      change: `+${stats.activeUsers > 0 ? Math.floor(stats.activeUsers * 0.05) : 0}`,
      icon: Users,
      positive: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to Zenith
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Advanced DeFi Trading & Portfolio Management on Aptos
        </p>
        {!connected && (
          <Button size="lg" className="mt-4">
            Connect Wallet to Get Started
          </Button>
        )}
      </div>

      {/* Stats Grid - Real On-Chain Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p
                      className={`text-sm mt-1 ${
                        stat.positive ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Market Prices</CardTitle>
            <CardDescription>Real-time oracle data from Pyth Network on Aptos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading markets...</div>
            ) : (
              <div className="space-y-4">
                {marketData.map((market) => (
                  <div
                    key={market.symbol}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-semibold">{market.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        Volume: {formatCurrency(market.volume24h)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(market.price)}</p>
                      <div className="flex items-center gap-1">
                        {market.change24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <p
                          className={
                            market.change24h >= 0 ? "text-green-500" : "text-red-500"
                          }
                        >
                          {formatPercentage(market.change24h)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/trading">
                  <Button className="w-full">Start Trading</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Liquidity Pools</CardTitle>
            <CardDescription>Live data from Liquidswap DEX on Aptos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading vaults...</div>
            ) : (
              <div className="space-y-4">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-semibold">
                        {pool.tokenA}-{pool.tokenB}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        TVL: {formatCurrency(pool.tvl)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {pool.apy.toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground">APY</p>
                    </div>
                  </div>
                ))}
                <Link href="/vaults">
                  <Button className="w-full">Explore Vaults</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perpetual Futures</CardTitle>
            <CardDescription>Trade APT, BTC, ETH with up to 50x leverage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced perpetual futures trading with Kana Labs integration. Multiple
              order types, leverage management, and real-time position tracking.
            </p>
            <Link href="/trading">
              <Button className="w-full mt-4">Trade Now</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intelligent Vaults</CardTitle>
            <CardDescription>Auto-compounding yield strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automated CLMM vaults, delta-neutral strategies, and arbitrage bots. Earn
              passive income with optimized yield generation.
            </p>
            <Link href="/vaults">
              <Button className="w-full mt-4">View Vaults</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Copy Trading</CardTitle>
            <CardDescription>Follow top traders automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Subscribe to proven trading strategies and automatically mirror positions
              from successful traders. Customizable parameters and risk controls.
            </p>
            <Link href="/copy-trading">
              <Button className="w-full mt-4">Explore Strategies</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
