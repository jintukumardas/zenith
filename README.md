# Zenith - Advanced DeFi Trading Platform on Aptos

Zenith is a DeFi trading and portfolio management platform built on the Aptos blockchain. It combines advanced perpetual futures trading, intelligent vault strategies, real-time analytics, cross-chain payments, and custom DEX composability.

## ✨ Features

### Core Functionality
- 🔥 **Perpetual Futures Trading** (Kana Labs Integration)
  - Multi-market support (APT, BTC, ETH)
  - Advanced order types (Market, Limit, Stop-Loss, Take-Profit)
  - Up to 50x leverage
  - Real-time position tracking

- 💎 **Intelligent Vault Strategies** (Hyperion Integration)
  - Auto-compounding CLMM vaults
  - Delta-neutral strategies
  - Automated rebalancing and fee harvesting

- 🔗 **Custom DEX Hooks** (Tapp Exchange)
  - Dynamic Fee Optimization
  - Gasless Limit Orders
  - TWAP execution
  - NFT-gated liquidity pools

- ⚡ **Cross-Chain USDC** (Circle CCTP)
  - Transfer from 9+ chains to Aptos
  - Native burn-and-mint mechanism
  - Sub-minute settlement times

- 📡 **Real-Time Infrastructure** (Nodit)
  - WebSocket data streaming
  - Event monitoring
  - Transaction tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- An Aptos wallet (Petra, Martian, or Pontem)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
zenith-frontend/
├── app/                      # Next.js pages
├── components/               # React components
│   ├── ui/                  # Base UI components
│   ├── providers/           # Context providers
│   └── navigation.tsx       # Main navigation
├── lib/                     # Core libraries
│   ├── services/           # API service clients
│   └── stores/             # State management
└── move/                    # Move smart contracts
    └── sources/
        ├── vault_core.move
        └── tapp_hooks.move
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **State**: Zustand, TanStack Query
- **Blockchain**: Aptos, Move language
- **APIs**: Kana Perps, Nodit, Hyperion, Circle CCTP

## 📝 Smart Contracts

### Deploy Contracts

```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize account
aptos init

# Compile and deploy
cd move
aptos move compile
aptos move publish --named-addresses zenith=<your-address>
```

## 🔐 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_KANA_API_KEY=your_key_here
NEXT_PUBLIC_NODIT_API_KEY=your_key_here
```

## 📚 Documentation

- [Aptos Documentation](https://aptos.dev)
- [Kana Perps API](https://docs.kanalabs.io/products-and-features/trading-apis/kana-perps-api)
- [Nodit API](https://developer.nodit.io/reference/aptos-quickstart)
- [Hyperion Docs](https://docs.hyperion.xyz)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

---

Built for the CTRL+MOVE Hackathon 🚀
