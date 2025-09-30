# Zenith - Deployment Guide

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Configuration

Edit `.env.local` with your configuration:

```env
# Aptos Configuration
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_VAULT_CORE_ADDRESS=<your-vault-contract-address>
NEXT_PUBLIC_STRATEGY_ADDRESS=<your-strategy-contract-address>
NEXT_PUBLIC_TAPP_HOOKS_ADDRESS=<your-hooks-contract-address>

# Kana Perps API Key (contact [email protected])
NEXT_PUBLIC_KANA_API_KEY=your_api_key_here

# Nodit API Key (get from https://developer.nodit.io)
NEXT_PUBLIC_NODIT_API_KEY=your_api_key_here

# Circle CCTP
NEXT_PUBLIC_CCTP_ENABLED=true
```

## Smart Contract Deployment

### 1. Install Aptos CLI

```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### 2. Initialize Aptos Account

```bash
aptos init --network testnet
```

This will create a `.aptos` directory with your account configuration.

### 3. Fund Your Account

Get test APT from the faucet:
```bash
aptos account fund-with-faucet --account default
```

Or use the web faucet: https://aptoslabs.com/testnet-faucet

### 4. Compile Move Contracts

```bash
cd move
aptos move compile --named-addresses zenith=<your-address>
```

Replace `<your-address>` with your account address from step 2.

### 5. Deploy Contracts

```bash
aptos move publish --named-addresses zenith=<your-address>
```

After successful deployment, note the published package address.

### 6. Update Environment Variables

Copy the deployed contract addresses and update `.env.local`:
```env
NEXT_PUBLIC_VAULT_CORE_ADDRESS=<deployed-address>
NEXT_PUBLIC_STRATEGY_ADDRESS=<deployed-address>
NEXT_PUBLIC_TAPP_HOOKS_ADDRESS=<deployed-address>
```

## Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment Platforms

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy

### Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect your repository
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Add environment variables
7. Deploy

### AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure
amplify init
amplify add hosting
amplify publish
```

## Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t zenith .
docker run -p 3000:3000 --env-file .env.local zenith
```

## API Key Setup

### Kana Perps API

1. Email [email protected]
2. Request API key for testnet
3. Add to `.env.local` as `NEXT_PUBLIC_KANA_API_KEY`

### Nodit API

1. Go to https://developer.nodit.io
2. Sign up for an account
3. Create a new project
4. Copy your API key
5. Add to `.env.local` as `NEXT_PUBLIC_NODIT_API_KEY`

## Wallet Setup

The application supports:
- Petra Wallet
- Martian Wallet
- Pontem Wallet

Users need to install one of these wallet extensions in their browser.

### For Development

Install Petra Wallet:
https://petra.app/

## Monitoring & Analytics

### Application Monitoring

Add these services to your production deployment:

1. **Sentry** (Error Tracking)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

2. **Vercel Analytics** (Performance)
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// In your layout:
<Analytics />
```

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** in production
4. **Set up CORS** properly for API calls
5. **Implement rate limiting** on API endpoints
6. **Regular security audits** for smart contracts

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Wallet Connection Issues

1. Check if wallet extension is installed
2. Verify network is set to testnet/mainnet
3. Clear browser cache
4. Check console for errors

### Contract Deployment Errors

1. Ensure account has sufficient APT
2. Verify Move.toml configuration
3. Check for compilation errors
4. Review gas price and limits

## Performance Optimization

### Next.js Optimizations

1. Enable ISR (Incremental Static Regeneration)
2. Optimize images with `next/image`
3. Use dynamic imports for large components
4. Enable compression in production

### Caching Strategy

1. Cache static assets (24 hours)
2. Cache API responses (5 minutes)
3. Use Redis for session storage
4. Implement CDN for global distribution

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit
npm audit fix

# Update Aptos SDK
npm install @aptos-labs/ts-sdk@latest
```

### Monitoring Contract Health

```bash
# Check contract state
aptos move view --function-id <address>::vault_core::get_vault_info

# Monitor events
aptos event get-by-creation-number --address <address>
```

## Support

For issues and questions:
- GitHub: [Create an issue]
- Discord: [Join community]
- Email: [email protected]

## License

MIT License - See LICENSE file for details
