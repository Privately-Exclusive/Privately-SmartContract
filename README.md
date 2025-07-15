# Privately Smart Contracts

[![CI](https://github.com/Privately-app/Privately-SmartContract/actions/workflows/ci.yml/badge.svg)](https://github.com/Privately-app/Privately-SmartContract/actions/workflows/ci.yml)

This repository contains the official smart contracts for the Privately ecosystem, designed for the **Base** blockchain. It includes contracts for a fungible token (ERC20), a non-fungible token collection (ERC721), and a comprehensive auction system.

The entire system is built around **gasless meta-transactions**, allowing users to interact with the blockchain without needing to pay for gas fees directly. This is achieved by having users sign EIP-712 typed data messages, which are then relayed by a separate service.

## Documentation

- **[Smart Contracts](./docs/smart-contracts.md)**: Detailed documentation on the architecture and functionality of the `PrivatelyCoin`, `PrivatelyCollection`, and `PrivatelyAuctionSystem` contracts.
- **[Client Library](./docs/client-library.md)**: A guide on how to use the TypeScript client library to interact with the smart contracts from a frontend or backend application.

## Project Structure

```
/
├── contracts/         # Solidity smart contracts
├── lib/               # TypeScript client library for interacting with contracts
├── docs/              # Detailed documentation
├── scripts/           # Deployment scripts
├── test/              # Hardhat tests
├── hardhat.config.ts  # Hardhat configuration
└── package.json
```

## Development

This project uses [Hardhat](https://hardhat.org/) as the development environment.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [Yarn](https://yarnpkg.com/)

### Installation

```bash
yarn install
```

### Compiling Contracts

```bash
yarn hardhat compile
```

### Running Tests

```bash
yarn hardhat test
```

### Deployment

The contracts can be deployed using the `deploy.ts` script. You will need to configure your `hardhat.config.ts` with the appropriate network details and private keys.

```bash
yarn hardhat run scripts/deploy.ts --network base
```