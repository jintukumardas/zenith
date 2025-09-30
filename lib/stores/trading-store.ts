import { create } from "zustand";

export type OrderType = "market" | "limit" | "stop-loss" | "take-profit";
export type PositionSide = "long" | "short";
export type Market = "APT-PERP" | "BTC-PERP" | "ETH-PERP";

export interface Position {
  id: string;
  market: Market;
  side: PositionSide;
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  pnl: number;
  pnlPercentage: number;
  liquidationPrice: number;
  margin: number;
  timestamp: number;
}

export interface Order {
  id: string;
  market: Market;
  type: OrderType;
  side: PositionSide;
  size: number;
  price?: number;
  triggerPrice?: number;
  leverage: number;
  status: "pending" | "filled" | "cancelled";
  timestamp: number;
}

interface TradingState {
  selectedMarket: Market;
  positions: Position[];
  orders: Order[];
  orderType: OrderType;
  orderSide: PositionSide;
  orderSize: string;
  orderPrice: string;
  leverage: number;
  setSelectedMarket: (market: Market) => void;
  setPositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  cancelOrder: (id: string) => void;
  setOrderType: (type: OrderType) => void;
  setOrderSide: (side: PositionSide) => void;
  setOrderSize: (size: string) => void;
  setOrderPrice: (price: string) => void;
  setLeverage: (leverage: number) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedMarket: "APT-PERP",
  positions: [],
  orders: [],
  orderType: "market",
  orderSide: "long",
  orderSize: "",
  orderPrice: "",
  leverage: 10,
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setPositions: (positions) => set({ positions }),
  addPosition: (position) =>
    set((state) => ({ positions: [...state.positions, position] })),
  updatePosition: (id, updates) =>
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  closePosition: (id) =>
    set((state) => ({
      positions: state.positions.filter((p) => p.id !== id),
    })),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),
  cancelOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),
  setOrderType: (orderType) => set({ orderType }),
  setOrderSide: (orderSide) => set({ orderSide }),
  setOrderSize: (orderSize) => set({ orderSize }),
  setOrderPrice: (orderPrice) => set({ orderPrice }),
  setLeverage: (leverage) => set({ leverage }),
}));
