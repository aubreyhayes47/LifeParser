/**
 * Game Engine
 * Main game logic and command processing
 */

import { gameState, initializeGameState } from './gameState.js';
import { locations } from './locations.js';
import { NLPParser } from './parser.js';
import { dataLoader } from './dataLoader.js';

export class GameEngine {
    constructor() {
        this.parser = new NLPParser();
        this.outputElement = document.getElementById('output-container');
        this.inputElement = document.getElementById('command-input');
    }

    init() {
        // Initialize game state with loaded config
        initializeGameState();
        this.displayWelcome();
        this.updateUI();
    }

    displayWelcome() {
        const config = dataLoader.getConfig();
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output(config.game.title, 'location');
        this.output(config.game.subtitle, 'system');
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('');
        this.output(
            `You wake up in your small apartment on Day 1. You have $${config.initialCharacter.money} to your name and dreams of building a business empire. Every decision matters. Every day counts.`,
            'description'
        );
        this.output('');
        this.output("Type 'help' for a list of commands, or try natural language like:", 'system');
        this.output("  • 'look around' - Examine your surroundings", 'system');
        this.output("  • 'go to cafe' - Travel to locations", 'system');
        this.output("  • 'check stats' - View your character", 'system');
        this.output("  • 'talk to [person]' - Interact with NPCs", 'system');
        this.output('');
        this.describeLocation();
    }

    processCommand(input) {
        if (!input.trim()) return;

        gameState.commandHistory.push(input);
        this.output(`> ${input}`, 'system');
        this.output('');

        const command = this.parser.parse(input);

        switch (command.action) {
            case 'move':
                this.handleMovement(command);
                break;
            case 'look':
                this.describeLocation();
                break;
            case 'talk':
                this.handleConversation(command);
                break;
            case 'examine':
                this.handleExamine(command);
                break;
            case 'work':
                this.handleWork();
                break;
            case 'sleep':
                this.handleSleep(command.duration);
                break;
            case 'eat':
                this.handleEat(command);
                break;
            case 'loan':
                this.handleLoan(command);
                break;
            case 'apply':
                this.handleApply();
                break;
            case 'buy':
                this.handleBuy(command);
                break;
            case 'help':
                this.showHelp();
                break;
            case 'inventory':
                this.showInventory();
                break;
            case 'stats':
                this.showStats();
                break;
            case 'save':
                this.saveGame();
                break;
            case 'load':
                this.loadGame();
                break;
            case 'unknown':
                this.output(
                    `I don't understand "${input}". Try 'help' for available commands.`,
                    'error'
                );
                break;
        }

        this.updateUI();
        this.checkRandomEvents();
    }

    handleMovement(command) {
        let targetLocation = null;

        if (command.target) {
            targetLocation = this.parser.findClosestLocation(command.target);
        }

        const currentLoc = locations[gameState.currentLocation];

        if (!targetLocation || !locations[targetLocation]) {
            this.output("You can't go there from here.", 'error');
            this.output(`Available exits: ${currentLoc.exits.join(', ')}`, 'system');
            return;
        }

        if (!currentLoc.exits.includes(targetLocation)) {
            this.output(`You can't reach ${locations[targetLocation].name} from here.`, 'error');
            this.output(`Available exits: ${currentLoc.exits.join(', ')}`, 'system');
            return;
        }

        gameState.currentLocation = targetLocation;
        this.advanceTime(15);
        this.modifyEnergy(-5);

        this.output(`You travel to ${locations[targetLocation].name}.`, 'success');
        this.output('');
        this.describeLocation();
    }

    describeLocation() {
        const loc = locations[gameState.currentLocation];
        this.output(loc.name.toUpperCase(), 'location');
        this.output(loc.description, 'description');
        this.output('');

        if (loc.npcs.length > 0) {
            this.output(`People here: ${loc.npcs.join(', ')}`, 'system');
        }

        this.output(`Exits: ${loc.exits.join(', ')}`, 'system');
        this.output(`Actions: ${loc.actions.join(', ')}`, 'system');
    }

    handleConversation(command) {
        const loc = locations[gameState.currentLocation];
        const target = command.target;

        if (!target) {
            this.output('Talk to whom?', 'error');
            return;
        }

        if (!loc.npcs.some(npc => npc.includes(target) || target.includes(npc))) {
            this.output("There's no one like that here.", 'error');
            return;
        }

        gameState.lastNPC = target;

        // Get NPC dialogue from data
        const npcs = dataLoader.getNPCs();
        const npcKey = Object.keys(npcs).find(
            key => key.includes(target) || target.includes(key)
        );

        if (npcKey && npcs[npcKey] && npcs[npcKey].dialogues) {
            const dialogue = npcs[npcKey].dialogues.default;
            dialogue.forEach(line => {
                this.output(line, 'description');
            });
        } else {
            this.output(`You chat with the ${target}. They seem friendly.`, 'description');
        }

        this.advanceTime(10);
    }

