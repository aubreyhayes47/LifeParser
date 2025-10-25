/**
 * Game State Management
 * Central state for the Life Parser game
 */

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
