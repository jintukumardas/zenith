// Real Aptos Mainnet Contract Addresses

// Liquidswap DEX
export const LIQUIDSWAP_MODULES = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";
export const LIQUIDSWAP_RESOURCE_ACCOUNT = "0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948";

// PancakeSwap Aptos
export const PANCAKESWAP_SWAP = "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa";
export const PANCAKESWAP_MASTERCHEF = "0x7968a225eba6c99f5f1070aeec1b405757dee939eabcfda43ba91588bf5fccf3";

// Pyth Oracle
export const PYTH_CONTRACT = "0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387";

// Pyth Price Feed IDs
export const PRICE_FEEDS = {
  "APT/USD": "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5",
  "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
} as const;

// Token Addresses
export const TOKENS = {
  APT: "0x1::aptos_coin::AptosCoin",
  USDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC", // LayerZero USDC
  USDT: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b", // FA USDT
  WETH: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH",
  WBTC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC",
} as const;

// Aptos GraphQL Endpoints
export const APTOS_GRAPHQL_MAINNET = "https://api.mainnet.aptoslabs.com/v1/graphql";
export const APTOS_GRAPHQL_TESTNET = "https://api.testnet.aptoslabs.com/v1/graphql";

// Aptos REST API
export const APTOS_REST_MAINNET = "https://api.mainnet.aptoslabs.com/v1";
export const APTOS_REST_TESTNET = "https://api.testnet.aptoslabs.com/v1";

// Use testnet by default based on env
export const APTOS_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet";
export const APTOS_GRAPHQL_ENDPOINT = APTOS_NETWORK === "mainnet" ? APTOS_GRAPHQL_MAINNET : APTOS_GRAPHQL_TESTNET;
export const APTOS_REST_ENDPOINT = APTOS_NETWORK === "mainnet" ? APTOS_REST_MAINNET : APTOS_REST_TESTNET;
