use anchor_lang::prelude::*;

declare_id!("Reg1stry111111111111111111111111111111111111");

#[program]
pub mod registry {
    use super::*;

    pub fn create_listing(
        ctx: Context<CreateListing>,
        endpoint_url: String,
        description: String,
        price_usd_cents: u32,
        token_mint: Pubkey,
        category: u8,
        logo_url: String,
    ) -> Result<()> {
        require!(endpoint_url.len() <= 128, RegistryError::StringTooLong);
        require!(description.len() <= 256, RegistryError::StringTooLong);
        require!(logo_url.len() <= 128, RegistryError::StringTooLong);

        let listing = &mut ctx.accounts.listing;
        listing.provider = ctx.accounts.provider.key();
        listing.endpoint_url = endpoint_url;
        listing.description = description;
        listing.price_usd_cents = price_usd_cents;
        listing.token_mint = token_mint;
        listing.category = category;
        listing.logo_url = logo_url;
        listing.active = true;
        listing.bump = *ctx.bumps.get("listing").unwrap();
        Ok(())
    }

    pub fn update_listing(
        ctx: Context<UpdateListing>,
        endpoint_url: String,
        description: String,
        price_usd_cents: u32,
        token_mint: Pubkey,
        category: u8,
        logo_url: String,
    ) -> Result<()> {
        require!(endpoint_url.len() <= 128, RegistryError::StringTooLong);
        require!(description.len() <= 256, RegistryError::StringTooLong);
        require!(logo_url.len() <= 128, RegistryError::StringTooLong);

        let listing = &mut ctx.accounts.listing;
        require_keys_eq!(listing.provider, ctx.accounts.provider.key());
        listing.endpoint_url = endpoint_url;
        listing.description = description;
        listing.price_usd_cents = price_usd_cents;
        listing.token_mint = token_mint;
        listing.category = category;
        listing.logo_url = logo_url;
        Ok(())
    }

    pub fn set_active(ctx: Context<SetActive>, active: bool) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require_keys_eq!(listing.provider, ctx.accounts.provider.key());
        listing.active = active;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(endpoint_url: String)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    /// PDA: seeds = [provider, endpoint_hash]
    #[account(
        init,
        payer = provider,
        space = 8 + ApiListing::MAX_SIZE,
        seeds = [provider.key().as_ref(), anchor_lang::solana_program::hash::hash(endpoint_url.as_bytes()).to_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, ApiListing>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(endpoint_url: String)]
pub struct UpdateListing<'info> {
    pub provider: Signer<'info>,
    #[account(
        mut,
        seeds = [provider.key().as_ref(), anchor_lang::solana_program::hash::hash(endpoint_url.as_bytes()).to_bytes().as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, ApiListing>,
}

#[derive(Accounts)]
pub struct SetActive<'info> {
    pub provider: Signer<'info>,
    #[account(mut, has_one = provider)]
    pub listing: Account<'info, ApiListing>,
}

#[account]
pub struct ApiListing {
    pub provider: Pubkey,
    pub endpoint_url: String,
    pub description: String,
    pub price_usd_cents: u32,
    pub token_mint: Pubkey,
    pub category: u8,
    pub logo_url: String,
    pub active: bool,
    pub bump: u8,
}

impl ApiListing {
    pub const MAX_SIZE: usize = 32 + // provider
        4 + 128 + // endpoint_url
        4 + 256 + // description
        4 + // price
        32 + // token_mint
        1 + // category
        4 + 128 + // logo_url
        1 + // active
        1; // bump
}

#[error_code]
pub enum RegistryError {
    #[msg("Provided string exceeds maximum length")] 
    StringTooLong,
}


