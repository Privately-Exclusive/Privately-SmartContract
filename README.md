## PrivatelyNFT

### Description

**PrivatelyNFT** is a smart contract developed in Solidity that enables the management and exchange of digital assets as Collection. This project includes a TypeScript environment to facilitate interaction with the contract, along with a suite of tests to ensure its proper functionality.

The smart contract and the associated TypeScript library support a meta-transaction system. Meta-transactions allow users to sign messages off-chain, while a relayer submits the transaction on-chain, covering the gas fees on their behalf. The project is designed to operate on the **Base** blockchain.

### Usage

To start the Hardhat environment with the smart contract deployed inside, run:

```sh
./run_prod_node.sh
```

### Tests

A test suite is available to verify the functionality of the smart contract and the TypeScript library. To run all unit tests for both the smart contract and the library, execute:

```sh
./run_tests.sh
```

The tests include validations for:

- NFT creation and minting
- NFT transfers
- Permission management and private access
