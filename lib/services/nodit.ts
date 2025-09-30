import axios from "axios";

const NODIT_API_BASE_URL = "https://aptos-mainnet.nodit.io";
const NODIT_API_KEY = process.env.NEXT_PUBLIC_NODIT_API_KEY || "";

const noditApi = axios.create({
  baseURL: NODIT_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(NODIT_API_KEY && { "X-API-KEY": NODIT_API_KEY }),
  },
});

export interface TransactionData {
  hash: string;
  sender: string;
  sequence_number: number;
  max_gas_amount: number;
  gas_unit_price: number;
  expiration_timestamp_secs: number;
  payload: any;
  signature: any;
  events: any[];
  timestamp: number;
  success: boolean;
}

export interface AccountData {
  sequence_number: number;
  authentication_key: string;
}

export interface EventData {
  key: string;
  sequence_number: number;
  type: string;
  data: any;
}

class NoditService {
  // Get account information
  async getAccount(address: string): Promise<AccountData> {
    try {
      const response = await noditApi.get(`/v1/accounts/${address}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching account:", error);
      throw error;
    }
  }

  // Get account resources
  async getAccountResources(address: string): Promise<any[]> {
    try {
      const response = await noditApi.get(`/v1/accounts/${address}/resources`);
      return response.data;
    } catch (error) {
      console.error("Error fetching account resources:", error);
      return [];
    }
  }

  // Get transaction by hash
  async getTransaction(txHash: string): Promise<TransactionData> {
    try {
      const response = await noditApi.get(`/v1/transactions/by_hash/${txHash}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  }

  // Get account transactions
  async getAccountTransactions(
    address: string,
    limit: number = 25
  ): Promise<TransactionData[]> {
    try {
      const response = await noditApi.get(
        `/v1/accounts/${address}/transactions?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching account transactions:", error);
      return [];
    }
  }

  // Get events by event handle
  async getEventsByHandle(
    address: string,
    eventHandle: string,
    fieldName: string,
    limit: number = 25
  ): Promise<EventData[]> {
    try {
      const response = await noditApi.get(
        `/v1/accounts/${address}/events/${eventHandle}/${fieldName}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  }

  // Submit transaction
  async submitTransaction(signedTxn: any): Promise<{ hash: string }> {
    try {
      const response = await noditApi.post("/v1/transactions", signedTxn);
      return response.data;
    } catch (error) {
      console.error("Error submitting transaction:", error);
      throw error;
    }
  }

  // Simulate transaction
  async simulateTransaction(txn: any): Promise<any> {
    try {
      const response = await noditApi.post(
        "/v1/transactions/simulate",
        txn
      );
      return response.data;
    } catch (error) {
      console.error("Error simulating transaction:", error);
      throw error;
    }
  }

  // Get latest block info
  async getLatestBlock(): Promise<any> {
    try {
      const response = await noditApi.get("/v1/blocks/latest");
      return response.data;
    } catch (error) {
      console.error("Error fetching latest block:", error);
      throw error;
    }
  }

  // Get coin balance
  async getCoinBalance(address: string, coinType: string): Promise<number> {
    try {
      const resources = await this.getAccountResources(address);
      const coinResource = resources.find(
        (r) => r.type === `0x1::coin::CoinStore<${coinType}>`
      );
      if (coinResource) {
        return Number(coinResource.data.coin.value);
      }
      return 0;
    } catch (error) {
      console.error("Error fetching coin balance:", error);
      return 0;
    }
  }

  // Watch for new transactions (polling-based)
  watchTransactions(
    address: string,
    callback: (transactions: TransactionData[]) => void,
    interval: number = 5000
  ): () => void {
    let lastSequenceNumber = 0;

    const checkTransactions = async () => {
      try {
        const account = await this.getAccount(address);
        if (account.sequence_number > lastSequenceNumber) {
          const transactions = await this.getAccountTransactions(address, 10);
          callback(transactions);
          lastSequenceNumber = account.sequence_number;
        }
      } catch (error) {
        console.error("Error watching transactions:", error);
      }
    };

    const intervalId = setInterval(checkTransactions, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Get NFT balance
  async getNFTBalance(address: string): Promise<any[]> {
    try {
      // This would use the Nodit Indexer API for NFT data
      const response = await noditApi.get(`/v1/accounts/${address}/nfts`);
      return response.data;
    } catch (error) {
      console.error("Error fetching NFT balance:", error);
      return [];
    }
  }
}

export const noditService = new NoditService();
