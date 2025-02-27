# Privately – Smart Contracts on Base

Welcome to **Privately-SmartContract**. This is the core blockchain component of the **Privately** project. Privately is set to revolutionize the world of NFTs by introducing a novel approach: NFTs that reference files stored locally on a user’s device (via the Privately app) rather than pointing to a publicly accessible file. This repository contains three main smart contracts, a TypeScript library for interacting with them, and scripts for running a local Hardhat environment to deploy and test everything. Below, you will find an in-depth overview of each part of this repository, how our meta-transaction system works, and how you can run it all in a local development environment.

---

## Table of Contents

1. [What Is Privately?](#what-is-privately)
2. [About This Repository](#about-this-repository)
3. [Smart Contracts](#smart-contracts)
    - [PrivatelyCoin.sol](#privatelycoinsol)
    - [PrivatelyCollection.sol](#privatelycollectionsol)
    - [PrivatelyAuctionSystem.sol](#privatelyauctionsystemsol)
4. [Meta-Transaction System](#meta-transaction-system)
5. [The TypeScript Library](#the-typescript-library)
6. [Local Development with Hardhat](#local-development-with-hardhat)
7. [Unit Testing](#unit-testing)

---

## What Is Privately?

**Privately** is a groundbreaking NFT project aiming to transform how NFTs are minted, stored, and traded. Traditionally, NFTs reference a file hosted on a publicly accessible server or IPFS. In contrast, Privately points each NFT to a file stored locally on the holder’s device, accessed and managed through our official Privately app.

This approach not only protects the privacy of NFT content but also ensures users have direct control over their digital assets. The Privately app itself serves as both a **wallet** and a **marketplace**, enabling users to:

- View their Privately NFTs locally.
- Put NFTs up for auction.
- Participate in auctions of other Privately NFT holders.

All NFT sales on Privately use an **auction-only model**. There are no fixed-price sales, making bidding and discovery of digital assets more dynamic and exciting.

---

## About This Repository

This repository hosts the **blockchain core** of the Privately ecosystem, designed to run on the [Base](https://base.org/) blockchain. Within these files, you will find three primary smart contracts (all utilizing [EIP-712](https://eips.ethereum.org/EIPS/eip-712) for structured data hashing and signing) and a supporting TypeScript library. Here is the high-level structure:

- **`./contracts/`**
    - `PrivatelyCoin.sol`
    - `PrivatelyCollection.sol`
    - `PrivatelyAuctionSystem.sol`

- **`./lib/`**
    - TypeScript library to interact with the above contracts.
    - Unit tests for both the library and contracts (`./lib/test`).

- **Root Scripts**
    - `./run_node.sh`: A script to start a local Hardhat Docker instance and deploy the three smart contracts for local development.
    - `./run_tests.sh`: A script to run all unit tests in a Docker container.

Additionally, we leverage a **meta-transaction** mechanism in our contracts, ensuring users don’t pay blockchain transaction fees directly. Instead, these fees are handled by our Relayer API located at [Privately-SmartContract-Relayer](https://github.com/Privately-Exclusive/Privately-SmartContract-Relayer).

---

## Smart Contracts

### PrivatelyCoin.sol

**PrivatelyCoin** is the **ERC20** token of the Privately platform, used for **all auction bids** and settlements within the ecosystem. By standardizing on a single currency, Privately ensures a streamlined and consistent auction experience. This contract implements the **EIP-712** standard for structured signing, facilitating meta-transactions and more secure interactions with off-chain components.

Key features:
- **ERC20-compliant**: Allows users to hold and transfer PrivatelyCoin.
- **EIP-712**: Enables efficient and secure off-chain signatures, forming the foundation of our meta-transaction system.

### PrivatelyCollection.sol

**PrivatelyCollection** manages the **ERC721** NFTs for the Privately platform. Unlike traditional NFTs that store metadata on public servers or IPFS, Privately NFTs reference **locally stored** content on the user’s device via the Privately app. This ensures privacy and control over sensitive content.

Key features:
- **ERC721URIStorage**: Adds storage-based URI management for NFT metadata like thumbnails, descriptions, and other details.
- **EIP-712**: Supports off-chain signatures to facilitate meta-transactions.
- **Local Storage Reference**: The token URI references content that’s never publicly accessible.

### PrivatelyAuctionSystem.sol

The **PrivatelyAuctionSystem** is the contract that orchestrates **all auctions** on the Privately marketplace. Every listing and every bid uses PrivatelyCoin as the currency. Participants can create, manage, and execute auctions, with the system ensuring fair settlements and automated fund distribution after each auction ends.

Key features:
- **EIP-712**: Facilitates meta-transactions and secure off-chain signature flows.
- **Auction-Only Model**: All NFT sales must go through an auction mechanism.
- **Integrations**: Designed to work seamlessly with the Privately app, PrivatelyCoin, and PrivatelyCollection.

---

## Meta-Transaction System

A primary goal for Privately is to deliver a seamless user experience. To achieve this, **users are not required to pay transaction fees** when they interact with our smart contracts. Instead, Privately implements a **meta-transaction** pattern:

1. **User Signs an Off-Chain Message**: Instead of sending a raw transaction, the user signs a message describing the intended blockchain operation.
2. **Relayer Submits the Transaction**: The signed message is forwarded to our [Privately-SmartContract-Relayer](https://github.com/Privately-Exclusive/Privately-SmartContract-Relayer), which validates the signature and submits the transaction to the blockchain.
3. **Network Fees Paid by Privately**: The relayer pays the actual network gas costs, allowing the user to interact without holding ETH or Base tokens for gas.

This system is powered by [EIP-712](https://eips.ethereum.org/EIPS/eip-712) to ensure robust security and ease of verification on-chain.

---

## The TypeScript Library

Inside the **`./lib`** folder, you will find a **TypeScript library** that simplifies interaction with the three contracts (`PrivatelyCoin.sol`, `PrivatelyCollection.sol`, and `PrivatelyAuctionSystem.sol`). It includes:

- **Contract Wrappers**: Type definitions and helper functions that abstract away raw contract interactions.
- **Utility Functions**: Methods for crafting EIP-712 signatures, generating user-friendly transactions, and interfacing with the meta-transaction flow.
- **Example Scripts**: Guiding you on how to perform common operations (minting, bidding, etc.).
- **Full Test Suite**: Unit tests in `./lib/test`, covering both the library’s functionality and the underlying smart contracts.

By using this library, developers can integrate Privately’s auction and NFT features into their own applications, ensuring a consistent approach to meta-transactions and token interactions.

---

## Local Development with Hardhat

We use [Hardhat](https://hardhat.org/) for local development and testing. Hardhat is a flexible Ethereum development environment that provides:

- **Compilation and Deployment**: Automated processes for compiling and deploying Solidity smart contracts.
- **Local Node**: A local blockchain simulator for running transactions without incurring real fees.
- **Testing Tools**: An environment for writing, running, and debugging tests with powerful assertion libraries.

For convenience, we provide a **Docker-based** setup, ensuring that everyone works in a standardized environment without local installation complications.

### `./run_node.sh`

This script starts a Docker container running a **local Hardhat node** and automatically deploys the three Privately contracts. Use this script to quickly get a functional local blockchain environment up and running.

**Usage**:
```bash
./run_node.sh
```
Once the container is running, you can connect to the local node via HTTP or WebSocket (the script will display connection details). You are then free to interact with the deployed contracts using the TypeScript library or any other tool of your choice.

---

## Unit Testing

All unit tests reside in **`./lib/test`**. These tests rigorously validate both the **TypeScript library** and the underlying **smart contracts**. We highly recommend running them to confirm everything is functioning as expected in your local environment.

### `./run_tests.sh`

This script executes the entire test suite in a Docker container. It automatically spins up a Hardhat instance, deploys the contracts, and runs the tests.

**Usage**:
```bash
./run_tests.sh
```
If the tests pass, you will see a summary of all checks and assertions. If any test fails, the output will provide details to help you diagnose the issue.
