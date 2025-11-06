# Solana X402 Hackathon Submission

## Project: MicroAPI Hub

**Team**: [Your Team Name]  
**Hackathon**: Solana X402 Hackathon  
**Submission Date**: [Date]  
**Demo Video**: [Link to 3-minute demo video]

---

## Overview

MicroAPI Hub is a complete end-to-end implementation of the x402 payment protocol for Solana, enabling API monetization with blockchain payments. The project provides a facilitator service, provider API, web UI, and on-chain registry for discovering and paying for APIs.

---

## Features Demonstrated

### ✅ Core Requirements Met

1. **x402 Protocol Integration**: Full implementation of x402 protocol for Solana
2. **Solana Integration**: Deployed to Solana devnet (mainnet-ready)
3. **Open Source**: All code is open source and available on GitHub
4. **Demo Video**: 3-minute demonstration video showcasing the project

### 🎯 Key Features

1. **Facilitator Service**
   - Payment verification with signature validation
   - On-chain settlement (native SOL and SPL tokens)
   - Nonce replay protection
   - Auto-funding on devnet
   - Redis/file-based storage for nonces

2. **Provider API**
   - x402 protocol implementation
   - 402 Payment Required responses
   - Dynamic route configuration
   - Discovery endpoint (`.well-known/x402`)

3. **Web UI**
   - Wallet connection (Phantom, Solflare)
   - Payment flow UI with modal
   - Resource discovery
   - Transaction history
   - Receipt viewer
   - Complete documentation pages

4. **Registry Contract**
   - On-chain API listings (Anchor program)
   - Provider registration
   - Category-based organization
   - Active/inactive listing management

5. **Developer Experience**
   - Code examples (TypeScript, Python, Go)
   - Comprehensive documentation
   - E2E test suite
   - Docker support

---

## Architecture

```
┌─────────────┐
│   Client    │ (Web UI, Agent, API Client)
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│  Provider   │ (API Server)
│     API     │
└──────┬──────┘
       │ 402 Payment Required
       │ + PaymentRequirements
       ▼
┌─────────────┐
│   Client    │ Creates Payment Authorization
└──────┬──────┘
       │ POST with X-PAYMENT header
       ▼
┌─────────────┐
│  Provider   │
│     API     │
└──────┬──────┘
       │ POST /verify, POST /settle
       ▼
┌─────────────┐
│ Facilitator │ Verifies & Settles on Solana
└──────┬──────┘
       │ Transaction Hash
       ▼
┌─────────────┐
│  Provider   │ Returns 200 + X-PAYMENT-RESPONSE
│     API     │
└─────────────┘
```

---

## Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Blockchain**: Solana (Anchor), @solana/web3.js
- **Frontend**: Next.js, React, Tailwind CSS
- **Wallet**: @solana/wallet-adapter-react
- **Validation**: Zod
- **Testing**: Vitest
- **Infrastructure**: Docker, Docker Compose

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or pnpm
- Solana CLI (optional, for contract deployment)
- Docker (optional, for containerized deployment)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone [repository-url]
   cd microapi-hub
   npm install --workspaces
   ```

2. **Start Facilitator**
   ```bash
   cd services/facilitator
   # Create .env file with:
   # PORT=8787
   # NETWORK=devnet
   # RPC_URL=https://api.devnet.solana.com
   # FEE_PAYER_SECRET=<your-keypair-base58>
   npm run dev
   ```

3. **Start Provider API**
   ```bash
   cd services/provider-api
   # Create .env file with:
   # PORT=8080
   # PAY_TO_PUBKEY=<your-solana-pubkey>
   # USDC_MINT=<devnet-usdc-mint>
   # FACILITATOR_URL=http://localhost:8787
   npm run dev
   ```

4. **Start Web UI**
   ```bash
   cd clients/web
   # Create .env.local with:
   # NEXT_PUBLIC_PROVIDER_DISCOVERY_URL=http://localhost:8080/.well-known/x402
   npm run dev
   ```

5. **Access Application**
   - Web UI: http://localhost:3000
   - Provider API: http://localhost:8080
   - Facilitator: http://localhost:8787

---

## Demo Video Script

### Scene 1: Introduction (30 seconds)
- Show the MicroAPI Hub homepage
- Explain what x402 is and why it matters
- Highlight the problem: API monetization with blockchain payments

### Scene 2: Payment Flow (90 seconds)
- Connect wallet (Phantom)
- Browse available APIs
- Click on a resource
- Show payment modal with requirements
- Execute payment
- Show transaction confirmation on Solscan
- Display successful payment receipt

### Scene 3: Technical Details (30 seconds)
- Show provider API returning 402
- Show facilitator verifying payment
- Show on-chain settlement
- Highlight registry contract integration

### Scene 4: Developer Experience (30 seconds)
- Show code examples page
- Highlight TypeScript, Python, Go examples
- Show API documentation
- Mention one-line integration

---

## Judging Criteria Alignment

### ✅ x402 Protocol Integration
- Full implementation of x402 spec
- Proper 402 responses
- Payment header format
- Verification and settlement flows

### ✅ Solana Integration
- Deployed to devnet
- Native SOL and SPL token support
- Transaction verification
- On-chain settlement

### ✅ Open Source
- All code on GitHub
- Comprehensive documentation
- Clear setup instructions
- Code examples

### ✅ Demo Video
- 3-minute maximum
- Clear demonstration of features
- Shows end-to-end flow
- Professional presentation

### ✅ Documentation
- README with setup instructions
- API documentation
- Developer guide
- Code examples

---

## What Makes This Special

1. **Complete Stack**: End-to-end implementation from facilitator to UI
2. **Production-Ready**: Error handling, validation, logging, testing
3. **Developer-Friendly**: Comprehensive docs, code examples, easy integration
4. **On-Chain Registry**: Decentralized API discovery
5. **Multi-Language**: Support for TypeScript, Python, Go
6. **Wallet Integration**: Seamless payment UX with wallet adapters

---

## Future Enhancements

- [ ] Mainnet deployment
- [ ] Multi-chain support (EVM chains)
- [ ] Advanced payment schemes (deferred, subscriptions)
- [ ] Analytics dashboard
- [ ] Webhook notifications
- [ ] Rate limiting per client
- [ ] Usage analytics

---

## Links

- **Repository**: [GitHub URL]
- **Demo Video**: [Video URL]
- **Documentation**: [Docs URL]
- **Live Demo**: [Demo URL]

---

## Contact

- **Email**: [Your Email]
- **Twitter**: [Your Twitter]
- **GitHub**: [Your GitHub]

---

## Acknowledgments

- Coinbase for the x402 protocol specification
- Solana Foundation for the hackathon
- All open-source contributors

