# PrivatelyNFT Library Documentation

## Overview
The **PrivatelyNFT Library** is a TypeScript library designed to facilitate interaction with the **PrivatelyNFT** smart contract. This library provides developers with a seamless way to:

- Generate and sign **meta-transactions** (EIP-712) for minting and transferring NFTs.
- Relay signed requests to the blockchain via a relayer, allowing **gasless transactions** for end-users.
- Query important NFT-related data such as metadata and user nonces.

By leveraging **Ethers v6**, this library ensures robust interaction with the blockchain while maintaining security through **EIP-712 structured signing**.

## Library Structure
The library is structured to provide a clean separation between core functionalities and testing. Below is a breakdown of the folder structure:

```
lib/
├── src/
│   ├── contract.ts       # Implementation of the PrivatelyNFTClient class.
│   ├── index.ts          # Exports all relevant modules.
├── test/
│   ├── contract.test.ts  # Unit tests for the library and smart contract.
├── dist/                 # Compiled JavaScript files for production use.
```

### Building the Library
Before using the library in a production setting, it needs to be compiled from TypeScript to JavaScript. This process generates a `dist/` directory containing all the compiled `.js` files.

To build the library, run:
```sh
npm run build
```

Once built, the `dist/` directory will contain all necessary JavaScript files. These files can be used in various environments such as **backend APIs** or **front-end applications**.

### Using the Built Library
If you want to use the compiled version in another project, you can install it locally as a package:

1. **Link the built library as a local package:**
   ```sh
   npm link
   ```
   This makes the package globally available on your system.

2. **Use it in another project:**
   Navigate to your target project and link the library:
   ```sh
   npm link privately-nft-lib
   ```
   Now, you can import the compiled library just like any other npm module:
   ```typescript
   import { PrivatelyNFTClient } from "privately-nft-lib";
   ```

### Implementing in Different Environments

#### Using in a React Native Application
To use the library in a **React Native** application, you need to ensure that `ethers.js` is properly installed:
```sh
npm install ethers
```
Then, in your React Native app:
```typescript
import { JsonRpcProvider, Wallet } from "ethers";
import { PrivatelyNFTClient } from "privately-nft-lib";

const provider = new JsonRpcProvider("https://your_rpc_url");
const wallet = new Wallet("your_private_key", provider);

const client = new PrivatelyNFTClient(wallet);
await client.init();
```
This allows mobile users to interact with the **PrivatelyNFT** contract directly from their device.

#### Using in a NestJS API
To integrate the library into a **NestJS API**, install it as a dependency:
```sh
npm install privately-nft-lib
```
Then, create a service in NestJS to interact with the **PrivatelyNFTClient**:
```typescript
import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Wallet } from "ethers";
import { PrivatelyNFTClient } from "privately-nft-lib";

@Injectable()
export class NftService {
  private client: PrivatelyNFTClient;

  constructor() {
    const provider = new JsonRpcProvider("https://your_rpc_url");
    const signer = new Wallet("your_private_key", provider);
    this.client = new PrivatelyNFTClient(signer);
  }

  async mintNFT(title: string, author: string, tokenURI: string) {
    return await this.client.createMintRequest(title, author, tokenURI);
  }
}
```
This allows your **NestJS API** to mint NFTs programmatically and serve as an intermediary for applications.

## Usage Examples

### Initializing the Client
```typescript
import { JsonRpcProvider, Wallet } from "ethers";
import { PrivatelyNFTClient } from "privately-nft-lib";

const provider = new JsonRpcProvider("http://127.0.0.1:8545/");
const signer = new Wallet("<PRIVATE_KEY>", provider);

const client = new PrivatelyNFTClient(signer);
await client.init();
```

### Fetching NFTs
#### Retrieve all minted NFTs
```typescript
const allNFTs = await client.getAllNFTs();
console.log("Minted NFTs:", allNFTs);
```

#### Retrieve NFT metadata
```typescript
const tokenId = 1;
const metadata = await client.getInsideData(tokenId);
console.log("Title:", metadata.title, "Author:", metadata.author);
```

### Managing Nonces
```typescript
const nonce = await client.getNonce(signer.address);
console.log("User nonce:", nonce);
```

### Creating and Signing Requests
#### Mint Request
```typescript
const mintRequest = await client.createMintRequest(
    "NFT Title",
    "Author Name",
    "ipfs://tokenURI"
);
console.log("Mint Request:", mintRequest);
```

#### Transfer Request
```typescript
const transferRequest = await client.createTransferRequest(
    "0xRecipientAddress",
    1 // Token ID
);
console.log("Transfer Request:", transferRequest);
```

### Relaying Signed Requests
#### Relay Mint Request
```typescript
await client.relayMintRequest(mintRequest.request, mintRequest.signature);
console.log("Mint transaction submitted.");
```

#### Relay Transfer Request
```typescript
await client.relayTransferRequest(transferRequest.request, transferRequest.signature);
console.log("Transfer transaction submitted.");
```

## Security Considerations
- **EIP-712 Signature Verification**: Ensures transaction integrity by preventing forgery.
- **Replay Attack Prevention**: Uses **nonces** to ensure each transaction is only executed once.
- **Ownership Verification**: The contract ensures only **valid owners** can sign and relay transactions.

## Conclusion
The **PrivatelyNFT Library** simplifies interactions with the **PrivatelyNFT** smart contract, allowing users to generate and relay **gasless** NFT transactions. By leveraging **EIP-712**, it provides a secure and efficient way to sign and validate requests off-chain before execution on-chain.

Whether you're building a **React Native** front-end, a **NestJS API**, or any blockchain-integrated service, this library ensures seamless NFT interactions with minimal friction.

