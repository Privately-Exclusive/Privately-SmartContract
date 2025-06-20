// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;



import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";



/**
 * @title PrivatelyAuctionSystem
 * @dev English auction contract using meta-transactions.
 */
contract PrivatelyAuctionSystem is EIP712, ReentrancyGuard {

    using SafeERC20 for IERC20;
    using ECDSA for bytes32;



    // -- Events --

    /**
     * @dev Emitted when a new auction is created.
     * @param auctionId Unique auction identifier.
     * @param seller Address of the seller.
     * @param tokenId ID of the NFT.
     * @param startPrice Starting price of the auction.
     * @param endTime Timestamp when the auction ends.
     */
    event OnCreate(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 startPrice,
        uint256 endTime
    );



    /**
     * @dev Emitted when a new highest bid is placed.
     * @param auctionId Unique auction identifier.
     * @param bidder Address of the bidder.
     * @param bidAmount Bid amount.
     */
    event OnBid(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 bidAmount
    );



    /**
     * @dev Emitted when an auction is finalized.
     * @param auctionId Unique auction identifier.
     * @param tokenId ID of the NFT.
     * @param highestBidder Address of the highest bidder.
     * @param highestBid Final bid amount.
     */
    event OnEnd(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed highestBidder,
        uint256 highestBid
    );



    /**
     * @dev Emitted when a bidder withdraws a pending refund.
     * @param user   Address receiving the refund.
     * @param amount Amount of ERC20 tokens withdrawn.
     */
    event OnWithdraw(
        address indexed user,
        uint256 amount
    );



    /**
     * @dev Struct to store auction details.
     * @param seller Address of the NFT seller.
     * @param tokenId ID of the NFT being auctioned.
     * @param startPrice Starting price of the auction.
     * @param highestBid Current highest bid.
     * @param highestBidder Address of the current highest bidder.
     * @param endTime Timestamp at which the auction ends.
     * @param settled Indicates if the auction has been finalized.
     */
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool settled;
    }



    /**
     * @dev Struct for creating an auction off-chain (meta-transaction).
     * @param seller Address of the NFT owner creating the auction.
     * @param tokenId ID of the NFT being auctioned.
     * @param startPrice Starting price of the auction.
     * @param endTime Timestamp at which the auction ends.
     * @param nonce Unique value to prevent replay attacks.
     */
    struct CreateAuctionRequest {
        address seller;
        uint256 tokenId;
        uint256 startPrice;
        uint256 endTime;
        uint256 nonce;
    }



    /**
     * @dev Struct for bidding on an auction off-chain (meta-transaction).
     * @param bidder Address placing the bid.
     * @param auctionId Unique identifier of the auction.
     * @param bidAmount Bid amount in token units.
     * @param nonce Unique value to prevent replay attacks.
     */
    struct BidRequest {
        address bidder;
        uint256 auctionId;
        uint256 bidAmount;
        uint256 nonce;
    }



    bytes32 private constant CREATE_AUCTION_TYPEHASH = keccak256(
        "CreateAuctionRequest(address seller,uint256 tokenId,uint256 startPrice,uint256 endTime,uint256 nonce)"
    );
    bytes32 private constant BID_TYPEHASH = keccak256(
        "BidRequest(address bidder,uint256 auctionId,uint256 bidAmount,uint256 nonce)"
    );



    // Mapping from unique auction ID to Auction details.
    mapping(uint256 => Auction) public auctions;

    // Mapping for user nonces to prevent replay attacks.
    mapping(address => uint256) public createAuctionNonces;
    mapping(address => uint256) public bidNonces;

    // Mapping for pending coin refunds for outbid bidders.
    mapping(address => uint256) public pendingWithdrawals;

    // Mapping from NFT tokenId to the active auction ID (0 if none).
    mapping(uint256 => uint256) public activeAuctionByToken;

    // Mapping from tokenId to all auction IDs (active or settled).
    mapping(uint256 => uint256[]) private auctionsByToken;

    // Array of all auction IDs created.
    uint256[] private allAuctions;

    // Internal counter used in auction ID generation.
    uint256 private _auctionCounter;



    IERC721 public immutable collectionContract;
    IERC20 public immutable coinContract;



    /**
     * @dev Constructor initializes the auction contract.
     * @param coinContractAddress Address of the custom ERC20 token.
     * @param collectionContractAddress Address of the NFT contract.
     * @param name Name of the EIP-712 domain.
     * @param version Version of the EIP-712 domain.
     */
    constructor(
        address coinContractAddress,
        address collectionContractAddress,
        string memory name,
        string memory version
    )
    EIP712(name, version)
    {
        require(coinContractAddress != address(0), "Invalid coin contract address");
        require(collectionContractAddress != address(0), "Invalid collection contract address");

        coinContract = IERC20(coinContractAddress);
        collectionContract = IERC721(collectionContractAddress);
    }



    /**
     * @dev Creates an auction gaslessly via meta-transaction.
     *      The seller must sign an EIP-712 typed message off-chain.
     * @param seller Address of the NFT owner.
     * @param tokenId ID of the NFT being auctioned.
     * @param startPrice Starting price of the auction.
     * @param endTime Timestamp when the auction ends.
     * @param signature EIP-712 signature from the seller.
     */
    function metaCreateAuction(
        address seller,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime,
        bytes calldata signature
    ) external nonReentrant {
        require(activeAuctionByToken[tokenId] == 0, "Token already in active auction");
        require(endTime > block.timestamp, "End time in past");
        require(endTime <= block.timestamp + 7 days, "End time must be within 7 days");
        require(
            collectionContract.getApproved(tokenId) == address(this) ||
            collectionContract.isApprovedForAll(seller, address(this)),
            "Not approved"
        );

        CreateAuctionRequest memory request = CreateAuctionRequest({
            seller: seller,
            tokenId: tokenId,
            startPrice: startPrice,
            endTime: endTime,
            nonce: createAuctionNonces[seller]
        });

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    CREATE_AUCTION_TYPEHASH,
                    request.seller,
                    request.tokenId,
                    request.startPrice,
                    request.endTime,
                    request.nonce
                )
            )
        );

        address signer = digest.recover(signature);
        require(signer == seller, "Invalid signature");

        createAuctionNonces[seller]++;

        require(collectionContract.ownerOf(tokenId) == seller, "Not the owner");
        collectionContract.transferFrom(seller, address(this), tokenId);

        uint256 auctionId = uint256(keccak256(abi.encodePacked(seller, tokenId, block.timestamp, _auctionCounter)));
        _auctionCounter++;

        Auction memory newAuction = Auction({
            seller: seller,
            tokenId: tokenId,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            settled: false
        });

        auctions[auctionId] = newAuction;
        activeAuctionByToken[tokenId] = auctionId;
        auctionsByToken[tokenId].push(auctionId);
        allAuctions.push(auctionId);

        emit OnCreate(auctionId, seller, tokenId, startPrice, endTime);
    }



    /**
     * @dev Places a bid gaslessly via meta-transaction using the custom ERC20 token.
     *      The bidder must sign an EIP-712 typed message off-chain.
     * @param bidder Address placing the bid.
     * @param auctionId Unique auction identifier.
     * @param bidAmount Bid amount in token units.
     * @param signature EIP-712 signature from the bidder.
     */
    function metaBidAuction(
        address bidder,
        uint256 auctionId,
        uint256 bidAmount,
        bytes calldata signature
    ) external nonReentrant {
        BidRequest memory request = BidRequest({
            bidder: bidder,
            auctionId: auctionId,
            bidAmount: bidAmount,
            nonce: bidNonces[bidder]
        });

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    BID_TYPEHASH,
                    request.bidder,
                    request.auctionId,
                    request.bidAmount,
                    request.nonce
                )
            )
        );

        address signer = digest.recover(signature);
        require(signer == bidder, "Invalid signature");

        bidNonces[bidder]++;

        Auction storage auction = auctions[auctionId];
        require(!auction.settled, "Auction already settled");
        require(block.timestamp <= auction.endTime, "Auction ended");
        require(bidAmount > auction.highestBid, "Bid not high enough");
        require(bidAmount >= auction.startPrice, "Bid below start price");
        require(coinContract.allowance(bidder, address(this)) >= bidAmount, "Insufficient token allowance");

        coinContract.safeTransferFrom(bidder, address(this), bidAmount);

        uint256 previousBid = auction.highestBid;
        address previousBidder = auction.highestBidder;

        auction.highestBid = bidAmount;
        auction.highestBidder = bidder;

        if (previousBidder != address(0)) {
            pendingWithdrawals[previousBidder] += previousBid;
        }

        emit OnBid(auctionId, bidder, bidAmount);
    }



    /**
     * @dev Finalizes an ended auction.
     *      Transfers the NFT to the highest bidder and the bid amount in tokens to the seller.
     * @param auctionId Unique auction identifier.
     */
    function finalizeAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(!auction.settled, "Auction already settled");
        require(block.timestamp > auction.endTime, "Auction not ended yet");

        auction.settled = true;
        activeAuctionByToken[auction.tokenId] = 0;

        if (auction.highestBidder == address(0)) {
            collectionContract.transferFrom(address(this), auction.seller, auction.tokenId);
            emit OnEnd(auctionId, auction.tokenId, address(0), 0);
            return;
        }

        collectionContract.transferFrom(address(this), auction.highestBidder, auction.tokenId);
        coinContract.safeTransfer(auction.seller, auction.highestBid);

        emit OnEnd(auctionId, auction.tokenId, auction.highestBidder, auction.highestBid);
    }



    /**
     * @dev Allows users to withdraw their pending refunds from unsuccessful bids.
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        coinContract.safeTransfer(msg.sender, amount);
        emit OnWithdraw(msg.sender, amount);
    }



    /**
     * @dev Retrieves the current nonces for create auction and bid requests.
     * @param user Address of the user.
     * @return createAuctionNonce Nonce for creating auctions.
     * @return bidNonce Nonce for placing bids.
     */
    function getNonces(address user) external view returns (uint256 createAuctionNonce, uint256 bidNonce) {
        createAuctionNonce = createAuctionNonces[user];
        bidNonce = bidNonces[user];
    }



    /**
     * @dev Retrieves all auction IDs created in the contract.
     * @return An array of all auction IDs.
     */
    function getAllAuctions() external view returns (uint256[] memory) {
        return allAuctions;
    }



    /**
     * @dev Retrieves all active auctions (not settled and still running).
     * @return An array of active auction IDs.
     */
    function getAllActiveAuctions() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 total = allAuctions.length;
        for (uint256 i = 0; i < total; i++) {
            Auction storage auction = auctions[allAuctions[i]];
            if (!auction.settled && block.timestamp < auction.endTime) {
                count++;
            }
        }

        uint256[] memory activeAuctionIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            Auction storage auction = auctions[allAuctions[i]];
            if (!auction.settled && block.timestamp < auction.endTime) {
                activeAuctionIds[index] = allAuctions[i];
                index++;
            }
        }
        return activeAuctionIds;
    }



    /**
     * @dev Retrieves all auctions created by a specific seller.
     * @param seller Address of the seller.
     * @return An array of auction IDs created by the seller.
     */
    function getSellerAuctions(address seller) external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 total = allAuctions.length;
        for (uint256 i = 0; i < total; i++) {
            if (auctions[allAuctions[i]].seller == seller) {
                count++;
            }
        }

        uint256[] memory sellerAuctionIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            if (auctions[allAuctions[i]].seller == seller) {
                sellerAuctionIds[index] = allAuctions[i];
                index++;
            }
        }
        return sellerAuctionIds;
    }



    /**
     * @notice Returns all Auction structs (past and present) for a given tokenId.
     * @param tokenId The NFT identifier.
     * @return results Array of Auction structs whose .tokenId == tokenId.
     */
    function getAuctionsByToken(uint256 tokenId) external view returns (Auction[] memory results) {
        uint256[] storage ids = auctionsByToken[tokenId];
        uint256 len = ids.length;
        results = new Auction[](len);
        for (uint256 i = 0; i < len; i++) {
            results[i] = auctions[ids[i]];
        }
    }



    /**
     * @dev Retrieves an auction by its unique identifier.
     * @param auctionId Unique auction identifier.
     * @return The Auction struct.
     */
    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }
}
