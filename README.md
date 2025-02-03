# PrivatelyNFT

## Description

**PrivatelyNFT** is a smart contract developed in Solidity that enables the management and exchange of digital assets as NFTs. This project includes a TypeScript environment to facilitate interaction with the contract, along with a suite of tests to ensure its proper functionality.

The smart contract and the associated TypeScript library support a meta-transaction system. Meta-transactions allow users to sign messages off-chain, while a relayer submits the transaction on-chain, covering the gas fees on their behalf. The project is designed to operate on the **Base** blockchain.

## Requirements

Before getting started, make sure you have installed the necessary dependencies:

- [Node.js v22.13.1](https://nodejs.org/)
- [npm v11.1.0](https://www.npmjs.com/)
- [Hardhat v2.22.18](https://hardhat.org/)
- [Solidity v0.8.28](https://soliditylang.org/)

## Installation

Clone this repository and install the dependencies:

```sh
npm install
```

## Running a Local Hardhat Node and Deploying the Smart Contract

To start a local Hardhat environment and deploy the smart contract, use the following script:

```sh
./run_node.sh
```

This script initializes a local Hardhat node and automatically deploys the smart contract.

## Tests

A test suite is available to verify the functionality of the smart contract and the TypeScript library. To run the tests, navigate to the `lib/` directory and execute:

```sh
cd lib && npm test
```

The tests include validations for:

- NFT creation and minting
- NFT transfers
- Permission management and private access

## Smart Contract Documentation

For a detailed explanation of the **PrivatelyNFT** smart contract, including its meta-transaction system, security considerations, and implementation details, refer to the [Smart Contract Documentation](docs/smart_contract.md).

## Library Documentation

To learn more about the **PrivatelyNFT Library** and how it facilitates interaction with the smart contract, refer to the [Library Documentation](docs/library.md).

