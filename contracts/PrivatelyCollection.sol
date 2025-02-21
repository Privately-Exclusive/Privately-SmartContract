// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;



import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";



/**
 * @title PrivatelyCollection
 * @dev ERC721 token with minting and transferring capabilities controlled by EIP-712 signed meta-transactions.
 */
contract PrivatelyCollection is ERC721URIStorage, EIP712 {

    using ECDSA for bytes32;



    /**
     * @dev Struct to store internal data associated with an NFT.
     * @param title The title of the NFT.
     * @param author The author of the NFT.
     */
    struct InsideData {
        string title;
        address author;
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
        address author;
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



    /**
     * @dev Struct for EIP-712 signed approve requests.
     * @param owner The address of the current owner of the NFT.
     * @param spender The address being approved to manage the NFT.
     * @param tokenId The unique identifier of the NFT.
     * @param nonce A unique value to prevent replay attacks.
     */
    struct ApproveRequest {
        address owner;
        address spender;
        uint256 tokenId;
        uint256 nonce;
    }



    bytes32 private constant MINT_REQUEST_TYPEHASH = keccak256(
        "MintRequest(address user,string title,address author,string tokenURI,uint256 nonce)"
    );
    bytes32 private constant TRANSFER_REQUEST_TYPEHASH = keccak256(
        "TransferRequest(address from,address to,uint256 tokenId,uint256 nonce)"
    );
    bytes32 private constant APPROVE_REQUEST_TYPEHASH = keccak256(
        "ApproveRequest(address owner,address spender,uint256 tokenId,uint256 nonce)"
    );



    // Mapping to store internal data associated with each NFT
    mapping(uint256 => InsideData) private insideData;

    // Mapping for token nonces to prevent replay attacks
    mapping(address => uint256) public mintNonces;
    mapping(address => uint256) public transferNonces;
    mapping(address => uint256) public approveNonces;

    // Array to store all token IDs
    uint256[] private _allTokens;

    // Counter to keep track of the total number of tokens minted
    uint256 private _tokenCounter;



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
     * @param tokenURI The URI pointing to the NFT's metadata.
     * @param signature The EIP-712 signature from the user authorizing the mint.
     */
    function metaMint(
        address user,
        string calldata title,
        string calldata tokenURI,
        bytes calldata signature
    ) external returns (uint256) {
        MintRequest memory request = MintRequest(
            user,
            title,
            user,
            tokenURI,
            mintNonces[user]
        );

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                MINT_REQUEST_TYPEHASH,
                request.user,
                keccak256(bytes(request.title)),
                request.author,
                keccak256(bytes(request.tokenURI)),
                request.nonce
            ))
        );

        address signer = digest.recover(signature);
        require(signer == user, "Invalid signature");

        mintNonces[user]++;

        uint256 tokenId = uint256(keccak256(abi.encodePacked(user, block.timestamp, title, _tokenCounter)));
        _tokenCounter++;
        _mintAndStore(user, tokenId, title, user, tokenURI);

        return tokenId;
    }



    /**
     * @dev Transfers an NFT using a gasless transaction (meta-transaction).
     * @param from The address of the current owner of the NFT.
     * @param to The address of the new owner of the NFT.
     * @param tokenId The unique identifier of the NFT to be transferred.
     * @param signature The EIP-712 signature from the current owner authorizing the transfer.
     */
    function metaTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata signature
    ) external {
        TransferRequest memory request = TransferRequest(from, to, tokenId, transferNonces[from]);

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                TRANSFER_REQUEST_TYPEHASH,
                request.from,
                request.to,
                request.tokenId,
                request.nonce
            ))
        );

        address signer = digest.recover(signature);
        require(signer == from, "Invalid signature");
        require(ownerOf(tokenId) == from, "Not the owner");

        transferNonces[from]++;

        _transfer(from, to, tokenId);
    }



    /**
     * @dev Executes a gasless NFT approval via EIP-712 signature.
     * @param owner The current owner of the NFT.
     * @param spender The address to be approved to manage the NFT.
     * @param tokenId The unique identifier of the NFT.
     * @param signature The EIP-712 signature from the owner authorizing the approval.
     */
    function metaApprove(
        address owner,
        address spender,
        uint256 tokenId,
        bytes calldata signature
    ) external {
        uint256 currentNonce = approveNonces[owner];
        ApproveRequest memory request = ApproveRequest(
            owner,
            spender,
            tokenId,
            currentNonce
        );

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                APPROVE_REQUEST_TYPEHASH,
                request.owner,
                request.spender,
                request.tokenId,
                request.nonce
            ))
        );

        address signer = digest.recover(signature);
        require(signer == owner, "Invalid signature");
        require(ownerOf(tokenId) == owner, "Not the owner");

        approveNonces[owner]++;
        _approve(spender, tokenId, owner);
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
        address author,
        string memory tokenURI
    ) internal {
        insideData[tokenId] = InsideData(title, author);

        _allTokens.push(tokenId);

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
     * @dev Retrieves the complete metadata of an NFT including title, author, and tokenURI.
     * @param tokenId The unique identifier of the NFT.
     * @return title The title associated with the NFT.
     * @return author The author associated with the NFT.
     * @return uri The URI pointing to the NFT's metadata.
     */
    function getData(uint256 tokenId) external view returns (string memory title, address author, string memory uri) {
        require(_exists(tokenId), "Token does not exist");
        InsideData memory data = insideData[tokenId];
        title = data.title;
        author = data.author;
        uri = tokenURI(tokenId);
    }



    /**
     * @dev Retrieves the current nonces for mint, transfer, and approve requests.
     * @param user The address of the user.
     * @return mintNonce The current mint nonce.
     * @return transferNonce The current transfer nonce.
     * @return approveNonce The current approve nonce.
     */
    function getNonces(address user) external view returns (uint256 mintNonce, uint256 transferNonce, uint256 approveNonce) {
        mintNonce = mintNonces[user];
        transferNonce = transferNonces[user];
        approveNonce = approveNonces[user];
    }



    /**
     * @dev Retrieves all token IDs in the contract.
     * @return uint256[] A list of all token IDs.
     */
    function getAllCollection() external view returns (uint256[] memory) {
        return _allTokens;
    }



    /**
     * @dev Retrieves the list of token IDs owned by a specific user.
     * @param owner The address of the user whose Collection should be retrieved.
     * @return uint256[] An array containing the token IDs owned by the user.
     */
    function getCollectionOfUser(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < _allTokens.length; i++) {
            uint256 tokenId = _allTokens[i];
            if (ownerOf(tokenId) == owner) {
                tokens[index] = tokenId;
                index++;
            }
        }
        return tokens;
    }
}