# Privately Smart Contract Ecosystem

A comprehensive blockchain ecosystem for the Privately platform, built for Base blockchain, featuring gasless meta-transactions and decentralized auctions.

## Table of Contents

- [Overview](#overview)
- [Smart Contracts](#smart-contracts)
- [Client Library](#client-library)
- [Meta-Transaction System](#meta-transaction-system)
- [Security Features](#security-features)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Development](#development)

## Overview

The Privately ecosystem consists of three interconnected smart contracts and a TypeScript client library that enables gasless transactions through EIP-712 meta-transactions. Users can create, trade, and auction NFTs using custom ERC20 tokens without paying gas fees directly.

### Architecture Components

- **PrivatelyCoin**: ERC20 token serving as the auction currency
- **PrivatelyCollection**: ERC721 NFT collection with metadata storage
- **PrivatelyAuctionSystem**: English auction system with bidding and settlement
- **Client Library**: TypeScript library for seamless interaction with all contracts

### Key Features

- **Gasless Transactions**: Users sign messages off-chain, relayers execute on-chain
- **EIP-712 Signatures**: Typed data signing for enhanced security and UX
- **Reentrancy Protection**: Built-in safeguards against reentrancy attacks
- **Replay Attack Prevention**: Nonce-based system prevents transaction replay
- **OpenZeppelin Security**: Battle-tested security patterns and libraries
- **Docker Integration**: Complete testing and deployment automation

## Smart Contracts

### PrivatelyCoin (ERC20)

A custom ERC20 token with meta-transaction capabilities for gasless transfers and approvals.

**Key Features:**
- Standard ERC20 functionality with minting capabilities
- Meta-transaction support via `metaTransfer()` and `metaApprove()`
- Role-based access control for minting operations
- Separate nonces for transfer and approve operations
- Custom events for enhanced transaction tracking

**Security Implementations:**
- AccessControl for minter role management
- Nonce-based replay protection
- EIP-712 signature verification
- Input validation and balance checks

### PrivatelyCollection (ERC721)

An NFT collection contract enabling gasless minting, transfers, and approvals with metadata storage.

**Key Features:**
- ERC721 with URI storage for metadata
- Meta-transaction support for all major operations
- Internal data storage (title, author) linked to token IDs
- Comprehensive collection management functions
- Token enumeration and user collection queries

**Security Implementations:**
- Ownership verification for all operations
- Nonce-based replay protection per operation type
- EIP-712 typed data signatures
- Existence checks and input validation

### PrivatelyAuctionSystem

A sophisticated English auction system with gasless bidding and automatic settlement.

**Key Features:**
- English auction mechanism with time-based endings
- Meta-transaction support for auction creation and bidding
- Automatic outbid refund system via pending withdrawals
- Comprehensive auction state management
- Multi-query functions for auction discovery

**Security Implementations:**
- ReentrancyGuard protection on all state-changing functions
- SafeERC20 for secure token transfers
- Time-based validation and auction state management
- Bid validation with minimum requirements
- Secure NFT custody during auctions

## Client Library

The TypeScript client library provides a high-level interface for interacting with all smart contracts, handling meta-transaction creation, signature generation, and contract communication.

### Architecture

```
lib/src/
├── client.ts                 # Main orchestrator class
├── common/
│   ├── privately.error.ts    # Error handling utilities
│   └── request-signature.ts  # Signature request types
└── modules/
    ├── coin/                 # PrivatelyCoin interactions
    ├── collection/           # PrivatelyCollection interactions
    └── auctions/             # PrivatelyAuctionSystem interactions
```

### Core Client Class

```typescript
import { PrivatelyClient } from 'privately-smartcontract-lib';

// Initialize client
const client = await PrivatelyClient.create(signer);

// Access module-specific functionality
await client.coin.createTransferRequest(to, amount);
await client.collection.createMintRequest(title, tokenURI);
await client.auctions.createAuctionRequest(tokenId, startPrice, endTime);
```

### Module Structure

Each module (coin, collection, auctions) follows a consistent pattern:
- **Client Class**: Main interface for contract interaction
- **Request Types**: TypeScript interfaces for EIP-712 data structures
- **Error Handling**: Module-specific error types with parsing
- **Event Listeners**: Event subscription and handling
- **Nonce Management**: Automatic nonce tracking and retrieval

### Meta-Transaction Workflow

1. **Request Creation**: Client creates typed data structure with current nonce
2. **Signature Generation**: User signs EIP-712 message with wallet
3. **Request Relay**: Relayer submits transaction with signature to contract
4. **On-Chain Verification**: Contract verifies signature and executes function
5. **Nonce Increment**: Contract increments nonce to prevent replay

## Meta-Transaction System

The ecosystem uses EIP-712 meta-transactions to enable gasless user interactions. This system allows users to interact with the platform without holding ETH for gas fees.

### EIP-712 Implementation

Each contract defines typed data structures for meta-transactions:

```solidity
// Example: Transfer request structure
struct TransferRequest {
    address from;
    address to;
    uint256 amount;
    uint256 nonce;
}

// EIP-712 type hash
bytes32 private constant TRANSFER_REQUEST_TYPEHASH = keccak256(
    "TransferRequest(address from,address to,uint256 amount,uint256 nonce)"
);
```

### Signature Process

1. **Domain Separator**: Each contract has a unique EIP-712 domain
2. **Typed Data**: Structured data matching contract expectations  
3. **User Signature**: Wallet signs the typed data message
4. **Signature Recovery**: Contract recovers signer address from signature
5. **Authorization**: Contract verifies signer matches expected user

### Nonce Management

Each contract maintains separate nonce mappings for different operation types:

```solidity
// Separate nonces per user per operation type
mapping(address => uint256) public transferNonces;
mapping(address => uint256) public approveNonces;
mapping(address => uint256) public mintNonces;
```

**Benefits:**
- Prevents replay attacks across all operations
- Allows parallel operation types without blocking
- Simple integer increment provides ordering
- Gas-efficient single storage slot per user per operation

## Security Features

### OpenZeppelin Integration

The contracts extensively use OpenZeppelin's battle-tested libraries:

- **ERC20/ERC721**: Standard token implementations with proven security
- **AccessControl**: Role-based permission management
- **ReentrancyGuard**: Protection against reentrancy attacks
- **SafeERC20**: Safe token transfer operations with return value handling
- **EIP712**: Standardized typed data signing infrastructure
- **ECDSA**: Cryptographic signature verification utilities

### Reentrancy Protection

The auction system uses OpenZeppelin's `ReentrancyGuard` modifier on all state-changing functions:

```solidity
function metaBidAuction(...) external nonReentrant {
    // State changes protected against reentrancy
}

function withdraw() external nonReentrant {
    // Withdrawal function secured
}
```

**Protection Mechanism:**
- Sets internal lock before function execution
- Reverts if function is called recursively
- Releases lock after successful completion
- Prevents classic reentrancy attack vectors

### Nonce-Based Replay Protection

Each user has individual nonces per operation type that increment with each meta-transaction:

```solidity
function metaTransfer(..., uint256 nonce, ...) external {
    require(nonce == transferNonces[from], "Invalid nonce");
    transferNonces[from]++; // Increment after verification
    // Execute transfer logic
}
```

**Security Benefits:**
- Each signature can only be used once
- Sequential ordering prevents out-of-order execution
- User-specific nonces prevent cross-user replay
- Multiple operation types allow parallel processing

### Input Validation

All contracts implement comprehensive input validation:

```solidity
// Time validation
require(endTime > block.timestamp, "End time in past");
require(endTime <= block.timestamp + 7 days, "End time must be within 7 days");

// Amount validation  
require(bidAmount > auction.highestBid, "Bid not high enough");
require(bidAmount >= auction.startPrice, "Bid below start price");

// Authorization validation
require(signer == seller, "Invalid signature");
require(ownerOf(tokenId) == seller, "Not the owner");
```

### Safe Token Operations

The auction system uses OpenZeppelin's SafeERC20 for all token operations:

```solidity
using SafeERC20 for IERC20;

// Safe transfers with automatic revert on failure
coinContract.safeTransferFrom(bidder, address(this), bidAmount);
coinContract.safeTransfer(auction.seller, auction.highestBid);
```

**Benefits:**
- Handles tokens with non-standard return values
- Automatic revert on transfer failure
- Protection against token contract bugs
- Consistent behavior across different token implementations

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Quick Start

1. **Run tests to verify setup:**
   ```bash
   ./run_tests.sh
   ```

2. **Start development node with deployed contracts:**
   ```bash
   ./run_node.sh
   ```

The development node will be available at `http://localhost:8545` with all contracts pre-deployed.

## Testing

### Complete Test Suite

Run the comprehensive test suite covering both smart contracts and client library:

```bash
./run_tests.sh
```

**Test Process:**
1. Builds Docker containers with all dependencies
2. Starts Hardhat node in test mode
3. Deploys all smart contracts to local network
4. Copies contract ABIs to client library
5. Executes client library test suite with coverage reporting
6. Tears down containers and cleans up volumes

**Coverage Reporting:**
- Uses NYC for TypeScript coverage analysis
- Tests include unit tests, integration tests, and end-to-end scenarios
- Coverage includes signature generation, meta-transaction relaying, and contract interactions

### Test Structure

```
lib/test/
├── all.test.ts        # Complete end-to-end scenarios
├── auctions.test.ts   # Auction system functionality
├── coin.test.ts       # Token operations and meta-transactions
├── collection.test.ts # NFT minting and transfers
└── system.test.ts     # Cross-contract integration tests
```

## Development

### Local Development Node

Start a persistent Hardhat node with deployed contracts:

```bash
./run_node.sh
```

**Development Process:**
1. Creates Docker network for container communication
2. Builds development container with project dependencies
3. Starts Hardhat node listening on all interfaces (0.0.0.0:8545)
4. Automatically deploys all contracts to local network
5. Exposes node on `localhost:8545` for external connections
6. Keeps node running until manually stopped

**Contract Addresses:**
- PrivatelyCoin: `0x5fbdb2315678afecb367f032d93f642f64180aa3`
- PrivatelyCollection: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- PrivatelyAuctionSystem: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

### Building Client Library

```bash
cd lib
npm run build
```

Builds TypeScript source and copies contract ABIs to the distribution directory.

### Project Structure

```
Privately-SmartContract/
├── contracts/              # Solidity smart contracts
│   ├── PrivatelyCoin.sol
│   ├── PrivatelyCollection.sol
│   └── PrivatelyAuctionSystem.sol
├── lib/                    # TypeScript client library
│   ├── src/               # Library source code
│   ├── test/              # Client library tests
│   └── dist/              # Built library output
├── scripts/               # Deployment and utility scripts
├── docker/                # Docker-specific scripts
├── hardhat.config.ts      # Hardhat configuration
├── run_tests.sh          # Test execution script
└── run_node.sh           # Development node script
```

### Contract Compilation

The project uses Hardhat for compilation and deployment:

```bash
npx hardhat compile  # Compile contracts
npx hardhat test     # Run Hardhat contract tests
npx hardhat run scripts/deploy.ts --network localhost  # Deploy to local network
```