    handleExamine(command) {
        const target = command.target;

        if (target.includes('stat') || target.includes('character')) {
            this.showStats();
        } else if (
            target.includes('money') ||
            target.includes('balance') ||
            target.includes('cash')
        ) {
            this.output(`You have $${gameState.character.money}.`, 'description');
        } else if (target.includes('health')) {
            this.output(`Your health is ${gameState.character.health}/100.`, 'description');
        } else if (target.includes('time')) {
            this.output(
                `It's Day ${gameState.character.day}, ${this.formatTime()}.`,
                'description'
            );
        } else if (target.includes('business') || target.includes('cafe')) {
            if (gameState.flags.ownsCafe) {
                this.output('You own the Coffee Bean Café!', 'success');
                this.output('Revenue: $200/day (currently passive)', 'description');
            } else {
                this.output("You don't own any businesses yet.", 'description');
            }
        } else {
            this.output(`You examine the ${target}. Nothing special.`, 'description');
        }
    }

    handleWork() {
        const loc = gameState.currentLocation;
        const config = dataLoader.getConfig();

        if (loc === 'gym') {
            if (gameState.character.money < config.prices.gymSession) {
                this.output(
                    `You don't have enough money for a gym session ($${config.prices.gymSession}).`,
                    'error'
                );
                return;
            }

            this.modifyMoney(-config.prices.gymSession);
            this.modifyEnergy(-30);
            this.modifyHunger(20);
            gameState.character.strength += 2;
            this.advanceTime(60);

            this.output(
                'You hit the weights hard. Your muscles burn, but you feel stronger!',
                'success'
            );
            this.output(`Strength +2, Energy -30, $${config.prices.gymSession} spent`, 'system');
        } else if (loc === 'cafe') {
            if (!gameState.flags.hasJob) {
                this.output("You need to apply for a job first. Try 'apply for job'.", 'error');
                return;
            }

            this.modifyMoney(config.prices.cafeWage);
            this.modifyEnergy(-25);
            this.modifyHunger(15);
            gameState.character.businessSkill += 1;
            this.advanceTime(240);

            this.output(
                'You work a 4-hour shift at the café, serving customers and managing the counter.',
                'success'
            );
            this.output(`Earned $${config.prices.cafeWage}, Business Skill +1`, 'system');
        } else {
            this.output("There's nothing to work on here.", 'error');
        }
    }

    handleSleep(hours) {
        if (gameState.currentLocation !== 'home') {
            this.output('You need to go home to sleep properly.', 'error');
            return;
        }

        this.modifyEnergy(100);
        this.advanceTime(hours * 60);
        this.modifyHunger(30);

        this.output(`You sleep for ${hours} hours and wake up refreshed.`, 'success');
        this.output('Energy restored to 100', 'system');
    }

    /**
     * Handle eating action
     * @param {Object} _command - Command object (reserved for future food selection feature)
     */
    handleEat(_command) {
        const config = dataLoader.getConfig();
        if (gameState.currentLocation === 'home') {
            if (gameState.character.money < config.prices.homeMeal) {
                this.output(
                    `You don't have enough money for food ($${config.prices.homeMeal}).`,
                    'error'
                );
                return;
            }

            this.modifyMoney(-config.prices.homeMeal);
            this.modifyHunger(-40);
            this.advanceTime(30);

            this.output(
                "You prepare a simple meal at home. It's not gourmet, but it fills you up.",
                'success'
            );
            this.output(`Hunger -40, $${config.prices.homeMeal} spent`, 'system');
        } else if (gameState.currentLocation === 'cafe') {
            if (gameState.character.money < config.prices.cafeMeal) {
                this.output(
                    `You don't have enough money for café food ($${config.prices.cafeMeal}).`,
                    'error'
                );
                return;
            }

            this.modifyMoney(-config.prices.cafeMeal);
            this.modifyHunger(-50);
            this.advanceTime(20);

            this.output('You order a sandwich and coffee. Delicious!', 'success');
            this.output(`Hunger -50, $${config.prices.cafeMeal} spent`, 'system');
        } else {
            this.output("You can't eat here. Try going home or to a café.", 'error');
        }
    }

