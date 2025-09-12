use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("TokenVibesTokenSale1111111111111111111111111");

#[program]
pub mod token_sale {
    use super::*;

    pub fn initialize_sale(
        ctx: Context<InitializeSale>,
        quantity: u64,
        price_per_token: u64,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        sale.seller = ctx.accounts.seller.key();
        sale.token_mint = ctx.accounts.token_mint.key();
        sale.usdc_mint = ctx.accounts.usdc_mint.key();
        sale.price_per_token = price_per_token;
        sale.tokens_available = quantity;
        sale.total_tokens = quantity;
        sale.bump = ctx.bumps.sale;
        
        // Transfer tokens from seller to the sale account
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_token_account.to_account_info(),
            to: ctx.accounts.sale_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, quantity)?;
        
        Ok(())
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, quantity: u64) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        
        // Check if enough tokens are available
        require!(sale.tokens_available >= quantity, ErrorCode::InsufficientTokens);
        
        // Calculate total cost
        let total_cost = quantity.checked_mul(sale.price_per_token)
            .ok_or(ErrorCode::MathOverflow)?;
        
        // Transfer USDC from buyer to sale account
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_usdc_account.to_account_info(),
            to: ctx.accounts.sale_usdc_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_cost)?;
        
        // Transfer tokens from sale account to buyer
        let cpi_accounts = Transfer {
            from: ctx.accounts.sale_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.sale.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, quantity)?;
        
        // Update available tokens
        sale.tokens_available = sale.tokens_available.checked_sub(quantity)
            .ok_or(ErrorCode::MathOverflow)?;
        
        Ok(())
    }

    pub fn withdraw_usdc(ctx: Context<WithdrawUsdc>) -> Result<()> {
        let sale = &ctx.accounts.sale;
        
        // Only the seller can withdraw USDC
        require!(ctx.accounts.seller.key() == sale.seller, ErrorCode::Unauthorized);
        
        // Transfer all USDC from sale account to seller
        let sale_usdc_balance = ctx.accounts.sale_usdc_account.amount;
        if sale_usdc_balance > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.sale_usdc_account.to_account_info(),
                to: ctx.accounts.seller_usdc_account.to_account_info(),
                authority: ctx.accounts.sale.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, sale_usdc_balance)?;
        }
        
        Ok(())
    }

    pub fn cancel_sale(ctx: Context<CancelSale>) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        
        // Only the seller can cancel the sale
        require!(ctx.accounts.seller.key() == sale.seller, ErrorCode::Unauthorized);
        
        // Transfer remaining tokens back to seller
        let remaining_tokens = ctx.accounts.sale_token_account.amount;
        if remaining_tokens > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.sale_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.sale.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, remaining_tokens)?;
        }
        
        // Mark sale as cancelled
        sale.tokens_available = 0;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(quantity: u64, price_per_token: u64)]
pub struct InitializeSale<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        init,
        payer = seller,
        space = 8 + Sale::INIT_SPACE,
        seeds = [b"sale", seller.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub sale: Account<'info, Sale>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub usdc_mint: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == token_mint.key()
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = seller,
        token::mint = token_mint,
        token::authority = sale
    )]
    pub sale_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = seller,
        token::mint = usdc_mint,
        token::authority = sale
    )]
    pub sale_usdc_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        constraint = sale.tokens_available > 0
    )]
    pub sale: Account<'info, Sale>,
    
    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == sale.token_mint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = buyer_usdc_account.owner == buyer.key(),
        constraint = buyer_usdc_account.mint == sale.usdc_mint
    )]
    pub buyer_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = sale_token_account.owner == sale.key(),
        constraint = sale_token_account.mint == sale.token_mint
    )]
    pub sale_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = sale_usdc_account.owner == sale.key(),
        constraint = sale_usdc_account.mint == sale.usdc_mint
    )]
    pub sale_usdc_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawUsdc<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        constraint = sale.seller == seller.key()
    )]
    pub sale: Account<'info, Sale>,
    
    #[account(
        mut,
        constraint = seller_usdc_account.owner == seller.key(),
        constraint = seller_usdc_account.mint == sale.usdc_mint
    )]
    pub seller_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = sale_usdc_account.owner == sale.key(),
        constraint = sale_usdc_account.mint == sale.usdc_mint
    )]
    pub sale_usdc_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelSale<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        constraint = sale.seller == seller.key()
    )]
    pub sale: Account<'info, Sale>,
    
    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == sale.token_mint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = sale_token_account.owner == sale.key(),
        constraint = sale_token_account.mint == sale.token_mint
    )]
    pub sale_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Sale {
    pub seller: Pubkey,
    pub token_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub price_per_token: u64,
    pub tokens_available: u64,
    pub total_tokens: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient tokens available")]
    InsufficientTokens,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unauthorized")]
    Unauthorized,
}
