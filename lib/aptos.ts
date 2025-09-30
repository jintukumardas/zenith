import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Configure Aptos clients for different networks
export const aptosConfig = new AptosConfig({
  network: Network.TESTNET
});

export const aptos = new Aptos(aptosConfig);

// Mainnet configuration (for production)
export const mainnetConfig = new AptosConfig({
  network: Network.MAINNET
});

export const mainnetAptos = new Aptos(mainnetConfig);

// Contract addresses (to be updated with actual deployed addresses)
export const VAULT_CORE_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CORE_ADDRESS || "0x1";
export const STRATEGY_ADDRESS = process.env.NEXT_PUBLIC_STRATEGY_ADDRESS || "0x1";
export const TAPP_HOOKS_ADDRESS = process.env.NEXT_PUBLIC_TAPP_HOOKS_ADDRESS || "0x1";

// Token addresses
export const USDC_ADDRESS = "0x1::aptos_coin::AptosCoin"; // Update with actual USDC address
export const APT_ADDRESS = "0x1::aptos_coin::AptosCoin";

// Helper functions
export async function getAccountBalance(address: string, coinType: string = APT_ADDRESS) {
  try {
    const resources = await aptos.getAccountResources({ accountAddress: address });
    const coinResource = resources.find((r) => r.type === `0x1::coin::CoinStore<${coinType}>`);
    if (coinResource) {
      return Number((coinResource.data as any).coin.value);
    }
    return 0;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

export async function waitForTransaction(txHash: string) {
  return await aptos.waitForTransaction({ transactionHash: txHash });
}
