# PrivatelyNFT Smart Contract Documentation

## Overview
The **PrivatelyNFT** smart contract is an ERC-721-based NFT contract that supports gasless meta-transactions. This means users can mint and transfer NFTs without having to directly pay gas fees, enhancing usability and accessibility for a wider audience. This is achieved using off-chain signing with the **EIP-712** standard, where transactions are authorized by users off-chain and then executed on-chain by a relayer.

## Off-Chain Signing and Meta-Transactions
Meta-transactions allow users to perform blockchain operations without needing to hold native tokens for gas fees. Instead of signing and broadcasting transactions themselves, users generate a cryptographic signature off-chain, which can be relayed by another entity that submits the transaction on-chain while covering the associated costs. This is particularly useful for onboarding users who may not have initial funding to pay gas fees and enhances the user experience by abstracting complex blockchain interactions.

The **EIP-712** standard is used to structure these off-chain messages, ensuring that the signed data is human-readable, structured, and resistant to replay attacks. The process works as follows:

1. The user generates a structured message (e.g., a request to mint an NFT) with all necessary parameters.
2. This message is hashed and signed by the user’s private key, producing a **cryptographic signature**.
3. The relayer submits the signed message to the blockchain, where the smart contract verifies the validity of the signature.
4. If the signature is valid, the contract executes the requested action (minting or transferring an NFT).
5. A **nonce** is used to prevent replay attacks, ensuring that each signed message can only be used once.

This system significantly reduces barriers to entry and enhances the efficiency of blockchain interactions, particularly for non-technical users.

## Features
### Gasless Minting
This contract allows users to mint NFTs without needing to pay gas fees themselves. A relayer covers the gas costs, making it easier for new users to create NFTs without requiring cryptocurrency in their wallets.

### Gasless Transfers
NFT owners can transfer their assets to others by signing an off-chain request, eliminating the need for them to manage gas fees. This feature enhances usability and makes NFT ownership more accessible.

### EIP-712 Signature Verification
To ensure security and authenticity, all off-chain requests must be signed using the **EIP-712** standard. This guarantees that transactions cannot be modified or forged, providing strong cryptographic security for gasless operations.

### Metadata Storage
Each NFT contains **internal metadata**, including a title and author, stored directly within the contract. This allows for richer NFT descriptions and on-chain verification of associated metadata.

### Replay Attack Prevention
By incorporating **nonces** for each user, the contract ensures that a signed transaction can only be used once. This prevents replay attacks where an attacker could reuse a previously signed transaction to perform unauthorized actions.

## Contract Details

### Constructor
```solidity
constructor(string memory name, string memory symbol)
```
This function initializes the contract by setting the NFT collection’s **name** and **symbol**, while also defining the **EIP-712 domain separator** needed for off-chain signing.

### Minting (Gasless)
```solidity
function mintGaslessNFT(
    address user,
    string calldata title,
    string calldata author,
    string calldata tokenURI,
    bytes calldata signature
) external
```
This function allows a user to request an NFT mint via an **off-chain signed message**. The contract verifies the signature and mints the NFT if it is valid. The **nonce** is incremented to ensure that the same signed request cannot be reused.

### Transferring (Gasless)
```solidity
function transferGasless(
    address from,
    address to,
    uint256 tokenId,
    bytes calldata signature
) external
```
This function enables users to transfer NFTs via **meta-transactions**. The owner signs a transfer request off-chain, and a relayer submits it on-chain. The contract checks the validity of the signature and ensures the sender owns the NFT before executing the transfer.

### Internal Minting Function
```solidity
function _mintAndStore(
    address to,
    uint256 tokenId,
    string memory title,
    string memory author,
    string memory tokenURI
) internal
```
This internal function handles NFT creation, storing metadata such as **title** and **author**. It assigns a **token URI** and records the NFT in an internal list of all minted tokens.

### Metadata Retrieval
```solidity
function getInsideData(uint256 tokenId)
    external view returns (string memory title, string memory author)
```
This function allows users to retrieve metadata stored within the contract, such as the NFT’s **title** and **author**.

### Nonce Management
```solidity
function getNonce(address user) external view returns (uint256)
```
Every user has a unique **nonce** that increments with each signed transaction. This prevents **replay attacks**, ensuring a signature can only be used once.

### Retrieve All NFTs
```solidity
function getAllNFTs() external view returns (uint256[] memory)
```
This function returns an array of all minted NFTs in the contract, allowing users or dApps to fetch existing assets.

## Security Considerations
### Signature Verification
Each meta-transaction relies on **EIP-712** signatures to ensure authenticity. When a user signs a transaction off-chain, their signature is cryptographically bound to the provided parameters. The contract then verifies that the recovered signer matches the expected user before executing the transaction. This prevents unauthorized entities from forging transactions on behalf of users, ensuring that only valid, user-approved actions are processed.

### Replay Protection
Replay attacks occur when an attacker resubmits a previously signed transaction to execute it multiple times. To prevent this, the contract tracks **nonces** for each user. Each signed request includes a **nonce**, which increments upon successful execution. If a transaction is submitted with an outdated nonce, it is rejected. This ensures that even if an attacker intercepts a signed message, they cannot reuse it to perform unintended actions.

### Ownership Verification
For gasless transfers, the contract verifies that the **sender** of the NFT actually owns the token before processing the transaction. This is done by checking the `ownerOf(tokenId)` function before allowing a transfer to proceed. This prevents unauthorized users from transferring assets they do not own, adding an extra layer of security to meta-transactions.

### Relayer Trust Model
Since transactions are submitted on-chain by relayers, it is crucial to have a trust model in place. The contract ensures that relayers **cannot alter the signed messages** by verifying all parameters against the user’s signed data. Additionally, users can selectively approve trusted relayers to submit transactions on their behalf, mitigating risks associated with malicious relayers.

## Deployment
The **PrivatelyNFT** contract is designed for deployment on the **Base blockchain**, leveraging its efficiency and scalability to support NFT transactions with minimal costs and improved user experience.

## Conclusion
The **PrivatelyNFT** smart contract introduces a **gasless** approach to NFT minting and transfers using **meta-transactions**. By leveraging **off-chain signing** and **relayers**, it removes the complexity of transaction fees while ensuring security through **EIP-712** signatures and **nonce tracking**. This architecture significantly improves accessibility, making blockchain-based digital ownership seamless and user-friendly.

