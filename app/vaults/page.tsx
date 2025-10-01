"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { liquidswapService, PoolStats } from "@/lib/services/liquidswap";
import { pinataService, VaultMetadata } from "@/lib/services/pinata-ipfs";
import { Vault, TrendingUp, Shield, Zap, Search } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function VaultsPage() {
  const { account } = useWallet();
  const [pools, setPools] = useState<PoolStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<"all" | "low" | "medium" | "high">("all");

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    setLoading(true);
    try {
      const poolData = await liquidswapService.getPools();
      setPools(poolData);
    } catch (error) {
      console.error("Error loading vaults:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (apy: number): "low" | "medium" | "high" => {
    if (apy < 10) return "low";
    if (apy < 20) return "medium";
    return "high";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.tokenA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.tokenB.toLowerCase().includes(searchTerm.toLowerCase());
    const risk = getRiskLevel(pool.apy);
    const matchesRisk = selectedRisk === "all" || risk === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const handleDeposit = async (pool: PoolStats) => {
    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    // Upload vault metadata to IPFS
    try {
      const metadata: VaultMetadata = {
        name: `${pool.tokenA}-${pool.tokenB} Vault`,
        description: `Automated liquidity provision for ${pool.tokenA}/${pool.tokenB} pool`,
        strategy: "CLMM Auto-Compound",
        apy: pool.apy,
        tvl: pool.tvl,
        risk: getRiskLevel(pool.apy),
        created: Date.now(),
        creator: account.address.toString(),
      };

      const cid = await pinataService.uploadVaultMetadata(metadata);
      console.log("Vault metadata uploaded to IPFS:", cid);

      alert(`Vault created! Metadata stored at IPFS: ${cid}\nDeposit feature coming soon!`);
    } catch (error) {
      console.error("Error creating vault:", error);
      alert("Failed to create vault. Check console for details.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intelligent Vaults</h1>
        <p className="text-muted-foreground">
          Automated yield strategies with IPFS-backed metadata storage
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value Locked</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(pools.reduce((sum, p) => sum + p.tvl, 0))}
                </p>
              </div>
              <Vault className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average APY</p>
                <p className="text-2xl font-bold text-green-500">
                  {pools.length > 0
                    ? (pools.reduce((sum, p) => sum + p.apy, 0) / pools.length).toFixed(2)
                    : "0.00"}
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
                <p className="text-sm text-muted-foreground">Active Vaults</p>
                <p className="text-2xl font-bold">{pools.length}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vaults..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedRisk === "all" ? "default" : "outline"}
                onClick={() => setSelectedRisk("all")}
              >
                All
              </Button>
              <Button
                variant={selectedRisk === "low" ? "default" : "outline"}
                onClick={() => setSelectedRisk("low")}
              >
                <Shield className="h-4 w-4 mr-1" />
                Low Risk
              </Button>
              <Button
                variant={selectedRisk === "medium" ? "default" : "outline"}
                onClick={() => setSelectedRisk("medium")}
              >
                Medium Risk
              </Button>
              <Button
                variant={selectedRisk === "high" ? "default" : "outline"}
                onClick={() => setSelectedRisk("high")}
              >
                High Risk
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vaults Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading vaults...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => {
            const risk = getRiskLevel(pool.apy);
            return (
              <Card key={pool.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {pool.tokenA}/{pool.tokenB}
                    </span>
                    <span className={getRiskColor(risk)}>{risk.toUpperCase()}</span>
                  </CardTitle>
                  <CardDescription>CLMM Auto-Compound Strategy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">APY</span>
                      <span className="text-2xl font-bold text-green-500">
                        {pool.apy.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">TVL</span>
                      <span className="font-semibold">{formatCurrency(pool.tvl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">24h Volume</span>
                      <span className="font-semibold">
                        {formatCurrency(pool.volume24h)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fee</span>
                      <span className="font-semibold">{formatPercentage(pool.fee)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleDeposit(pool)}
                      disabled={!account}
                    >
                      {account ? "Deposit" : "Connect Wallet"}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm" disabled>
                        Withdraw
                      </Button>
                      <Button variant="outline" className="flex-1" size="sm" disabled>
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredPools.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No vaults found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
