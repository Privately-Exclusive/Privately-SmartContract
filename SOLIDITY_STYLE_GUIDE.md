# Guide de Style Solidity - Privately Smart Contracts

Ce document définit les conventions de style et de codage utilisées dans l'écosystème de smart contracts Privately.

## 1. Structure du Fichier

### En-tête Obligatoire
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


```

### Ordre des Éléments
1. **Licence et Pragma** (avec 2 lignes vides après)
2. **Imports** (groupés par type, avec 2 lignes vides après)
3. **Documentation du contrat** (commentaire NatSpec)
4. **Déclaration du contrat**
5. **Using statements**
6. **Events**
7. **Structs/Types personnalisés** 
8. **Constants privées**
9. **Variables d'état**
10. **Constructor**
11. **Fonctions publiques/externes**
12. **Fonctions internes/privées**
13. **Overrides**

## 2. Espacement et Formatage

### Lignes Vides
- **2-3 lignes vides** entre les sections principales
- **1 ligne vide** après chaque import
- **1 ligne vide** après chaque function/struct/event
- **2 lignes vides** avant chaque commentaire de section

### Indentation
- **4 espaces** (pas de tabs)
- Indentation cohérente pour tous les blocs de code

### Accolades
```solidity
// ✅ Correct - accolade ouvrante sur la même ligne
function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    _mint(to, amount);
}

// ✅ Correct - pour les structs
struct ApproveRequest {
    address owner;
    address spender;
    uint256 amount;
    uint256 nonce;
}
```

### Commentaires de Section
```solidity
// -- Events --

// -- Requests --

// -- Functions --

// -- Overrides --
```

## 3. Conventions de Nommage

### Contrats
- **PascalCase** : `PrivatelyCoin`, `PrivatelyCollection`, `PrivatelyAuctionSystem`

### Functions
- **camelCase** : `metaTransfer`, `finalizeAuction`, `getNonces`
- Préfixe `meta` pour les fonctions meta-transaction

### Variables d'État
- **camelCase** : `transferNonces`, `approveNonces`, `activeAuctionByToken`
- Arrays privés avec underscore : `_allTokens`, `_tokenCounter`

### Constants
- **SCREAMING_SNAKE_CASE** : `MINTER_ROLE`, `TRANSFER_REQUEST_TYPEHASH`

### Events
- **PascalCase avec préfixe "On"** : `OnMint`, `OnTransfer`, `OnCreate`, `OnBid`, `OnEnd`

### Structs
- **PascalCase** : `ApproveRequest`, `TransferRequest`, `MintRequest`
- Suffixe `Request` pour les structs EIP-712

### Paramètres et Variables Locales
- **camelCase** : `tokenId`, `bidAmount`, `auctionId`

## 4. Documentation

### Commentaires NatSpec Obligatoires
```solidity
/**
 * @title PrivatelyCoin
 * @dev ERC20 token with minting capabilities, AccessControl, and EIP-712 meta-transactions support.
 */
contract PrivatelyCoin is ERC20, AccessControl, EIP712 {

    /**
     * @dev Executes a gasless token transfer via EIP-712 signature
     * @param from Token sender address
     * @param to Token recipient address
     * @param amount Transfer amount
     * @param signature EIP-712 signature from 'from' address
     */
    function metaTransfer(
        address from,
        address to,
        uint256 amount,
        bytes calldata signature
    ) external {
        // Implementation
    }
}
```

### Documentation des Structs
```solidity
/**
 * @dev Struct for EIP-712 signed transfer requests
 * @param from Address initiating the transfer
 * @param to Recipient address
 * @param amount Amount of tokens to transfer
 * @param nonce Unique transaction identifier for replay protection
 */
struct TransferRequest {
    address from;
    address to;
    uint256 amount;
    uint256 nonce;
}
```

### Commentaires Inline
```solidity
// Mapping of nonces to prevent replay attacks
mapping(address => uint256) public transferNonces;

// Internal counter used in auction ID generation
uint256 private _auctionCounter;
```

## 5. Patterns et Conventions Spécifiques

### Using Statements
```solidity
using ECDSA for bytes32;
using SafeERC20 for IERC20;
```

### Meta-Transactions Pattern
```solidity
function metaFunctionName(
    address user,
    // autres paramètres,
    bytes calldata signature
) external {
    RequestStruct memory request = RequestStruct({
        user: user,
        // autres champs,
        nonce: functionNonces[user]
    });

    bytes32 digest = _hashTypedDataV4(
        keccak256(abi.encode(
            REQUEST_TYPEHASH,
            request.user,
            // autres champs encodés,
            request.nonce
        ))
    );

    address signer = digest.recover(signature);
    require(signer == user, "Invalid signature");
    
    functionNonces[user]++;
    
    // Logique de la fonction
}
```

### Gestion des Nonces
```solidity
// Mapping séparés pour chaque type d'opération
mapping(address => uint256) public transferNonces;
mapping(address => uint256) public approveNonces;
mapping(address => uint256) public mintNonces;

// Fonction helper pour récupérer tous les nonces
function getNonces(address user) external view returns (
    uint256 transferNonce, 
    uint256 approveNonce
) {
    transferNonce = transferNonces[user];
    approveNonce = approveNonces[user];
}
```

### Events avec Informations Complètes
```solidity
event OnTransfer(
    address indexed from,
    address indexed to,
    uint256 amount,
    uint256 fromFinalBalance,
    uint256 toFinalBalance
);
```

### Override Pattern pour Centraliser la Logique
```solidity
/**
 * @dev Internal update hook that centralizes all balance modifications
 *      (minting, transferring, burning) into a single function call.
 */
function _update(
    address from,
    address to,
    uint256 amount
) internal virtual override {
    super._update(from, to, amount);

    if (from == address(0)) {
        // Mint
        emit OnMint(to, amount, balanceOf(to));
    } else if (to == address(0)) {
        // Burn -> intentionally no custom event
    } else {
        // Transfer
        emit OnTransfer(from, to, amount, balanceOf(from), balanceOf(to));
    }
}
```

## 6. Sécurité et Bonnes Pratiques

### Modifiers Obligatoires
- `nonReentrant` pour les fonctions modifiant l'état
- `onlyRole` pour les fonctions privilégiées

### Validation des Paramètres
```solidity
require(endTime > block.timestamp, "End time in past");
require(collectionContract.ownerOf(tokenId) == seller, "Not the owner");
require(signer == user, "Invalid signature");
```

### Gestion des Erreurs
- Messages d'erreur courts et explicites
- Validation précoce des paramètres

## 7. Exemples de Code Conforme

### Contrat Type
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;



import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";



/**
 * @title ExampleContract
 * @dev Description du contrat
 */
contract ExampleContract is ERC20 {

    using ECDSA for bytes32;



    // -- Events --

    event OnAction(address indexed user, uint256 amount);



    // -- Structs --

    struct ActionRequest {
        address user;
        uint256 amount;
        uint256 nonce;
    }



    bytes32 private constant ACTION_TYPEHASH = keccak256(
        "ActionRequest(address user,uint256 amount,uint256 nonce)"
    );



    mapping(address => uint256) public actionNonces;



    constructor() ERC20("Example", "EXM") {}



    // -- Functions --

    function metaAction(
        address user,
        uint256 amount,
        bytes calldata signature
    ) external {
        // Implementation
    }
}
```

Ce guide doit être suivi strictement pour maintenir la cohérence du code dans l'écosystème Privately.