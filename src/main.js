/**
 * Main Entry Point
 * Initializes the game when the page loads
 */

import { GameEngine } from './engine.js';

const game = new GameEngine();

window.addEventListener('DOMContentLoaded', () => {
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
});
