/**
 * Main Entry Point
 * Initializes the game when the page loads
 */

import { GameEngine } from './engine.js';
import { dataLoader } from './dataLoader.js';

/**
 * Show loading screen
 */
function showLoadingScreen() {
    const container = document.getElementById('output-container');
    container.innerHTML = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'output-text system';
    loadingDiv.textContent = 'Loading game data...';
    container.appendChild(loadingDiv);
}

/**
 * Show error screen
 * @param {string} errorMessage - Error message to display
 */
function showErrorScreen(errorMessage) {
    const container = document.getElementById('output-container');
    container.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'output-text error';
    errorDiv.textContent = `Failed to load game data: ${errorMessage}`;
    container.appendChild(errorDiv);

    const retryDiv = document.createElement('div');
    retryDiv.className = 'output-text system';
    retryDiv.textContent = 'Please refresh the page to try again.';
    container.appendChild(retryDiv);
}

/**
 * Initialize the game after data is loaded
 */
async function initializeGame() {
    showLoadingScreen();

    // Load all game data
    const success = await dataLoader.loadAll();

    if (!success) {
        showErrorScreen(dataLoader.getError());
        return;
    }

    // Data loaded successfully, initialize game
    const game = new GameEngine();
    game.init();

    const input = document.getElementById('command-input');
    const submitBtn = document.getElementById('submit-btn');

    submitBtn.addEventListener('click', () => {
        const command = input.value;
        if (command) {
            game.processCommand(command);
            input.value = '';
        }
    });

    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });

    input.focus();
}

window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});
