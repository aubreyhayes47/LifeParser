/**
 * Game State Management
 * Central state for the Life Parser game
 * Initial values are now loaded from config data
 */

import { dataLoader } from './dataLoader.js';

// Export gameState as a mutable object
export const gameState = {
    character: {
        name: 'You',
        day: 1,
        hour: 8,
        minute: 0,
        money: 500,
        health: 100,
        energy: 100,
        hunger: 30,
        intelligence: 50,
        charisma: 50,
        strength: 40,
        businessSkill: 30
    },
    currentLocation: 'home',
    businesses: [],
    relationships: {},
    inventory: ['phone', 'wallet', 'keys'],
    flags: {
        hasJob: false,
        metInvestor: false,
        ownsCafe: false
    },
    commandHistory: [],
    lastNPC: null,
    pendingEvent: null
};

/**
 * Initialize game state after data is loaded
 */
export function initializeGameState() {
    const config = dataLoader.getConfig();

    // Update character with config values
    Object.assign(gameState.character, config.initialCharacter);

    // Update location
    gameState.currentLocation = config.initialLocation;

    // Reset other properties
    gameState.businesses = [];
    gameState.relationships = {};
    gameState.inventory = [...config.initialInventory];
    gameState.flags = {
        hasJob: false,
        metInvestor: false,
        ownsCafe: false
    };
    gameState.commandHistory = [];
    gameState.lastNPC = null;
    gameState.pendingEvent = null;
}

/**
 * Reset game state to initial values
 */
export function resetGameState() {
    initializeGameState();
}
