// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes with EIP-2612 permit support
 * @notice This contract mimics USDC with 6 decimals, permit functionality, and an open mint function
 */
contract MockUSDC is ERC20, ERC20Permit {
    constructor() ERC20("USD Coin", "USDC") ERC20Permit("USD Coin") {}

    /**
     * @dev Returns the number of decimals (6 for USDC)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mints tokens to the specified address (for testing only)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in smallest unit, 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
