// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;



import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";



/**
 * @title PrivatelyCoin
 * @dev ERC20 token with minting capabilities, AccessControl, and EIP-712 meta-transactions support.
 */
contract PrivatelyCoin is ERC20, AccessControl, EIP712 {

    using ECDSA for bytes32;



    // -- Events --

    /**
    * @dev Emitted when new tokens are minted.
    * @param to Recipient address receiving minted tokens.
    * @param amount Amount of tokens minted.
    * @param finalBalance Final token balance of the recipient after minting.
    */
    event OnMint(
        address indexed to,
        uint256 amount,
        uint256 finalBalance
    );



    /**
    * @dev Emitted when tokens are transferred.
    * @param from Sender address.
    * @param to Recipient address.
    * @param amount Amount of tokens transferred.
    * @param fromFinalBalance Final balance of the sender after transfer.
    * @param toFinalBalance Final balance of the recipient after transfer.
    */
    event OnTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fromFinalBalance,
        uint256 toFinalBalance
    );



    // -- Requests --

    /**
     * @dev Struct for EIP-712 signed approval requests
     * @param owner Address granting the allowance
     * @param spender Authorized spending address
     * @param amount Approved token amount
     * @param nonce Unique transaction identifier for replay protection
     */
    struct ApproveRequest {
        address owner;
        address spender;
        uint256 amount;
        uint256 nonce;
    }



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



    bytes32 private constant APPROVE_REQUEST_TYPEHASH = keccak256(
        "ApproveRequest(address owner,address spender,uint256 amount,uint256 nonce)"
    );
    bytes32 private constant TRANSFER_REQUEST_TYPEHASH = keccak256(
        "TransferRequest(address from,address to,uint256 amount,uint256 nonce)"
    );



    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");



    // Mapping of nonces to prevent replay attacks
    mapping(address => uint256) public transferNonces;
    mapping(address => uint256) public approveNonces;



    /**
     * @dev Initializes the contract
     * @param name Token name
     * @param symbol Token symbol
     * Grants DEFAULT_ADMIN_ROLE and MINTER_ROLE to deployer
     * Initializes EIP-712 domain separator
     */
    constructor(string memory name, string memory symbol)
    ERC20(name, symbol)
    EIP712(name, "1.0.0")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }



    // -- Functions --

    /**
     * @dev Mints new tokens
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }



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
        TransferRequest memory request = TransferRequest(
            from,
            to,
            amount,
            transferNonces[from]
        );

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                TRANSFER_REQUEST_TYPEHASH,
                request.from,
                request.to,
                request.amount,
                request.nonce
            ))
        );

        address signer = digest.recover(signature);
        require(signer == from, "Invalid signature");
        require(balanceOf(from) >= amount, "Insufficient balance");

        transferNonces[from]++;
        _transfer(from, to, amount);
    }



    /**
     * @dev Executes a gasless allowance approval via EIP-712 signature
     * @param owner Token owner address granting allowance
     * @param spender Authorized spending address
     * @param amount Approved amount
     * @param signature EIP-712 signature from 'owner' address
     */
    function metaApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata signature
    ) external {
        uint256 currentNonce = approveNonces[owner];
        ApproveRequest memory request = ApproveRequest(
            owner,
            spender,
            amount,
            currentNonce
        );

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                APPROVE_REQUEST_TYPEHASH,
                request.owner,
                request.spender,
                request.amount,
                request.nonce
            ))
        );

        address signer = digest.recover(signature);
        require(signer == owner, "Invalid signature");

        approveNonces[owner]++;
        _approve(owner, spender, amount);
    }



    /**
     * @dev Retrieves the current nonce for transfer and approve requests
     * @param user Address to check
     * @return transferNonce Current transfer nonce
     * @return approveNonce Current approve nonce
     */
    function getNonces(address user) external view returns (uint256 transferNonce, uint256 approveNonce) {
        transferNonce = transferNonces[user];
        approveNonce = approveNonces[user];
    }



    // -- Overrides --

    /**
     * @dev Internal update hook that centralizes all balance modifications
     *      (minting, transferring, burning) into a single function call.
     *      By overriding this method, we guarantee that our custom events
     *      OnMint and OnTransfer are emitted on every token mint or transfer,
     *      and cannot be bypassed by any ERC20 operation.
     *
     * @param from   Address from which tokens are debited (zero address for mint).
     * @param to     Address to which tokens are credited (zero address for burn).
     * @param amount Number of tokens to move.
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
}
