# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a smart contract ecosystem for the Privately platform built for Base blockchain, featuring:
- **PrivatelyCoin**: ERC20 token serving as auction currency
- **PrivatelyCollection**: ERC721 NFT collection with metadata
- **PrivatelyAuctionSystem**: English auction system with meta-transactions

The system uses **EIP-712 gasless meta-transactions** - users sign typed data messages that are relayed by a service, eliminating gas fees for end users.

## Development Commands

### Testing
```bash
# Run complete test suite (smart contracts + client library) in Docker
./run_tests.sh
```

### Development & Deployment
```bash
# Start local development node
./run_node.sh
```

## Architecture

### Smart Contracts (`/contracts/`)
- **PrivatelyCoin.sol**: ERC20 with meta-transaction support (metaTransfer, metaApprove)
- **PrivatelyCollection.sol**: ERC721 with URI storage and meta-transactions (metaMint, metaTransfer, metaApprove)
- **PrivatelyAuctionSystem.sol**: Core auction logic with meta-transactions (metaCreateAuction, metaBidAuction)

All contracts inherit from OpenZeppelin standards and use EIP712 for signature verification.

### Client Library (`/lib/src/`)
TypeScript library structure:
- **client.ts**: Main PrivatelyClient orchestrating all modules
- **modules/coin/**: PrivatelyCoin interaction logic
- **modules/collection/**: PrivatelyCollection interaction logic  
- **modules/auctions/**: PrivatelyAuctionSystem interaction logic
- **common/**: Shared utilities, errors, and signature helpers

### Meta-Transaction Pattern
Each contract function requiring user authorization follows this pattern:
1. User signs EIP-712 typed data off-chain
2. Relayer calls `meta*` function with signature
3. Contract verifies signature and executes on user's behalf
4. Nonces prevent replay attacks

## Key Files
- `hardhat.config.ts`: Hardhat configuration for Solidity 0.8.28
- `lib/package.json`: Client library configuration with TypeScript build
- `docs/smart-contracts.md`: Detailed contract documentation
- `docs/client-library.md`: Client library usage guide

## Testing Strategy
- Smart contracts: Hardhat tests with full scenario coverage
- Client library: Mocha/Chai tests with nyc coverage reporting
- Integration: Docker-compose orchestrated testing

## Build Artifacts
- Contract ABIs: `artifacts/contracts/`
- TypeChain types: `typechain-types/`
- Client library build: `lib/dist/`
- Deployable ABIs: `lib/*.json`
- Utilises au maximum possible les sub agents pour chaque tâches !
- You must always use agens (sub-agents)