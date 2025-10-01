# 🔷 Zenith - Universal DeFi Aggregator & Yield Optimizer on Aptos

![Zenith Platform](https://img.shields.io/badge/Aptos-DeFi-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Hackathon](https://img.shields.io/badge/CTRL%2BMOVE-Hackathon-purple)

**Zenith is a DeFi platform built for the Aptos CTRL+MOVE Hackathon**, featuring multi-protocol yield aggregation, funding rate arbitrage, real-time portfolio analytics, and advanced trading infrastructure.

---

## 🏆 Hackathon Bounties Addressed

### ✅ Kana Labs - Next-Gen Trading Tools with Perps
**Bounty Value: Build innovative trading solutions using perpetual futures**

- **Funding Rate Arbitrage Bot**: Automated scanner finds and executes funding rate arbitrage opportunities across perpetual markets
  - Real-time monitoring of funding rates across APT-PERP, BTC-PERP, ETH-PERP
  - Automatic opportunity detection with confidence scoring
  - One-click execution with customizable position sizing
  - Live P&L tracking with funding accrual breakdown

- **Advanced Portfolio Dashboard**: Real-time position tracking with comprehensive analytics
  - Aggregated view of spot, perp, vault, and arbitrage positions
  - Unrealized P&L calculation with percentage gains
  - Risk metrics including Sharpe ratio and max drawdown
  - Transaction history with gas fee tracking

- **Kana Aggregator Integration**: Multi-chain swaps and optimal routing
  - Best price discovery across DEXs
  - Cross-chain asset bridging
  - Slippage protection and MEV resistance

**Files**: `/lib/services/funding-arb-engine.ts`, `/lib/services/kana-perps.ts`, `/app/arbitrage/page.tsx`, `/move/sources/funding_arbitrage.move`

---

### ✅ Nodit - Aptos Infrastructure Challenge
**Bounty Value: Build projects utilizing Nodit's Aptos features**

- **Real-time Blockchain Data**: Complete integration with Nodit's Aptos Web3 Data API
  - Live account balance tracking
  - Resource querying for on-chain positions
  - Transaction history and status monitoring
  - Event indexing for vault operations

- **Portfolio Analytics Service**: Event-driven portfolio updates
  - Real-time position monitoring via polling (webhook-ready architecture)
  - Automatic portfolio revaluation on transaction confirmation
  - Historical performance tracking
  - Multi-protocol aggregation (spot, perps, vaults, arb)

- **Smart Query Integration**: Optimized blockchain data access
  - Efficient resource filtering
  - Batch queries for multi-account analysis
  - Cached responses for improved UX

**Files**: `/lib/services/nodit.ts`, `/lib/services/portfolio-analytics.ts`

---

### ✅ Tapp.Exchange - Next-Gen DeFi with Hooks
**Bounty Value: Build innovative pools or hooks on Tapp.Exchange**

- **Dynamic Fee Hook**: Market-responsive fee optimization
  - Volatility-based fee adjustment
  - Volume-based discounts for large traders
  - Real-time fee calculation with breakdown
  - Integration with Pyth Oracle for market data

- **Limit Order Hook**: On-chain limit order book
  - Place limit orders with price triggers
  - Automatic execution when conditions met
  - Order management (view, cancel)
  - Event emission for order fills

- **TWAP Execution Hook**: Time-Weighted Average Price orders
  - Split large trades into intervals
  - Reduce price impact and slippage
  - Configurable interval timing
  - Progress tracking for partial fills

- **NFT-Gated Pool Hook**: Fee discounts for NFT holders
  - 50% fee reduction for NFT holders
  - Configurable NFT collection requirements
  - Automatic eligibility verification

**Files**: `/move/sources/tapp_hooks.move`, `/lib/services/tapp-exchange.ts`

---

### ✅ Hyperion - Liquidity & Capital Efficiency Challenge
**Bounty Value: Improve liquidity and capital efficiency using Hyperion SDK**

- **CLMM Vault Aggregation**: Automated Concentrated Liquidity management
  - Integration with Hyperion CLMM pools
  - Real-time TVL and APY tracking
  - Auto-compounding strategies
  - Capital efficiency optimization

- **Vault Rebalancing**: Dynamic position management
  - Oracle-based price feed integration
  - Automatic rebalancing based on intervals
  - Slippage protection
  - Performance fee collection

**Files**: `/move/sources/vault_core.move`, `/lib/services/vault-aggregator.ts`, `/lib/services/hyperion.ts`

---

## 🚀 Key Features

### 1. **Multi-Protocol Yield Aggregator**
Aggregate liquidity and yield opportunities across:
- Liquidswap DEX
- Hyperion CLMM
- Tapp.Exchange
- Internal Zenith strategies

**Value Proposition**: One interface to compare and access all Aptos DeFi yield opportunities

### 2. **Funding Rate Arbitrage Engine**
- Automated scanning for profitable funding rate opportunities
- Risk scoring and confidence metrics
- One-click execution with customizable sizing
- Real-time P&L tracking with funding accrual

**Value Proposition**: Earn consistent returns from perpetual funding rates with minimal risk

### 3. **Real-time Portfolio Intelligence**
- Comprehensive position tracking across all protocols
- Live P&L updates via Nodit infrastructure
- Performance analytics with Sharpe ratio, volatility, max drawdown
- Transaction history and gas tracking

**Value Proposition**: Complete visibility into your DeFi positions and performance

### 4. **Advanced Trading Infrastructure**
- Perpetual futures with up to 50x leverage (Kana Labs)
- Dynamic fee optimization (Tapp.Exchange)
- Limit orders and TWAP execution
- Cross-chain swaps via Kana Aggregator

**Value Proposition**: Professional-grade trading tools on Aptos

### 5. **Smart Vault Strategies**
- Delta-neutral farming
- CLMM auto-compounding
- Funding rate arbitrage vaults
- Custom rebalancing logic

**Value Proposition**: Set-and-forget yield generation with automated optimization

---

## 🏗️ Architecture

### Smart Contracts (Move)
```
move/sources/
├── vault_core.move          # Core vault logic with rebalancing
├── funding_arbitrage.move   # Arbitrage position tracking
└── tapp_hooks.move         # Tapp.Exchange hook implementations
```

### Backend Services (TypeScript)
```
lib/services/
├── funding-arb-engine.ts    # Arbitrage opportunity scanner
├── vault-aggregator.ts      # Multi-protocol vault aggregation
├── portfolio-analytics.ts   # Real-time portfolio tracking
├── tapp-exchange.ts        # Tapp hooks integration
├── kana-perps.ts           # Perpetual futures API
├── kana-aggregator.ts      # Cross-chain swaps
├── nodit.ts                # Blockchain data provider
├── hyperion.ts             # CLMM integration
├── pyth-oracle.ts          # Price feeds
└── liquidswap.ts           # DEX integration
```

### Frontend (Next.js)
```
app/
├── page.tsx                # Dashboard with live stats
├── arbitrage/page.tsx      # Funding rate arbitrage UI
├── trading/page.tsx        # Perpetual futures trading
├── vaults/page.tsx         # Yield vault marketplace
├── portfolio/page.tsx      # Portfolio analytics
└── cross-chain/page.tsx    # Cross-chain transfers
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- An Aptos wallet (Petra, Martian, or Pontem)
- (Optional) Aptos CLI for contract deployment

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zenith.git
cd zenith

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your API keys in .env.local
# - NEXT_PUBLIC_KANA_API_KEY (get from https://kanalabs.io/)
# - NEXT_PUBLIC_NODIT_API_KEY (get from https://developer.nodit.io/)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deploy Smart Contracts

```bash
# Install Aptos CLI if not already installed
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize your account
aptos init --network testnet

# Compile contracts
cd move
aptos move compile

# Deploy to testnet
aptos move publish --named-addresses zenith=<your-address>

# Update contract addresses in .env.local
NEXT_PUBLIC_VAULT_CORE_ADDRESS=<deployed-address>
NEXT_PUBLIC_TAPP_HOOKS_ADDRESS=<deployed-address>
```

---

## 📖 Usage Guide

### 1. Funding Rate Arbitrage

1. Navigate to the **Arbitrage** page
2. Click **"Start Scanner"** to begin monitoring funding rates
3. Review detected opportunities with APY, confidence, and risk scores
4. Click on an opportunity to see details
5. Enter your investment amount (minimum = required collateral)
6. Click **"Execute"** to open the position
7. Monitor your active positions in real-time

### 2. Vault Investment

1. Go to the **Vaults** page
2. Compare vaults by APY, TVL, risk level, and protocol
3. Filter by risk tolerance or preferred tokens
4. Click **"Deposit"** on your chosen vault
5. Enter deposit amount and confirm
6. Track your position in the **Portfolio** page

### 3. Perpetual Trading

1. Visit the **Trading** page
2. Select your market (APT-PERP, BTC-PERP, ETH-PERP)
3. Choose order type (Market, Limit, Stop-Loss)
4. Set leverage (1x-50x)
5. Place your order
6. Monitor positions with live P&L updates

### 4. Portfolio Tracking

1. Open the **Portfolio** page
2. View aggregated positions across all protocols
3. See real-time P&L and allocation charts
4. Review transaction history
5. Download performance reports

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand, TanStack Query
- **Charts**: Recharts, Lightweight Charts
- **UI Components**: Radix UI, Shadcn/ui

### Blockchain
- **Network**: Aptos Testnet/Mainnet
- **Language**: Move
- **SDK**: @aptos-labs/ts-sdk
- **Wallet Adapter**: @aptos-labs/wallet-adapter-react

### APIs & Services
- **Kana Labs**: Perpetual futures trading & aggregation
- **Nodit**: Real-time blockchain data & indexing
- **Tapp.Exchange**: Custom DEX hooks
- **Hyperion**: CLMM liquidity pools
- **Pyth Network**: Decentralized price oracles
- **Circle CCTP**: Cross-chain USDC transfers

---

## 📊 Smart Contract Features

### `vault_core.move`
- ✅ Multi-strategy vault support (CLMM, Delta-Neutral, Arbitrage, Funding-Arb)
- ✅ Deposit/withdraw with share-based accounting
- ✅ Performance and management fees
- ✅ Automated rebalancing with interval controls
- ✅ Oracle-based price verification
- ✅ Slippage protection
- ✅ Emergency pause functionality

### `funding_arbitrage.move`
- ✅ Position tracking for arbitrage trades
- ✅ Profit calculation with funding accrual
- ✅ Opportunity recording for historical analysis
- ✅ Event emission for off-chain monitoring
- ✅ User portfolio aggregation

### `tapp_hooks.move`
- ✅ Dynamic fee calculation based on volatility & volume
- ✅ Limit order book with price triggers
- ✅ TWAP order execution with intervals
- ✅ NFT-gated pools with fee discounts
- ✅ Comprehensive event logging

---

## 🔐 Environment Variables

```env
# Network Configuration
NEXT_PUBLIC_APTOS_NETWORK=testnet

# API Keys
NEXT_PUBLIC_KANA_API_KEY=your_kana_api_key
NEXT_PUBLIC_NODIT_API_KEY=your_nodit_api_key

# Contract Addresses (update after deployment)
NEXT_PUBLIC_VAULT_CORE_ADDRESS=0x...
NEXT_PUBLIC_TAPP_HOOKS_ADDRESS=0x...
NEXT_PUBLIC_FUNDING_ARB_ADDRESS=0x...

# Optional: Circle CCTP
NEXT_PUBLIC_CIRCLE_API_KEY=your_circle_api_key
```

---

## 📚 Documentation Links

- [Aptos Developer Docs](https://aptos.dev/en)
- [Move by Examples](https://github.com/aptos-labs/move-by-examples)
- [Kana Perps API](https://docs.kanalabs.io/products-and-features/trading-apis/kana-perps-api)
- [Nodit API Reference](https://developer.nodit.io/reference/aptos-quickstart)
- [Tapp.Exchange Hook Docs](https://github.com/tapp-exchange/hook-documentation)
- [Hyperion SDK](https://hyperion.xyz/)

---

## 🎯 Roadmap

### Phase 1 (Hackathon) ✅
- [x] Multi-protocol vault aggregation
- [x] Funding rate arbitrage engine
- [x] Real-time portfolio analytics
- [x] Tapp.Exchange hooks integration
- [x] Kana Perps trading interface

### Phase 2 (Post-Hackathon)
- [ ] Mobile app (React Native)
- [ ] Advanced backtesting tools
- [ ] Social trading & leaderboards
- [ ] Automated strategy marketplace
- [ ] DAO governance

### Phase 3 (Future)
- [ ] Options trading
- [ ] Prediction markets
- [ ] NFT-backed lending
- [ ] Cross-chain vault strategies

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

Special thanks to:
- **Aptos Foundation** for the CTRL+MOVE Hackathon
- **Kana Labs** for perpetual futures infrastructure
- **Nodit** for blockchain data APIs
- **Tapp.Exchange** for composable DEX hooks
- **Hyperion** for CLMM liquidity

---

**Built with ❤️ for the Aptos CTRL+MOVE Hackathon 2025** 🚀
