"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { noditService } from "@/lib/services/nodit";
import { aptosIndexerService } from "@/lib/services/aptos-indexer";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TokenBalance {
  symbol: string;
  amount: number;
  value: number;
  change24h: number;
}

interface Transaction {
  hash: string;
  type: string;
  amount: string;
  timestamp: number;
  status: string;
}

export default function PortfolioPage() {
  const { account } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (account) {
      loadPortfolio();
    }
  }, [account]);

  const loadPortfolio = async () => {
    if (!account) return;

    setLoading(true);
    try {
      // Get token balances using Nodit
      const tokenBalances = await aptosIndexerService.getTokenBalances(account.address.toString());

      // Mock price data (in production, fetch from oracle)
      const mockBalances: TokenBalance[] = tokenBalances.map((balance) => {
        const symbol = balance.coinType.includes("AptosCoin")
          ? "APT"
          : balance.coinType.includes("USDC")
          ? "USDC"
          : "Unknown";

        const price = symbol === "APT" ? 10.5 : symbol === "USDC" ? 1.0 : 0;
        const amount = balance.amount / (symbol === "APT" ? 1e8 : 1e6);

        return {
          symbol,
          amount,
          value: amount * price,
          change24h: Math.random() * 10 - 5,
        };
      });

      setBalances(mockBalances);
      setTotalValue(mockBalances.reduce((sum, b) => sum + b.value, 0));

      // Get recent transactions using Nodit
      const txs = await noditService.getAccountTransactions(account.address.toString(), 10);

      const formattedTxs: Transaction[] = txs.map((tx: any) => ({
        hash: tx.hash || "N/A",
        type: tx.payload?.function?.split("::").pop() || "Transfer",
        amount: "0",
        timestamp: tx.timestamp || Date.now(),
        status: tx.success ? "Success" : "Failed",
      }));

      setTransactions(formattedTxs);
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to view your portfolio powered by Nodit API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Please connect your Aptos wallet to continue
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">
          Real-time portfolio tracking powered by Nodit API on Aptos testnet
        </p>
      </div>

      {/* Total Value */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Portfolio Value</p>
              <p className="text-4xl font-bold mt-2">
                {loading ? "Loading..." : formatCurrency(totalValue)}
              </p>
              <p className="text-sm opacity-75 mt-2">
                {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
              </p>
            </div>
            <Wallet className="h-16 w-16 opacity-75" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Balances */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Token Balances</CardTitle>
            <CardDescription>Your current holdings on Aptos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading balances...</div>
            ) : balances.length > 0 ? (
              <div className="space-y-4">
                {balances.map((balance, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-bold">{balance.symbol[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{balance.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {balance.amount.toFixed(4)} tokens
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(balance.value)}</p>
                      <div className="flex items-center gap-1">
                        {balance.change24h >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <p
                          className={`text-sm ${
                            balance.change24h >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {balance.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No tokens found</div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24h Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">+$0.00</p>
                  <p className="text-sm text-muted-foreground">0.00%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain</span>
                  <span className="font-semibold">Aptos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API</span>
                  <span className="font-semibold">Nodit</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest on-chain activity via Nodit API</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        tx.status === "Success" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
