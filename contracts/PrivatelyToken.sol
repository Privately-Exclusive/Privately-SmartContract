// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract PrivatelyNFT is ERC721URIStorage, EIP712 {
    using ECDSA for bytes32;


    /**
     * @dev Struct to store internal data associated with an NFT.
     * @param title The title of the NFT.
     * @param author The author of the NFT.
     */
    struct InsideData {
        string title;
        string author;
    }



    /**
     * @dev Struct for EIP-712 signed mint requests.
     * @param user The address of the user requesting the mint.
     * @param title The title of the NFT to be minted.
     * @param author The author of the NFT to be minted.
     * @param tokenURI The URI pointing to the NFT's metadata.
     * @param nonce A unique value to prevent replay attacks.
     */
    struct MintRequest {
        address user;
        string title;
        string author;
        string tokenURI;
        uint256 nonce;
    }



    /**
     * @dev Struct for EIP-712 signed transfer requests.
     * @param from The address of the current owner of the NFT.
     * @param to The address of the new owner of the NFT.
     * @param tokenId The unique identifier of the NFT to be transferred.
     * @param nonce A unique value to prevent replay attacks.
     */
    struct TransferRequest {
        address from;
        address to;
        uint256 tokenId;
        uint256 nonce;
    }



    // Typehash for EIP-712 mint requests
    bytes32 private constant MINT_REQUEST_TYPEHASH = 
        keccak256("MintRequest(address user,string title,string author,string tokenURI,uint256 nonce)");
    
    // Typehash for EIP-712 transfer requests
    bytes32 private constant TRANSFER_REQUEST_TYPEHASH = 
        keccak256("TransferRequest(address from,address to,uint256 tokenId,uint256 nonce)");



    // Mapping to store internal data for each token ID
    mapping(uint256 => InsideData) private insideData;

    // Array to store all token IDs
    uint256[] private allTokens;

    // Mapping to store nonces for each user to prevent replay attacks
    mapping(address => uint256) public nonces;



    /**
     * @dev Constructor to initialize the NFT contract.
     * @param name The name of the NFT collection.
     * @param symbol The symbol of the NFT collection.
     */
    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol)
        EIP712(name, "1.0.0")
    {}



    /**
     * @dev Mints an NFT using a gasless transaction (meta-transaction).
     * @param user The address of the user receiving the NFT.
     * @param title The title of the NFT.
     * @param author The author of the NFT.
     * @param tokenURI The URI pointing to the NFT's metadata.
     * @param signature The EIP-712 signature from the user authorizing the mint.
     */
    function mintGaslessNFT(
        address user,
        string calldata title,
        string calldata author,
        string calldata tokenURI,
        bytes calldata signature
    ) external {
        // Create a MintRequest struct
        MintRequest memory request = MintRequest(user, title, author, tokenURI, nonces[user]);
        
        // Hash the request data using EIP-712
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                MINT_REQUEST_TYPEHASH,
                request.user,
                keccak256(bytes(request.title)),
                keccak256(bytes(request.author)),
                keccak256(bytes(request.tokenURI)),
                request.nonce
            ))
        );
        
        // Recover the signer's address from the signature
        address signer = digest.recover(signature);
        require(signer == user, "Invalid signature");

        // Increment the user's nonce to prevent replay attacks
        nonces[user]++;

        // Generate a unique token ID and mint the NFT
        uint256 tokenId = uint256(keccak256(abi.encodePacked(user, block.timestamp, title)));
        _mintAndStore(user, tokenId, title, author, tokenURI);
    }



    /**
     * @dev Transfers an NFT using a gasless transaction (meta-transaction).
     * @param from The address of the current owner of the NFT.
     * @param to The address of the new owner of the NFT.
     * @param tokenId The unique identifier of the NFT to be transferred.
     * @param signature The EIP-712 signature from the current owner authorizing the transfer.
     */
    function transferGasless(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata signature
    ) external {
        // Create a TransferRequest struct
        TransferRequest memory request = TransferRequest(from, to, tokenId, nonces[from]);
        
        // Hash the request data using EIP-712
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                TRANSFER_REQUEST_TYPEHASH,
                request.from,
                request.to,
                request.tokenId,
                request.nonce
            ))
        );
        
        // Recover the signer's address from the signature
        address signer = digest.recover(signature);
        require(signer == from, "Invalid signature");
        require(ownerOf(tokenId) == from, "Not the owner");

        // Increment the user's nonce to prevent replay attacks
        nonces[from]++;

        // Transfer the NFT
        _transfer(from, to, tokenId);
    }



    /**
     * @dev Internal function to mint an NFT and store its associated data.
     * @param to The address of the user receiving the NFT.
     * @param tokenId The unique identifier of the NFT.
     * @param title The title of the NFT.
     * @param author The author of the NFT.
     * @param tokenURI The URI pointing to the NFT's metadata.
     */
    function _mintAndStore(
        address to,
        uint256 tokenId,
        string memory title,
        string memory author,
        string memory tokenURI
    ) internal {
        // Store the internal data for the NFT
        insideData[tokenId] = InsideData(title, author);

        // Add the token ID to the list of all tokens
        allTokens.push(tokenId);

        // Mint the NFT and set its metadata URI
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }



    /**
     * @dev Checks whether a token with a specific ID exists.
     * @param tokenId The unique identifier of the token.
     * @return bool Returns true if the token exists, false otherwise.
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }



    /**
     * @dev Retrieves the internal data of an NFT.
     * @param tokenId The unique identifier of the NFT.
     * @return title The title associated with the NFT.
     * @return author The author associated with the NFT.
     */
    function getInsideData(uint256 tokenId) external view returns (string memory title, string memory author) {
        require(_exists(tokenId), "Token does not exist");
        InsideData memory data = insideData[tokenId];
        title = data.title;
        author = data.author;
    }



    /**
    * @dev Retrieves the current nonce for a given user address.
    * @param user The address of the user.
    * @return uint256 The current nonce of the user.
    */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }



    /**
     * @dev Retrieves all token IDs in the contract.
     * @return uint256[] A list of all token IDs.
     */
    function getAllNFTs() external view returns (uint256[] memory) {
        return allTokens;
    }
}