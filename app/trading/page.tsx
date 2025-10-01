"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { kanaAggregatorService, SwapQuote, TokenInfo } from "@/lib/services/kana-aggregator";
import { kanaPerpsService } from "@/lib/services/kana-perps";
import { ArrowDownUp, TrendingUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function TradingPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      getQuote();
    }
  }, [fromToken, toToken, fromAmount]);

  const loadTokens = async () => {
    const tokenList = await kanaAggregatorService.getTokenList();
    setTokens(tokenList);
    if (tokenList.length >= 2) {
      setFromToken(tokenList[0]);
      setToToken(tokenList[1]);
    }
  };

  const getQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setLoading(true);
    try {
      const result = await kanaAggregatorService.getSwapQuote(
        fromToken.address,
        toToken.address,
        fromAmount,
        0.5
      );
      setQuote(result);
    } catch (error) {
      console.error("Error getting quote:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!account || !fromToken || !toToken || !fromAmount || !quote) {
      alert("Please connect wallet and enter valid amounts");
      return;
    }

    setSwapping(true);
    try {
      const swapTx = await kanaAggregatorService.executeSwap(
        fromToken.address,
        toToken.address,
        fromAmount,
        account.address.toString(),
        0.5
      );

      const response = await signAndSubmitTransaction({
        data: swapTx,
      });

      alert(`Swap successful! Transaction: ${response.hash}`);
      setFromAmount("");
      setQuote(null);
    } catch (error: any) {
      console.error("Swap error:", error);
      alert(`Swap failed: ${error.message || "Unknown error"}`);
    } finally {
      setSwapping(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount("");
    setQuote(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Spot Trading</h1>
        <p className="text-muted-foreground">
          Powered by Kanalabs Aggregator - Best rates across all DEXs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Swap Tokens</CardTitle>
            <CardDescription>
              Trade tokens with the best rates using Kanalabs aggregation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={fromToken?.address || ""}
                  onChange={(e) => {
                    const token = tokens.find((t) => t.address === e.target.value);
                    setFromToken(token || null);
                  }}
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1"
                />
              </div>
              {fromToken && (
                <p className="text-sm text-muted-foreground">
                  Balance: 0 {fromToken.symbol}
                </p>
              )}
            </div>

            {/* Switch Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={switchTokens}
                className="rounded-full"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To (estimated)</label>
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={toToken?.address || ""}
                  onChange={(e) => {
                    const token = tokens.find((t) => t.address === e.target.value);
                    setToToken(token || null);
                  }}
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <Input
                  type="text"
                  placeholder="0.0"
                  value={loading ? "Loading..." : quote?.toAmount || "0.0"}
                  disabled
                  className="flex-1"
                />
              </div>
            </div>

            {/* Quote Details */}
            {quote && (
              <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span>
                    1 {fromToken?.symbol} ≈{" "}
                    {(parseFloat(quote.toAmount) / parseFloat(quote.fromAmount)).toFixed(6)}{" "}
                    {toToken?.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className={quote.priceImpact > 5 ? "text-red-500" : ""}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee</span>
                  <span>{quote.fee}</span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSwap}
              disabled={!account || swapping || !quote || loading}
            >
              {swapping ? "Swapping..." : account ? "Swap" : "Connect Wallet"}
            </Button>
          </CardContent>
        </Card>

        {/* Market Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(12500000)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidity</p>
                <p className="text-2xl font-bold">{formatCurrency(45000000)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Traders</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported DEXs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Liquidswap</span>
                  <span className="text-green-500">✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>PancakeSwap</span>
                  <span className="text-green-500">✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Thala</span>
                  <span className="text-green-500">✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cellana</span>
                  <span className="text-green-500">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Perpetual Futures Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Perpetual Futures (Powered by Kana Perps)
          </CardTitle>
          <CardDescription>
            Trade with up to 50x leverage on Aptos testnet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Perpetual futures trading coming soon with Kana Perps integration
            </p>
            <Button variant="outline" disabled>
              Open Perpetual Position
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
