# Token Vibes Token Sale Contract

This is an Anchor smart contract that enables users to sell their SPL tokens at fixed USDC prices on Solana.

## Features

- **Initialize Sale**: Deploy a sale contract for a specific token with a fixed USDC price
- **Buy Tokens**: Purchase tokens by sending USDC to the contract
- **Withdraw USDC**: Only the seller can withdraw earned USDC
- **Cancel Sale**: Only the seller can cancel the sale and get remaining tokens back

## Contract Structure

### Sale Account
```rust
pub struct Sale {
    pub seller: Pubkey,           // Only this address can withdraw USDC
    pub token_mint: Pubkey,       // The token being sold
    pub usdc_mint: Pubkey,        // USDC mint address
    pub price_per_token: u64,     // Price in USDC (with decimals)
    pub tokens_available: u64,    // How many tokens left
    pub total_tokens: u64,        // Original amount listed
    pub bump: u8,                 // PDA bump
}
```

## Instructions

### 1. Initialize Sale
Creates a new sale contract and transfers tokens from seller to the contract.

**Parameters:**
- `quantity`: Number of tokens to sell
- `price_per_token`: Price per token in USDC (with decimals)

### 2. Buy Tokens
Allows buyers to purchase tokens by sending USDC.

**Parameters:**
- `quantity`: Number of tokens to buy

### 3. Withdraw USDC
Allows the seller to withdraw earned USDC from the contract.

### 4. Cancel Sale
Allows the seller to cancel the sale and get remaining tokens back.

## Security Features

- **Owner-Only Withdrawals**: Only the original seller can withdraw USDC
- **Atomic Swaps**: USDC and tokens exchange simultaneously
- **Price Lock**: Price cannot be changed after deployment
- **Supply Verification**: Contract verifies seller owns the tokens

## Usage

1. Deploy the contract to Solana
2. Call `initialize_sale` with your token and desired price
3. Share the contract address for others to buy
4. Withdraw USDC earnings as they come in
5. Cancel sale if needed to get remaining tokens back

## Development

```bash
# Build the contract
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Integration

The contract integrates with the Token Vibes frontend to provide a seamless user experience for creating and managing token sales.
