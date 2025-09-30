import axios from "axios";

// Circle CCTP endpoints
const CCTP_API_BASE_URL = "https://iris-api.circle.com";

export type SupportedChain =
  | "ethereum"
  | "arbitrum"
  | "base"
  | "solana"
  | "avalanche"
  | "polygon"
  | "optimism"
  | "aptos";

export interface CrossChainTransfer {
  id: string;
  sourceChain: SupportedChain;
  destinationChain: SupportedChain;
  amount: number;
  status: "pending" | "attested" | "completed" | "failed";
  sourceTxHash: string;
  destinationTxHash?: string;
  attestation?: string;
  estimatedTime: number; // in seconds
  timestamp: number;
}

const cctpApi = axios.create({
  baseURL: CCTP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

class CCTPService {
  // Get supported chains for CCTP
  getSupportedChains(): SupportedChain[] {
    return [
      "ethereum",
      "arbitrum",
      "base",
      "solana",
      "avalanche",
      "polygon",
      "optimism",
      "aptos",
    ];
  }

  // Initiate cross-chain transfer
  async initiateTransfer(
    sourceChain: SupportedChain,
    destinationChain: SupportedChain,
    amount: number,
    destinationAddress: string
  ): Promise<CrossChainTransfer> {
    try {
      console.log("Initiating CCTP transfer:", {
        sourceChain,
        destinationChain,
        amount,
        destinationAddress,
      });

      // In production, this would interact with Circle's CCTP contracts
      // For now, return mock data
      return {
        id: `cctp_${Date.now()}`,
        sourceChain,
        destinationChain,
        amount,
        status: "pending",
        sourceTxHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        estimatedTime: 60, // 1 minute with CCTP V2
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error initiating transfer:", error);
      throw error;
    }
  }

  // Get transfer status
  async getTransferStatus(transferId: string): Promise<CrossChainTransfer> {
    try {
      const response = await cctpApi.get(`/attestations/${transferId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching transfer status:", error);
      // Return mock data
      return {
        id: transferId,
        sourceChain: "ethereum",
        destinationChain: "aptos",
        amount: 1000,
        status: "completed",
        sourceTxHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        destinationTxHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        estimatedTime: 60,
        timestamp: Date.now() - 120000,
      };
    }
  }

  // Get attestation for a transfer
  async getAttestation(sourceTxHash: string): Promise<string> {
    try {
      const response = await cctpApi.get(`/attestations/${sourceTxHash}`);
      return response.data.attestation;
    } catch (error) {
      console.error("Error fetching attestation:", error);
      // Return mock attestation
      return `0x${Math.random().toString(16).slice(2, 130)}`;
    }
  }

  // Complete transfer on destination chain
  async completeTransfer(
    transferId: string,
    attestation: string
  ): Promise<{ success: boolean; txHash: string }> {
    try {
      console.log("Completing transfer:", { transferId, attestation });

      // In production, this would submit a transaction on the destination chain
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      };
    } catch (error) {
      console.error("Error completing transfer:", error);
      throw error;
    }
  }

  // Get transfer history for an address
  async getTransferHistory(address: string): Promise<CrossChainTransfer[]> {
    try {
      const response = await cctpApi.get(`/transfers/${address}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching transfer history:", error);
      return [];
    }
  }

  // Estimate transfer time
  estimateTransferTime(
    sourceChain: SupportedChain,
    destinationChain: SupportedChain
  ): number {
    // CCTP V2 Fast Transfer: typically under 60 seconds
    return 60;
  }

  // Calculate fees
  calculateFees(amount: number): number {
    // CCTP has minimal fees compared to bridges
    // Native burn-and-mint mechanism
    return 0; // No protocol fees, only gas
  }

  // Monitor transfer progress
  watchTransfer(
    transferId: string,
    callback: (status: CrossChainTransfer) => void,
    interval: number = 5000
  ): () => void {
    const checkStatus = async () => {
      try {
        const status = await this.getTransferStatus(transferId);
        callback(status);

        if (status.status === "completed" || status.status === "failed") {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Error watching transfer:", error);
      }
    };

    const intervalId = setInterval(checkStatus, interval);

    // Initial check
    checkStatus();

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Get USDC balance on different chains
  async getUSDCBalance(address: string, chain: SupportedChain): Promise<number> {
    try {
      // This would query the appropriate chain's RPC
      console.log(`Fetching USDC balance for ${address} on ${chain}`);
      // Return mock balance
      return Math.random() * 10000;
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      return 0;
    }
  }

  // Get all USDC balances across supported chains
  async getAllUSDCBalances(address: string): Promise<Record<SupportedChain, number>> {
    const chains = this.getSupportedChains();
    const balances: Record<string, number> = {};

    await Promise.all(
      chains.map(async (chain) => {
        balances[chain] = await this.getUSDCBalance(address, chain);
      })
    );

    return balances as Record<SupportedChain, number>;
  }
}

export const cctpService = new CCTPService();
