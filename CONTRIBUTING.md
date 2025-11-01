# Contributing

## Code Structure

### Smart Contracts (`/contracts`)

- `MusicNFT.sol`: NFT minting contract
- `VotingContract.sol`: Voting and competition logic with dynamic programming optimizations

### Frontend (`/frontend`)

- `app/`: Next.js pages and layouts
- `components/`: React components
- `hooks/`: Custom React hooks (wallet integration)
- `utils/`: Utility functions (contracts, IPFS)

### Tests (`/test`)

- `MusicNFT.test.js`: Tests for NFT contract
- `VotingContract.test.js`: Tests for voting contract with edge cases

## Development Guidelines

1. **Dynamic Programming**: Use memoization for expensive operations
2. **Gas Optimization**: Minimize on-chain storage, use calldata where possible
3. **Event-Driven**: Emit events for all state changes
4. **Testing**: Write tests for all functions, especially edge cases

## Performance Considerations

- Vote counts cached both on-chain and off-chain
- Frontend uses memoized selectors to avoid re-renders
- IPFS uploads handled asynchronously
- Event listeners update UI in real-time

