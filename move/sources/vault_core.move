module zenith::vault_core {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_VAULT_NOT_FOUND: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_VAULT_PAUSED: u64 = 5;

    /// Strategy types
    const STRATEGY_CLMM: u8 = 1;
    const STRATEGY_DELTA_NEUTRAL: u8 = 2;
    const STRATEGY_ARBITRAGE: u8 = 3;

    /// Vault structure
    struct Vault<phantom CoinType> has key, store {
        vault_id: u64,
        strategy_type: u8,
        total_shares: u64,
        total_assets: u64,
        performance_fee: u64, // in basis points (100 = 1%)
        management_fee: u64, // in basis points, annualized
        last_harvest: u64,
        paused: bool,
        admin: address,
    }

    /// User position in a vault
    struct UserPosition has key, store {
        vault_id: u64,
        shares: u64,
        deposited_at: u64,
    }

    /// Global vault registry
    struct VaultRegistry has key {
        next_vault_id: u64,
        vault_count: u64,
    }

    /// Events
    struct DepositEvent has drop, store {
        vault_id: u64,
        user: address,
        amount: u64,
        shares: u64,
        timestamp: u64,
    }

    struct WithdrawEvent has drop, store {
        vault_id: u64,
        user: address,
        amount: u64,
        shares: u64,
        timestamp: u64,
    }

    struct HarvestEvent has drop, store {
        vault_id: u64,
        profit: u64,
        timestamp: u64,
    }

    struct VaultEventHandle has key {
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
        harvest_events: EventHandle<HarvestEvent>,
    }

    /// Initialize the module
    fun init_module(admin: &signer) {
        move_to(admin, VaultRegistry {
            next_vault_id: 1,
            vault_count: 0,
        });

        move_to(admin, VaultEventHandle {
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            withdraw_events: account::new_event_handle<WithdrawEvent>(admin),
            harvest_events: account::new_event_handle<HarvestEvent>(admin),
        });
    }

    /// Create a new vault
    public entry fun create_vault<CoinType>(
        admin: &signer,
        strategy_type: u8,
        performance_fee: u64,
        management_fee: u64,
    ) acquires VaultRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<VaultRegistry>(admin_addr);

        let vault = Vault<CoinType> {
            vault_id: registry.next_vault_id,
            strategy_type,
            total_shares: 0,
            total_assets: 0,
            performance_fee,
            management_fee,
            last_harvest: timestamp::now_seconds(),
            paused: false,
            admin: admin_addr,
        };

        move_to(admin, vault);
        registry.next_vault_id = registry.next_vault_id + 1;
        registry.vault_count = registry.vault_count + 1;
    }

    /// Deposit assets into a vault
    public entry fun deposit<CoinType>(
        user: &signer,
        vault_addr: address,
        amount: u64,
    ) acquires Vault, UserPosition, VaultEventHandle {
        assert!(amount > 0, E_INVALID_AMOUNT);

        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        assert!(!vault.paused, E_VAULT_PAUSED);

        // Calculate shares to mint
        let shares = if (vault.total_shares == 0) {
            amount
        } else {
            (amount * vault.total_shares) / vault.total_assets
        };

        // Update vault state
        vault.total_shares = vault.total_shares + shares;
        vault.total_assets = vault.total_assets + amount;

        // Update or create user position
        let user_addr = signer::address_of(user);
        if (!exists<UserPosition>(user_addr)) {
            move_to(user, UserPosition {
                vault_id: vault.vault_id,
                shares: shares,
                deposited_at: timestamp::now_seconds(),
            });
        } else {
            let position = borrow_global_mut<UserPosition>(user_addr);
            position.shares = position.shares + shares;
        };

        // Emit event
        let event_handle = borrow_global_mut<VaultEventHandle>(vault_addr);
        event::emit_event(&mut event_handle.deposit_events, DepositEvent {
            vault_id: vault.vault_id,
            user: user_addr,
            amount,
            shares,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Withdraw assets from a vault
    public entry fun withdraw<CoinType>(
        user: &signer,
        vault_addr: address,
        shares: u64,
    ) acquires Vault, UserPosition, VaultEventHandle {
        let user_addr = signer::address_of(user);
        assert!(exists<UserPosition>(user_addr), E_INSUFFICIENT_BALANCE);

        let position = borrow_global_mut<UserPosition>(user_addr);
        assert!(position.shares >= shares, E_INSUFFICIENT_BALANCE);

        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);

        // Calculate amount to withdraw
        let amount = (shares * vault.total_assets) / vault.total_shares;

        // Update vault state
        vault.total_shares = vault.total_shares - shares;
        vault.total_assets = vault.total_assets - amount;

        // Update user position
        position.shares = position.shares - shares;

        // Emit event
        let event_handle = borrow_global_mut<VaultEventHandle>(vault_addr);
        event::emit_event(&mut event_handle.withdraw_events, WithdrawEvent {
            vault_id: vault.vault_id,
            user: user_addr,
            amount,
            shares,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Harvest vault profits
    public entry fun harvest<CoinType>(
        admin: &signer,
        vault_addr: address,
        profit: u64,
    ) acquires Vault, VaultEventHandle {
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        assert!(signer::address_of(admin) == vault.admin, E_NOT_AUTHORIZED);

        // Apply performance fee
        let fee = (profit * vault.performance_fee) / 10000;
        let net_profit = profit - fee;

        // Update total assets
        vault.total_assets = vault.total_assets + net_profit;
        vault.last_harvest = timestamp::now_seconds();

        // Emit event
        let event_handle = borrow_global_mut<VaultEventHandle>(vault_addr);
        event::emit_event(&mut event_handle.harvest_events, HarvestEvent {
            vault_id: vault.vault_id,
            profit: net_profit,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Pause vault operations
    public entry fun pause_vault<CoinType>(
        admin: &signer,
        vault_addr: address,
    ) acquires Vault {
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        assert!(signer::address_of(admin) == vault.admin, E_NOT_AUTHORIZED);
        vault.paused = true;
    }

    /// Resume vault operations
    public entry fun unpause_vault<CoinType>(
        admin: &signer,
        vault_addr: address,
    ) acquires Vault {
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        assert!(signer::address_of(admin) == vault.admin, E_NOT_AUTHORIZED);
        vault.paused = false;
    }

    /// View functions
    #[view]
    public fun get_vault_info<CoinType>(vault_addr: address): (u64, u8, u64, u64, u64, u64) acquires Vault {
        let vault = borrow_global<Vault<CoinType>>(vault_addr);
        (
            vault.vault_id,
            vault.strategy_type,
            vault.total_shares,
            vault.total_assets,
            vault.performance_fee,
            vault.management_fee,
        )
    }

    #[view]
    public fun get_user_position(user_addr: address): (u64, u64, u64) acquires UserPosition {
        assert!(exists<UserPosition>(user_addr), E_VAULT_NOT_FOUND);
        let position = borrow_global<UserPosition>(user_addr);
        (position.vault_id, position.shares, position.deposited_at)
    }

    #[view]
    public fun calculate_withdraw_amount<CoinType>(
        vault_addr: address,
        shares: u64,
    ): u64 acquires Vault {
        let vault = borrow_global<Vault<CoinType>>(vault_addr);
        if (vault.total_shares == 0) {
            0
        } else {
            (shares * vault.total_assets) / vault.total_shares
        }
    }
}
