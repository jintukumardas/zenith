import { create } from "zustand";

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
  network: string;
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setBalance: (balance: number) => void;
  setNetwork: (network: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  address: null,
  balance: 0,
  network: "testnet",
  setConnected: (connected) => set({ connected }),
  setAddress: (address) => set({ address }),
  setBalance: (balance) => set({ balance }),
  setNetwork: (network) => set({ network }),
  disconnect: () =>
    set({ connected: false, address: null, balance: 0 }),
}));
