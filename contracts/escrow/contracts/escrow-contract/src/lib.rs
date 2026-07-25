// ═══════════════════════════════════════════════════════════════════════════════
// SoroHub — Asset-Agnostic Escrow Vault Contract
// ═══════════════════════════════════════════════════════════════════════════════

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};
use soroban_sdk::contractclient;

// ─── Cross-contract client interface ────────────────────────────────────────
#[contractclient(name = "BadgeClient")]
pub trait BadgeInterface {
    fn mint_badge(env: Env, developer: Address, bounty_id: u32);
    fn get_badges(env: Env, developer: Address) -> Vec<u32>;
    fn mint_wip_badge(env: Env, developer: Address, bounty_id: u32);
    fn burn_wip_badge(env: Env, developer: Address, bounty_id: u32);
    fn get_wip_badges(env: Env, developer: Address) -> Vec<u32>;
}

// ─── Custom Struct for Multi-Asset Bounties ─────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BountyRecord {
    pub funder: Address,
    pub amount: i128,
    pub token: Address, // Dynamically stores the specific SEP-41 token address
}

// ─── Type-safe storage keys ─────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Admin,
    BadgeContract,
    BountyFund(u32), // Maps to BountyRecord
    Assignment(u32), // Maps bounty_id to assigned developer Address
}

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────
    pub fn init(env: Env, admin: Address, badge_contract: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BadgeContract, &badge_contract);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE — FUND
    // ─────────────────────────────────────────────────────────────────────────
    pub fn fund_bounty(env: Env, funder: Address, bounty_id: u32, token: Address, amount: i128) {
        // Anyone can create and fund a bounty
        funder.require_auth();

        // ── Pull the specified token from funder → this contract's vault ──
        token::Client::new(&env, &token)
            .transfer(&funder, &env.current_contract_address(), &amount);

        // ── Record the funder, amount, AND the token address ──
        let record = BountyRecord { funder: funder.clone(), amount, token };
        env.storage()
            .instance()
            .set(&DataKey::BountyFund(bounty_id), &record);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE — ASSIGN (Lock to developer and mint WIP Badge)
    // ─────────────────────────────────────────────────────────────────────────
    pub fn assign_bounty(env: Env, developer: Address, bounty_id: u32) {
        let badge_contract: Address = env.storage().instance().get(&DataKey::BadgeContract).unwrap();

        let record: BountyRecord = env
            .storage()
            .instance()
            .get(&DataKey::BountyFund(bounty_id))
            .expect("bounty not found or already claimed");

        // Only original funder can assign the developer
        record.funder.require_auth();

        // Save assignment
        env.storage().instance().set(&DataKey::Assignment(bounty_id), &developer);

        // Mint WIP Badge to developer
        BadgeClient::new(&env, &badge_contract).mint_wip_badge(&developer, &bounty_id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE — CANCEL (Refund funds to funder)
    // ─────────────────────────────────────────────────────────────────────────
    pub fn cancel_bounty(env: Env, bounty_id: u32) {
        let record: BountyRecord = env
            .storage()
            .instance()
            .get(&DataKey::BountyFund(bounty_id))
            .expect("bounty not found or already claimed/cancelled");

        // Only original funder can cancel
        record.funder.require_auth();

        // Ensure it hasn't been assigned yet
        assert!(
            !env.storage().instance().has(&DataKey::Assignment(bounty_id)),
            "Cannot cancel a bounty that has already been assigned"
        );

        // ── Refund token from vault → funder wallet ──
        token::Client::new(&env, &record.token)
            .transfer(&env.current_contract_address(), &record.funder, &record.amount);

        // ── Clean up state ──
        env.storage().instance().remove(&DataKey::BountyFund(bounty_id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE — CLAIM (Burn WIP Badge, Mint Final Badge, Release Funds)
    // ─────────────────────────────────────────────────────────────────────────
    pub fn claim_bounty(env: Env, developer: Address, bounty_id: u32) {
        let badge_contract: Address = env.storage().instance().get(&DataKey::BadgeContract).unwrap();

        let record: BountyRecord = env
            .storage()
            .instance()
            .get(&DataKey::BountyFund(bounty_id))
            .expect("bounty not found or already claimed");

        record.funder.require_auth();

        // Ensure this developer was actually assigned
        let assigned: Address = env
            .storage()
            .instance()
            .get(&DataKey::Assignment(bounty_id))
            .expect("no developer assigned to this bounty");
            
        assert!(assigned == developer, "Only the assigned developer can be paid out");

        // ── Step 1: Transfer specific token from vault → developer wallet ──
        token::Client::new(&env, &record.token)
            .transfer(&env.current_contract_address(), &developer, &record.amount);

        // ── Step 2: Cross-contract call → Burn WIP, mint final badge ──
        let client = BadgeClient::new(&env, &badge_contract);
        client.burn_wip_badge(&developer, &bounty_id);
        client.mint_badge(&developer, &bounty_id);

        // ── Step 3: Clean up state ──
        env.storage().instance().remove(&DataKey::BountyFund(bounty_id));
        env.storage().instance().remove(&DataKey::Assignment(bounty_id));
    }
}