// ═══════════════════════════════════════════════════════════════════════════════
// SoroHub — Reputation Badge (Soulbound Token) Contract
// ═══════════════════════════════════════════════════════════════════════════════

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

// ─── Type-safe storage keys ─────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Escrow,
    Badges(Address),
    WipBadges(Address),
}

#[contract]
pub struct Badge;

#[contractimpl]
impl Badge {
    pub fn init(env: Env, escrow: Address) {
        env.storage().instance().set(&DataKey::Escrow, &escrow);
    }

    pub fn mint_badge(env: Env, developer: Address, bounty_id: u32) {
        let escrow: Address = env.storage().instance().get(&DataKey::Escrow).unwrap();
        escrow.require_auth();

        let key = DataKey::Badges(developer.clone());
        let mut badges: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        badges.push_back(bounty_id);
        env.storage().persistent().set(&key, &badges);
    }

    pub fn mint_wip_badge(env: Env, developer: Address, bounty_id: u32) {
        let escrow: Address = env.storage().instance().get(&DataKey::Escrow).unwrap();
        escrow.require_auth();

        let key = DataKey::WipBadges(developer.clone());
        let mut badges: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        badges.push_back(bounty_id);
        env.storage().persistent().set(&key, &badges);
    }

    pub fn burn_wip_badge(env: Env, developer: Address, bounty_id: u32) {
        let escrow: Address = env.storage().instance().get(&DataKey::Escrow).unwrap();
        escrow.require_auth();

        let key = DataKey::WipBadges(developer.clone());
        let mut badges: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        
        if let Some(idx) = badges.first_index_of(bounty_id) {
            badges.remove(idx);
            env.storage().persistent().set(&key, &badges);
        }
    }

    pub fn get_badges(env: Env, developer: Address) -> Vec<u32> {
        let key = DataKey::Badges(developer);
        env.storage().persistent().get(&key).unwrap_or(Vec::new(&env))
    }

    pub fn get_wip_badges(env: Env, developer: Address) -> Vec<u32> {
        let key = DataKey::WipBadges(developer);
        env.storage().persistent().get(&key).unwrap_or(Vec::new(&env))
    }
}