import { PinataSDK } from "pinata";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

export interface IPFSMetadata {
  name?: string;
  keyvalues?: Record<string, string | number>;
}

export interface UploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  url: string;
}

export interface VaultMetadata {
  name: string;
  description: string;
  strategy: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  created: number;
  creator: string;
}

export interface StrategyMetadata {
  id: string;
  name: string;
  description: string;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  trades: number;
  followers: number;
  creator: string;
  created: number;
}

class PinataIPFSService {
  // Upload JSON data to IPFS
  async uploadJSON(data: any, metadata?: IPFSMetadata): Promise<UploadResult> {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const file = new File([blob], metadata?.name || "data.json", { type: "application/json" });

      const upload: any = await (pinata.upload as any).public.file(file);

      const cid = upload.IpfsHash || upload.cid || upload.hash;
      const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

      return {
        IpfsHash: cid,
        PinSize: upload.PinSize || upload.size || 0,
        Timestamp: upload.Timestamp || new Date().toISOString(),
        url,
      };
    } catch (error) {
      console.error("Error uploading JSON to IPFS:", error);
      throw error;
    }
  }

  // Upload file to IPFS
  async uploadFile(file: File, metadata?: IPFSMetadata): Promise<UploadResult> {
    try {
      const upload: any = await (pinata.upload as any).public.file(file);

      const cid = upload.IpfsHash || upload.cid || upload.hash;
      const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

      return {
        IpfsHash: cid,
        PinSize: upload.PinSize || upload.size || 0,
        Timestamp: upload.Timestamp || new Date().toISOString(),
        url,
      };
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
      throw error;
    }
  }

  // Get data from IPFS
  async getData(cid: string): Promise<any> {
    try {
      const response = await fetch(`https://${PINATA_GATEWAY}/ipfs/${cid}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting data from IPFS:", error);
      throw error;
    }
  }

  // Upload vault metadata
  async uploadVaultMetadata(vault: VaultMetadata): Promise<string> {
    try {
      const result = await this.uploadJSON(vault, {
        name: `Vault-${vault.name}`,
        keyvalues: {
          type: "vault",
          strategy: vault.strategy,
          risk: vault.risk,
        },
      });

      return result.IpfsHash;
    } catch (error) {
      console.error("Error uploading vault metadata:", error);
      throw error;
    }
  }

  // Upload strategy metadata
  async uploadStrategyMetadata(strategy: StrategyMetadata): Promise<string> {
    try {
      const result = await this.uploadJSON(strategy, {
        name: `Strategy-${strategy.name}`,
        keyvalues: {
          type: "strategy",
          creator: strategy.creator,
          trades: strategy.trades,
        },
      });

      return result.IpfsHash;
    } catch (error) {
      console.error("Error uploading strategy metadata:", error);
      throw error;
    }
  }

  // Get vault metadata from IPFS
  async getVaultMetadata(cid: string): Promise<VaultMetadata | null> {
    try {
      const data = await this.getData(cid);
      return data as VaultMetadata;
    } catch (error) {
      console.error("Error getting vault metadata:", error);
      return null;
    }
  }

  // Get strategy metadata from IPFS
  async getStrategyMetadata(cid: string): Promise<StrategyMetadata | null> {
    try {
      const data = await this.getData(cid);
      return data as StrategyMetadata;
    } catch (error) {
      console.error("Error getting strategy metadata:", error);
      return null;
    }
  }

  // List all uploaded files (requires API key with proper permissions)
  async listFiles(): Promise<any[]> {
    try {
      const files: any = await (pinata as any).files.list();
      return files;
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  }

  // Delete file from IPFS (unpin)
  async deleteFile(cid: string): Promise<boolean> {
    try {
      await (pinata as any).unpin([cid]);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  // Generate gateway URL for CID
  async getGatewayURL(cid: string): Promise<string> {
    return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
  }

  // Upload trade history
  async uploadTradeHistory(
    address: string,
    trades: any[]
  ): Promise<string> {
    try {
      const result = await this.uploadJSON(
        {
          address,
          trades,
          uploadedAt: Date.now(),
        },
        {
          name: `TradeHistory-${address}`,
          keyvalues: {
            type: "trade-history",
            trader: address,
            count: trades.length,
          },
        }
      );

      return result.IpfsHash;
    } catch (error) {
      console.error("Error uploading trade history:", error);
      throw error;
    }
  }

  // Check if Pinata is configured
  isConfigured(): boolean {
    return !!PINATA_JWT && PINATA_JWT !== "";
  }
}

export const pinataService = new PinataIPFSService();