    handleLoan(command) {
        if (gameState.currentLocation !== 'bank') {
            this.output('You need to be at the bank to get a loan.', 'error');
            return;
        }

        const config = dataLoader.getConfig();
        const amount = command.amount || 10000;

        if (amount < config.loans.min || amount > config.loans.max) {
            this.output(
                `Loans are available from $${config.loans.min} to $${config.loans.max}.`,
                'error'
            );
            return;
        }

        this.modifyMoney(amount);
        this.output(`Loan approved! You receive $${amount}.`, 'success');
        this.output(
            `Remember: This comes with ${config.loans.interestRate * 100}% interest. Invest wisely!`,
            'system'
        );
        this.advanceTime(30);
    }

    handleApply() {
        if (gameState.currentLocation !== 'cafe') {
            this.output('There are no job openings here.', 'error');
            return;
        }

        if (gameState.flags.hasJob) {
            this.output('You already work here!', 'error');
            return;
        }

        const config = dataLoader.getConfig();
        gameState.flags.hasJob = true;
        this.output('The owner smiles and shakes your hand.', 'success');
        this.output(
            `"Welcome aboard! You can work shifts by typing 'work'. We pay $${config.prices.cafeWage} per 4-hour shift."`,
            'description'
        );
        this.advanceTime(15);
    }

    handleBuy(command) {
        const target = command.target;
        const config = dataLoader.getConfig();

        if (target && target.includes('cafe')) {
            if (gameState.character.money < config.prices.cafePrice) {
                this.output(
                    `You need $${config.prices.cafePrice} to buy the café. Keep working and saving!`,
                    'error'
                );
                return;
            }

            this.modifyMoney(-config.prices.cafePrice);
            gameState.flags.ownsCafe = true;

            this.output('═════════════════════════════════════', 'event');
            this.output('BUSINESS ACQUIRED!', 'success');
            this.output('You are now the proud owner of Coffee Bean Café!', 'description');
            this.output(
                `The café will generate passive income of $${config.prices.cafeRevenue}/day.`,
                'description'
            );
            this.output('═════════════════════════════════════', 'event');
        } else {
            this.output("You can't buy that right now.", 'error');
        }
    }

    showHelp() {
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('AVAILABLE COMMANDS', 'location');
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('MOVEMENT:', 'description');
        this.output('  • go to [location] - Travel somewhere', 'system');
        this.output('  • look around - Describe current location', 'system');
        this.output('');
        this.output('INTERACTION:', 'description');
        this.output('  • talk to [person] - Speak with NPCs', 'system');
        this.output('  • work - Do activities at current location', 'system');
        this.output('  • apply for job - Get hired (at café)', 'system');
        this.output('');
        this.output('BASIC NEEDS:', 'description');
        this.output('  • sleep - Rest at home (restores energy)', 'system');
        this.output('  • eat - Get food (reduces hunger)', 'system');
        this.output('');
        this.output('BUSINESS:', 'description');
        this.output('  • take loan - Get business loan at bank', 'system');
        this.output('  • buy cafe - Purchase the café ($50,000)', 'system');
        this.output('');
        this.output('INFO:', 'description');
        this.output('  • stats - View full character stats', 'system');
        this.output('  • check [thing] - Examine something', 'system');
        this.output('  • inventory - View items', 'system');
        this.output('  • save/load - Save or load game', 'system');
    }

    showStats() {
        const c = gameState.character;
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('CHARACTER STATS', 'location');
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output(`Day ${c.day} - ${this.formatTime()}`, 'description');
        this.output('');
        this.output('PHYSICAL:', 'description');
        this.output(`  Health:      ${c.health}/100`, 'system');
        this.output(`  Energy:      ${c.energy}/100`, 'system');
        this.output(`  Hunger:      ${c.hunger}/100`, 'system');
        this.output('');
        this.output('SKILLS:', 'description');
        this.output(`  Intelligence:  ${c.intelligence}/100`, 'system');
        this.output(`  Charisma:      ${c.charisma}/100`, 'system');
        this.output(`  Strength:      ${c.strength}/100`, 'system');
        this.output(`  Business:      ${c.businessSkill}/100`, 'system');
        this.output('');
        this.output('FINANCIAL:', 'description');
        this.output(`  Cash:        $${c.money}`, 'system');
        this.output(
            `  Businesses:  ${gameState.flags.ownsCafe ? 'Coffee Bean Café' : 'None'}`,
            'system'
        );
    }

    showInventory() {
        this.output('INVENTORY:', 'description');
        gameState.inventory.forEach(item => {
            this.output(`  • ${item}`, 'system');
        });
    }

