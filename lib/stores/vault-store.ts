import { create } from "zustand";

export type VaultStrategy = "clmm" | "delta-neutral" | "arbitrage";
export type VaultRiskLevel = "conservative" | "balanced" | "aggressive";

export interface Vault {
  id: string;
  name: string;
  strategy: VaultStrategy;
  riskLevel: VaultRiskLevel;
  apy: number;
  tvl: number;
  userDeposit: number;
  userShares: number;
  performanceFee: number;
  managementFee: number;
  description: string;
}

interface VaultState {
  vaults: Vault[];
  selectedVault: Vault | null;
  depositAmount: string;
  withdrawAmount: string;
  setVaults: (vaults: Vault[]) => void;
  setSelectedVault: (vault: Vault | null) => void;
  setDepositAmount: (amount: string) => void;
  setWithdrawAmount: (amount: string) => void;
  updateVault: (id: string, updates: Partial<Vault>) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  vaults: [],
  selectedVault: null,
  depositAmount: "",
  withdrawAmount: "",
  setVaults: (vaults) => set({ vaults }),
  setSelectedVault: (selectedVault) => set({ selectedVault }),
  setDepositAmount: (depositAmount) => set({ depositAmount }),
  setWithdrawAmount: (withdrawAmount) => set({ withdrawAmount }),
  updateVault: (id, updates) =>
    set((state) => ({
      vaults: state.vaults.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
}));
