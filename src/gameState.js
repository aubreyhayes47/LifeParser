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
    currentJob: null, // Track current career/job ID
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
    gameState.currentJob = null;
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

/**
 * Get default game state structure
 * @returns {Object} Default game state object
 */
function getDefaultGameState() {
    const config = dataLoader.getConfig();
    return {
        character: { ...config.initialCharacter },
        currentLocation: config.initialLocation,
        currentJob: null,
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

/**
 * Save game state to localStorage
 * @returns {boolean} True if save was successful
 */
export function saveGameState() {
    try {
        const saveData = JSON.stringify(gameState);
        localStorage.setItem('lifeparser_save', saveData);
        localStorage.setItem('lifeparser_save_timestamp', new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Failed to save game state:', error);
        return false;
    }
}

/**
 * Load game state from localStorage and merge with default state for forward compatibility
 * @returns {boolean} True if load was successful
 */
export function loadGameState() {
    try {
        const savedData = localStorage.getItem('lifeparser_save');
        if (!savedData) {
            return false;
        }

        const loadedState = JSON.parse(savedData);
        const defaultState = getDefaultGameState();

        // Deep merge loaded state with default state to ensure forward compatibility
        // This ensures new properties added in future versions are present
        mergeGameState(gameState, defaultState, loadedState);

        return true;
    } catch (error) {
        console.error('Failed to load game state:', error);
        return false;
    }
}

/**
 * Deep merge loaded state with default state into target state
 * @param {Object} target - Target state object to update (gameState)
 * @param {Object} defaultState - Default state with all properties
 * @param {Object} loadedState - Loaded state from localStorage
 */
function mergeGameState(target, defaultState, loadedState) {
    // Start with default state structure
    Object.keys(defaultState).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(loadedState, key)) {
            // Property exists in loaded state
            if (
                typeof defaultState[key] === 'object' &&
                defaultState[key] !== null &&
                !Array.isArray(defaultState[key])
            ) {
                // Deep merge objects
                target[key] = { ...defaultState[key], ...loadedState[key] };
            } else {
                // Use loaded value for primitives and arrays
                target[key] = loadedState[key];
            }
        } else {
            // Property doesn't exist in loaded state, use default
            target[key] = Array.isArray(defaultState[key])
                ? [...defaultState[key]]
                : defaultState[key];
        }
    });
}

/**
 * Check if a saved game exists
 * @returns {boolean} True if a save exists
 */
export function hasSavedGame() {
    return localStorage.getItem('lifeparser_save') !== null;
}

/**
 * Get save timestamp
 * @returns {string|null} ISO timestamp of last save or null
 */
export function getSaveTimestamp() {
    return localStorage.getItem('lifeparser_save_timestamp');
}