    checkRandomEvents() {
        const config = dataLoader.getConfig();
        if (
            Math.random() < config.game.randomEventChance &&
            gameState.character.day > config.game.minDayForEvents
        ) {
            this.triggerRandomEvent();
        }
    }

    triggerRandomEvent() {
        const eventsData = dataLoader.getEvents();
        const events = eventsData.events.map(event => ({
            title: event.title,
            text: event.text,
            effect: () => {
                if (event.effect.type === 'money') {
                    this.modifyMoney(event.effect.value);
                } else if (event.effect.type === 'intelligence') {
                    gameState.character.intelligence += event.effect.value;
                } else if (event.effect.type === 'strength') {
                    gameState.character.strength += event.effect.value;
                } else if (event.effect.type === 'charisma') {
                    gameState.character.charisma += event.effect.value;
                } else if (event.effect.type === 'businessSkill') {
                    gameState.character.businessSkill += event.effect.value;
                }
            }
        }));

        const event = events[Math.floor(Math.random() * events.length)];
        this.output('');
        this.output('═════════════════════════════════════', 'event');
        this.output(event.title, 'success');
        this.output(event.text, 'description');
        this.output('═════════════════════════════════════', 'event');
        event.effect();
    }

    saveGame() {
        const saveData = JSON.stringify(gameState);
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lifeparser_save.json';
        a.click();
        this.output('Game saved! Download the file to load later.', 'success');
    }

    loadGame() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const loaded = JSON.parse(event.target.result);
                    Object.assign(gameState, loaded);
                    this.updateUI();
                    this.output('Game loaded successfully!', 'success');
                    this.describeLocation();
                } catch (err) {
                    this.output('Failed to load save file.', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // UTILITY METHODS
    advanceTime(minutes) {
        gameState.character.minute += minutes;

        while (gameState.character.minute >= 60) {
            gameState.character.minute -= 60;
            gameState.character.hour += 1;
        }

        while (gameState.character.hour >= 24) {
            gameState.character.hour -= 24;
            gameState.character.day += 1;

            if (gameState.flags.ownsCafe) {
                const config = dataLoader.getConfig();
                this.modifyMoney(config.prices.cafeRevenue);
                this.output(
                    `Your café generated $${config.prices.cafeRevenue} in revenue today!`,
                    'success'
                );
            }
        }

        const hoursPassed = Math.floor(minutes / 60);
        this.modifyEnergy(-hoursPassed * 2);
        this.modifyHunger(hoursPassed * 3);
    }

    formatTime() {
        const hour = gameState.character.hour;
        const minute = gameState.character.minute;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    modifyMoney(amount) {
        gameState.character.money += amount;
        gameState.character.money = Math.max(0, gameState.character.money);
    }

    modifyEnergy(amount) {
        gameState.character.energy += amount;
        gameState.character.energy = Math.max(0, Math.min(100, gameState.character.energy));
    }

    modifyHunger(amount) {
        gameState.character.hunger += amount;
        gameState.character.hunger = Math.max(0, Math.min(100, gameState.character.hunger));

        if (gameState.character.hunger >= 80) {
            this.modifyHealth(-5);
        }
    }

    modifyHealth(amount) {
        gameState.character.health += amount;
        gameState.character.health = Math.max(0, Math.min(100, gameState.character.health));
    }

    output(text, type = 'description') {
        const div = document.createElement('div');
        div.className = `output-text ${type}`;
        div.textContent = text;
        this.outputElement.appendChild(div);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    updateUI() {
        const c = gameState.character;
        document.getElementById('day').textContent = c.day;
        document.getElementById('time').textContent = this.formatTime();
        document.getElementById('money').textContent = `$${c.money}`;

        const healthEl = document.getElementById('health');
        healthEl.textContent = c.health;
        healthEl.className = 'stat-value';
        if (c.health < 30) healthEl.classList.add('error');
        else if (c.health < 60) healthEl.classList.add('warning');

        const energyEl = document.getElementById('energy');
        energyEl.textContent = c.energy;
        energyEl.className = 'stat-value';
        if (c.energy < 30) energyEl.classList.add('error');
        else if (c.energy < 60) energyEl.classList.add('warning');

        const hungerEl = document.getElementById('hunger');
        hungerEl.textContent = c.hunger;
        hungerEl.className = 'stat-value';
        if (c.hunger > 70) hungerEl.classList.add('error');
        else if (c.hunger > 50) hungerEl.classList.add('warning');
    }
}
