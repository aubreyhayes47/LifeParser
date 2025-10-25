/**
 * Game State Management
 * Central state for the Life Parser game
 * Initial values are now loaded from config data
 */

import { dataLoader } from './dataLoader.js';

/**
 * Initialize game state from config data
 * @returns {Object} Initial game state
 */
function createInitialState() {
    const config = dataLoader.getConfig();
    return {
        character: { ...config.initialCharacter },
        currentLocation: config.initialLocation,
        businesses: [],
        relationships: {},
        inventory: [...config.initialInventory],
        flags: {
            hasJob: false,
            metInvestor: false,
            ownsCafe: false
        },
        commandHistory: [],
        lastNPC: null,
        pendingEvent: null
    };
}

// Export gameState as a mutable object
export let gameState = {
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
    gameState = createInitialState();
}

/**
 * Reset game state to initial values
 */
export function resetGameState() {
    Object.assign(gameState, createInitialState());
}
