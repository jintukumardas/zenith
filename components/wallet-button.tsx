"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "./ui/button";
import { truncateAddress } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const { connected, account, connect, disconnect, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      // Get the first available wallet (Petra by default)
      const wallet = wallets?.[0];
      if (wallet) {
        await connect(wallet.name);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 bg-secondary rounded-md text-sm">
          {truncateAddress(account.address.toString())}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={disconnect}
          title="Disconnect Wallet"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
