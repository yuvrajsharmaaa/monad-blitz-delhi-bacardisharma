// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestPrizeToken
 * @notice ERC-20 token for testing remix battle prizes on Monad testnet
 */
contract TestPrizeToken is ERC20, Ownable {
    constructor() ERC20("Prize Token", "PRIZE") Ownable(msg.sender) {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1000000 * 10**decimals()); // 1 million tokens
    }
    
    /**
     * @notice Mint tokens (owner only) for testing
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Faucet function - anyone can claim test tokens
     */
    function faucet() external {
        _mint(msg.sender, 100 * 10**decimals()); // 100 tokens per claim
    }
}
