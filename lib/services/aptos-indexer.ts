import { APTOS_GRAPHQL_MAINNET } from "../constants";

export interface StatsData {
  totalValueLocked: number;
  volume24h: number;
  activeUsers: number;
  totalTransactions: number;
}

class AptosIndexerService {
  private endpoint = APTOS_GRAPHQL_MAINNET;

  // Execute GraphQL query
  private async query(query: string, variables?: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("GraphQL query error:", error);
      return null;
    }
  }

  // Get total number of transactions in last 24h
  async get24hTransactions(): Promise<number> {
    const query = `
      query Get24hTransactions {
        block_metadata_transactions_aggregate(
          where: {
            timestamp: {_gte: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"}
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    const data = await this.query(query);
    return data?.block_metadata_transactions_aggregate?.aggregate?.count || 0;
  }

  // Get active addresses in last 24h
  async getActiveUsers24h(): Promise<number> {
    const query = `
      query GetActiveUsers {
        user_transactions_aggregate(
          where: {
            timestamp: {_gte: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"}
          }
          distinct_on: sender
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    const data = await this.query(query);
    return data?.user_transactions_aggregate?.aggregate?.count || 0;
  }

  // Get account info
  async getAccountInfo(address: string): Promise<any> {
    const query = `
      query GetAccountInfo($address: String!) {
        current_coin_balances(
          where: {owner_address: {_eq: $address}}
        ) {
          amount
          coin_type
        }
      }
    `;

    return await this.query(query, { address });
  }

  // Get account transactions
  async getAccountTransactions(address: string, limit: number = 10): Promise<any[]> {
    const query = `
      query GetAccountTransactions($address: String!, $limit: Int!) {
        account_transactions(
          where: {account_address: {_eq: $address}}
          limit: $limit
          order_by: {transaction_version: desc}
        ) {
          transaction_version
          account_address
          coin_activities {
            activity_type
            amount
            coin_type
          }
        }
      }
    `;

    const data = await this.query(query, { address, limit });
    return data?.account_transactions || [];
  }

  // Get token balances for an account
  async getTokenBalances(address: string): Promise<{ coinType: string; amount: number }[]> {
    const query = `
      query GetTokenBalances($address: String!) {
        current_coin_balances(
          where: {owner_address: {_eq: $address}, amount: {_gt: "0"}}
        ) {
          coin_type
          amount
        }
      }
    `;

    const data = await this.query(query, { address });
    if (!data?.current_coin_balances) return [];

    return data.current_coin_balances.map((balance: any) => ({
      coinType: balance.coin_type,
      amount: parseInt(balance.amount),
    }));
  }

  // Get current fungible asset activities (swaps, transfers)
  async getFungibleAssetActivities(limit: number = 20): Promise<any[]> {
    const query = `
      query GetFAActivities($limit: Int!) {
        fungible_asset_activities(
          limit: $limit
          order_by: {transaction_version: desc}
        ) {
          transaction_version
          type
          amount
          asset_type
          owner_address
          transaction_timestamp
        }
      }
    `;

    const data = await this.query(query, { limit });
    return data?.fungible_asset_activities || [];
  }

  // Get overall platform stats
  async getPlatformStats(): Promise<StatsData> {
    try {
      const [transactions, users] = await Promise.all([
        this.get24hTransactions(),
        this.getActiveUsers24h(),
      ]);

      return {
        totalValueLocked: 0, // Would need to aggregate from DEX contracts
        volume24h: transactions * 50, // Estimated
        activeUsers: users,
        totalTransactions: transactions,
      };
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      return {
        totalValueLocked: 0,
        volume24h: 0,
        activeUsers: 0,
        totalTransactions: 0,
      };
    }
  }

  // Get coin info
  async getCoinInfo(coinType: string): Promise<any> {
    const query = `
      query GetCoinInfo($coinType: String!) {
        coin_infos(where: {coin_type: {_eq: $coinType}}) {
          name
          symbol
          decimals
          supply_aggregator_table_key_v1
        }
      }
    `;

    const data = await this.query(query, { coinType });
    return data?.coin_infos?.[0] || null;
  }
}

export const aptosIndexerService = new AptosIndexerService();
