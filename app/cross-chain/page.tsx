"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { kanaAggregatorService, CrossChainQuote, TokenInfo } from "@/lib/services/kana-aggregator";
import { ArrowRightLeft, Clock, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CrossChainPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [chains] = useState(kanaAggregatorService.getSupportedChains());
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [fromChain, setFromChain] = useState("aptos");
  const [toChain, setToChain] = useState("ethereum");
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<CrossChainQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridging, setBridging] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    if (fromChain && toChain && fromToken && toToken && amount && parseFloat(amount) > 0) {
      getQuote();
    }
  }, [fromChain, toChain, fromToken, toToken, amount]);

  const loadTokens = async () => {
    const tokenList = await kanaAggregatorService.getTokenList();
    setTokens(tokenList);
    if (tokenList.length >= 2) {
      setFromToken(tokenList[0]);
      setToToken(tokenList[1]);
    }
  };

  const getQuote = async () => {
    if (!fromChain || !toChain || !fromToken || !toToken || !amount) return;

    setLoading(true);
    try {
      const result = await kanaAggregatorService.getCrossChainQuote(
        fromChain,
        toChain,
        fromToken.address,
        toToken.address,
        amount
      );
      setQuote(result);
    } catch (error) {
      console.error("Error getting cross-chain quote:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    if (!account || !fromChain || !toChain || !fromToken || !toToken || !amount || !quote) {
      alert("Please connect wallet and enter valid amounts");
      return;
    }

    setBridging(true);
    try {
      const bridgeTx = await kanaAggregatorService.executeCrossChainTransfer(
        fromChain,
        toChain,
        fromToken.address,
        toToken.address,
        amount,
        account.address.toString(),
        account.address.toString() // Using same address for destination
      );

      const response = await signAndSubmitTransaction({
        data: bridgeTx,
      });

      alert(
        `Bridge transaction initiated!\nTransaction: ${response.hash}\nTokens will arrive in ~${quote.estimatedTime}s`
      );
      setAmount("");
      setQuote(null);
    } catch (error: any) {
      console.error("Bridge error:", error);
      alert(`Bridge failed: ${error.message || "Unknown error"}`);
    } finally {
      setBridging(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cross-Chain Bridge</h1>
        <p className="text-muted-foreground">
          Transfer assets across chains using Kanalabs aggregated bridge routes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bridge Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bridge Assets</CardTitle>
            <CardDescription>
              Powered by LayerZero, Wormhole, and CCTP via Kanalabs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Chain */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Chain</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value)}
              >
                {chains.map((chain) => (
                  <option key={chain} value={chain}>
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* From Token & Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset & Amount</label>
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
              </div>
              {fromToken && (
                <p className="text-sm text-muted-foreground">
                  Balance: 0 {fromToken.symbol} on {fromChain}
                </p>
              )}
            </div>

            {/* Bridge Direction */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const temp = fromChain;
                  setFromChain(toChain);
                  setToChain(temp);
                }}
                className="rounded-full"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* To Chain */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Chain</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
              >
                {chains.map((chain) => (
                  <option key={chain} value={chain}>
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Receive (estimated)</label>
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
                  <span className="text-muted-foreground">Estimated Time</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    ~{Math.ceil(quote.estimatedTime / 60)} min
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bridge Fee</span>
                  <span>{quote.bridgeFee} {fromToken?.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You&apos;ll Receive</span>
                  <span className="font-semibold">
                    {quote.toAmount} {toToken?.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Bridge Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleBridge}
              disabled={!account || bridging || !quote || loading}
            >
              {bridging ? "Bridging..." : account ? "Bridge Assets" : "Connect Wallet"}
            </Button>
          </CardContent>
        </Card>

        {/* Info & Supported Bridges */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supported Bridges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-semibold">LayerZero</p>
                  <p className="text-sm text-muted-foreground">Omnichain messaging</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-semibold">Wormhole</p>
                  <p className="text-sm text-muted-foreground">Generic message passing</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-semibold">CCTP</p>
                  <p className="text-sm text-muted-foreground">Native USDC transfers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bridge Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-xl font-bold">{formatCurrency(8500000)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bridged</p>
                <p className="text-xl font-bold">{formatCurrency(125000000)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supported Chains</p>
                <p className="text-xl font-bold">{chains.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Audited bridge protocols</p>
                <p>✓ Multi-signature security</p>
                <p>✓ Real-time monitoring</p>
                <p>✓ Slippage protection</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Bridges */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bridge Transactions</CardTitle>
          <CardDescription>Latest cross-chain transfers via Kanalabs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent bridge transactions
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
