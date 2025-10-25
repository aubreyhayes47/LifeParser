/**
 * Game Engine
 * Main game logic and command processing
 */

import {
    gameState,
    initializeGameState,
    saveGameState,
    loadGameState,
    hasSavedGame,
    getSaveTimestamp
} from './gameState.js';
import { locations } from './locations.js';
import { NLPParser } from './parser.js';
import { dataLoader } from './dataLoader.js';

// Constants for game mechanics
const ENERGY_PER_HOUR = 3; // Energy cost per hour of work
const HUNGER_PER_HOUR = 2; // Hunger increase per hour of work

// Skill name mapping for display
const SKILL_DISPLAY_NAMES = {
    health: 'Health',
    energy: 'Energy',
    hunger: 'Hunger',
    intelligence: 'Intelligence',
    charisma: 'Charisma',
    strength: 'Strength',
    businessSkill: 'Business Skill'
};

export class GameEngine {
    constructor() {
        this.parser = new NLPParser();
        this.outputElement = document.getElementById('output-container');
        this.inputElement = document.getElementById('command-input');
    }

    /**
     * Format skill name for display
     * @param {string} skillName - Internal skill name
     * @returns {string} Formatted skill name
     */
    formatSkillName(skillName) {
        if (!skillName || typeof skillName !== 'string') {
            return 'Unknown';
        }
        return SKILL_DISPLAY_NAMES[skillName] || skillName.charAt(0).toUpperCase() + skillName.slice(1);
    }

    init() {
        // Try to load saved game first
        if (hasSavedGame()) {
            const success = loadGameState();
            if (success) {
                // Migrate legacy job data if needed
                this.migrateLegacyJob();
                
                const timestamp = getSaveTimestamp();
                const date = timestamp ? new Date(timestamp).toLocaleString() : 'unknown time';
                this.output('═══════════════════════════════════════════════════', 'system');
                this.output('SAVE GAME LOADED', 'success');
                this.output(`Last saved: ${date}`, 'system');
                this.output('═══════════════════════════════════════════════════', 'system');
                this.output('');
                this.updateUI();
                this.describeLocation();
                return;
            }
        }

        // No saved game or load failed, start new game
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
            case 'promote':
                this.handlePromote();
                break;
            case 'careerinfo':
                this.showCareerInfo();
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
            case 'jobs':
                this.showJobs();
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

        // Auto-save after each command
        this.autoSave();
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
        const npcKey = Object.keys(npcs).find(key => key.includes(target) || target.includes(key));

        if (npcKey && npcs[npcKey] && npcs[npcKey].dialogues) {
            const npc = npcs[npcKey];
            
            // Get relationship level and select appropriate dialogue
            const relationshipLevel = this.getRelationshipLevel(npcKey);
            const dialogue = npc.dialogues[relationshipLevel] || npc.dialogues.default;
            
            dialogue.forEach(line => {
                this.output(line, 'description');
            });

            // Improve relationship slightly when talking
            const relationshipChange = 2;
            const newRelationship = this.modifyRelationship(npcKey, relationshipChange);
            
            // Show relationship change if significant
            if (Math.abs(newRelationship) >= 30 && Math.abs(newRelationship - relationshipChange) < 30) {
                if (newRelationship >= 30) {
                    this.output(`Your relationship with ${npc.name} has improved significantly!`, 'success');
                } else if (newRelationship <= -30) {
                    this.output(`Your relationship with ${npc.name} has deteriorated.`, 'error');
                }
            }
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

        // Special case: Gym workout (not a job)
        if (loc === 'gym' && !gameState.flags.hasJob && !gameState.careerPath) {
            // Apply relationship-based pricing
            const relationship = this.getRelationship('trainer');
            let gymPrice = config.prices.gymSession;
            
            if (relationship >= 30) {
                // Good relationship: reduced price ($15)
                gymPrice = 15;
            }
            
            if (gameState.character.money < gymPrice) {
                this.output(
                    `You don't have enough money for a gym session ($${gymPrice}).`,
                    'error'
                );
                return;
            }

            this.modifyMoney(-gymPrice);
            this.modifyEnergy(-30);
            this.modifyHunger(20);
            gameState.character.strength += 2;
            this.advanceTime(60);

            this.output(
                'You hit the weights hard. Your muscles burn, but you feel stronger!',
                'success'
            );
            this.output(
                `Strength +2, Energy -30, $${gymPrice} spent${relationship >= 30 ? ' (Discounted!)' : ''}`,
                'system'
            );
            return;
        }

        // Check if player has a job
        if (!gameState.flags.hasJob || !gameState.careerPath) {
            this.output("You need to apply for a job first. Try 'apply for job' at various locations.", 'error');
            return;
        }

        // Get current career level data
        const currentLevel = this.getCurrentCareerLevel();
        if (!currentLevel) {
            this.output("Error: Your job data is missing. Please apply for a job again.", 'error');
            gameState.flags.hasJob = false;
            gameState.careerPath = null;
            return;
        }

        // Check if player is at the right location for their job
        if (loc !== currentLevel.location) {
            this.output(
                `You need to go to ${currentLevel.location} to work as a ${gameState.careerPath.title}.`,
                'error'
            );
            return;
        }

        // Check if player has enough energy
        const energyRequired = Math.floor(currentLevel.hoursPerShift * ENERGY_PER_HOUR);
        if (gameState.character.energy < energyRequired) {
            this.output(
                `You're too tired to work. You need at least ${energyRequired} energy for a ${currentLevel.hoursPerShift}-hour shift.`,
                'error'
            );
            this.output("Try sleeping to restore your energy.", 'system');
            return;
        }

        // Calculate earnings (wage is per shift)
        const earnings = currentLevel.wage;

        // Apply work effects
        this.modifyMoney(earnings);
        this.modifyEnergy(-energyRequired);
        this.modifyHunger(Math.floor(currentLevel.hoursPerShift * HUNGER_PER_HOUR));
        this.advanceTime(currentLevel.hoursPerShift * 60);

        // Apply skill gains and track experience
        const skillMessages = [];
        if (currentLevel.skillGains) {
            Object.entries(currentLevel.skillGains).forEach(([skill, gain]) => {
                if (gameState.character[skill] !== undefined) {
                    gameState.character[skill] += gain;
                    gameState.character[skill] = Math.min(100, gameState.character[skill]);
                    skillMessages.push(
                        `${this.formatSkillName(skill)} +${gain.toFixed(1)}`
                    );
                }
            });
        }

        // Add experience points (10 per shift)
        const experienceGained = 10;
        gameState.careerPath.experience += experienceGained;

        // Output success message
        this.output(
            `You complete a ${currentLevel.hoursPerShift}-hour shift as a ${gameState.careerPath.title}.`,
            'success'
        );
        this.output(`Earned $${earnings}`, 'system');

        if (skillMessages.length > 0) {
            this.output(skillMessages.join(', '), 'system');
        }

        this.output(`Experience +${experienceGained} (Total: ${gameState.careerPath.experience})`, 'system');

        // Check if ready for promotion
        if (currentLevel.experienceForNext && gameState.careerPath.experience >= currentLevel.experienceForNext) {
            const promotionCheck = this.canPromote();
            if (promotionCheck.canPromote) {
                this.output('', 'system');
                this.output('═════════════════════════════════════', 'event');
                this.output('PROMOTION AVAILABLE!', 'success');
                this.output(`You're ready to advance to the next level!`, 'description');
                this.output("Type 'promote' to request your promotion.", 'system');
                this.output('═════════════════════════════════════', 'event');
            } else if (promotionCheck.missing.length > 0) {
                this.output('', 'system');
                this.output('You have enough experience for promotion, but need to improve:', 'system');
                promotionCheck.missing.forEach(req => {
                    this.output(`  • ${req}`, 'system');
                });
            }
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

        // Calculate interest rate based on relationship with loan officer
        const relationship = this.getRelationship('loan_officer');
        let interestRate = config.loans.interestRate;
        
        if (relationship >= 30) {
            // Good relationship: reduced rate (5%)
            interestRate = 0.05;
        } else if (relationship <= -30) {
            // Poor relationship: increased rate (10%)
            interestRate = 0.10;
        }

        this.modifyMoney(amount);
        this.output(`Loan approved! You receive $${amount}.`, 'success');
        this.output(
            `Interest rate: ${(interestRate * 100).toFixed(1)}% ${relationship >= 30 ? '(Reduced due to good relationship!)' : relationship <= -30 ? '(Increased due to poor relationship)' : ''}`,
            relationship >= 30 ? 'success' : relationship <= -30 ? 'error' : 'system'
        );
        this.output(
            'Remember: Invest wisely!',
            'system'
        );
        this.advanceTime(30);
    }

    handleApply() {
        // Find career paths available at current location
        const availableCareers = this.getAvailableCareersAtLocation();

        if (availableCareers.length === 0) {
            this.output('There are no job openings here.', 'error');
            return;
        }

        if (gameState.flags.hasJob && gameState.careerPath) {
            this.output(`You already have a job as a ${gameState.careerPath.title}.`, 'error');
            this.output("You'll need to quit your current job before applying for a new one.", 'system');
            return;
        }

        // Check each available career for requirements
        let qualifiedCareer = null;
        const failedRequirements = {};

        for (const [pathId, path, entryLevel] of availableCareers) {
            const requirementCheck = this.checkRequirements(entryLevel.requirements || {});
            if (requirementCheck.met) {
                qualifiedCareer = [pathId, path, entryLevel];
                break;
            } else {
                failedRequirements[pathId] = requirementCheck.missing;
            }
        }

        if (qualifiedCareer) {
            const [pathId, path, entryLevel] = qualifiedCareer;
            gameState.flags.hasJob = true;
            gameState.careerPath = {
                pathId: pathId,
                level: entryLevel.level,
                title: entryLevel.title,
                experience: 0
            };

            this.output('The hiring manager smiles and shakes your hand.', 'success');
            this.output(
                `"Welcome aboard as our new ${entryLevel.title}! You can work shifts by typing 'work'. We pay $${entryLevel.wage} per ${entryLevel.hoursPerShift}-hour shift."`,
                'description'
            );
            this.output(`You've started on the ${path.name} career track!`, 'system');
            this.advanceTime(15);
        } else {
            // Show why player didn't qualify
            this.output("Unfortunately, you don't meet the requirements for the available positions.", 'error');
            this.output('', 'system');
            this.output('AVAILABLE POSITIONS:', 'description');

            for (const [pathId, path, entryLevel] of availableCareers) {
                this.output(`\n${entryLevel.title} (${path.name}) - $${entryLevel.wage}/shift`, 'system');
                this.output(`  ${entryLevel.description}`, 'description');

                if (failedRequirements[pathId] && failedRequirements[pathId].length > 0) {
                    this.output('  Missing requirements:', 'error');
                    failedRequirements[pathId].forEach(req => {
                        this.output(`    • ${req}`, 'error');
                    });
                }
            }
        }
    }

    handleBuy(command) {
        const target = command.target;
        const config = dataLoader.getConfig();

        if (target && target.includes('cafe')) {
            // Check relationship with café owner
            const relationship = this.getRelationship('owner');
            let cafePrice = config.prices.cafePrice;
            
            // Good relationship gives a discount
            if (relationship >= 30) {
                cafePrice = 45000;
            } else if (relationship < 0) {
                this.output("The café owner doesn't trust you enough to sell to you.", 'error');
                this.output("Try building a better relationship with them first.", 'system');
                return;
            }
            
            if (gameState.character.money < cafePrice) {
                this.output(
                    `You need $${cafePrice} to buy the café. Keep working and saving!`,
                    'error'
                );
                return;
            }

            this.modifyMoney(-cafePrice);
            gameState.flags.ownsCafe = true;

            this.output('═════════════════════════════════════', 'event');
            this.output('BUSINESS ACQUIRED!', 'success');
            this.output('You are now the proud owner of Coffee Bean Café!', 'description');
            if (relationship >= 30) {
                this.output(
                    `Thanks to your good relationship, you got it for $${cafePrice} instead of $${config.prices.cafePrice}!`,
                    'success'
                );
            }
            this.output(
                `The café will generate passive income of $${config.prices.cafeRevenue}/day.`,
                'description'
            );
            this.output('═════════════════════════════════════', 'event');
        } else {
            this.output("You can't buy that right now.", 'error');
        }
    }

    handlePromote() {
        if (!gameState.careerPath) {
            this.output("You don't have a job to get promoted in.", 'error');
            this.output("Try 'apply for job' at various locations first.", 'system');
            return;
        }

        const promotionCheck = this.canPromote();
        
        if (!promotionCheck.canPromote) {
            this.output("You're not ready for promotion yet.", 'error');
            this.output('', 'system');
            
            if (promotionCheck.missing.includes('Already at max level')) {
                this.output("You're already at the highest level in your career path!", 'system');
                this.output("Consider exploring other opportunities or starting a business.", 'system');
            } else {
                this.output('Requirements for promotion:', 'system');
                promotionCheck.missing.forEach(req => {
                    this.output(`  • ${req}`, 'error');
                });
            }
            return;
        }

        // Promote the player
        const oldTitle = gameState.careerPath.title;
        const promoted = this.promotePlayer();
        
        if (promoted) {
            const newLevel = this.getCurrentCareerLevel();
            
            this.output('═════════════════════════════════════', 'event');
            this.output('PROMOTION!', 'success');
            this.output(`Congratulations! You've been promoted from ${oldTitle} to ${newLevel.title}!`, 'description');
            this.output(`New wage: $${newLevel.wage} per ${newLevel.hoursPerShift}-hour shift`, 'system');
            this.output('═════════════════════════════════════', 'event');
            this.advanceTime(30);
        } else {
            this.output("Promotion failed. This shouldn't happen - please try again.", 'error');
        }
    }

    showCareerInfo() {
        if (!gameState.careerPath) {
            this.output("You don't currently have a career.", 'error');
            this.output("Type 'jobs' to see available careers, or 'apply for job' at various locations.", 'system');
            return;
        }

        const path = this.getCareerPath(gameState.careerPath.pathId);
        const currentLevel = this.getCurrentCareerLevel();
        const nextLevel = this.getNextCareerLevel();

        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('YOUR CAREER PATH', 'location');
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output(`Path: ${path.name}`, 'description');
        this.output(`Current Position: ${gameState.careerPath.title} (Level ${gameState.careerPath.level})`, 'description');
        this.output(`Location: ${currentLevel.location}`, 'system');
        this.output(`Wage: $${currentLevel.wage} per ${currentLevel.hoursPerShift}h shift`, 'system');
        this.output('', 'system');
        
        // Show experience progress
        if (currentLevel.experienceForNext) {
            const progress = Math.floor((gameState.careerPath.experience / currentLevel.experienceForNext) * 100);
            this.output(`Experience: ${gameState.careerPath.experience}/${currentLevel.experienceForNext} (${progress}%)`, 'system');
        } else {
            this.output(`Experience: ${gameState.careerPath.experience} (Max level reached)`, 'system');
        }

        // Show next level if available
        if (nextLevel) {
            this.output('', 'system');
            this.output('NEXT LEVEL:', 'description');
            this.output(`${nextLevel.title} (Level ${nextLevel.level})`, 'system');
            this.output(`Wage: $${nextLevel.wage} per ${nextLevel.hoursPerShift}h shift`, 'system');
            
            if (nextLevel.requirements) {
                this.output('Requirements:', 'system');
                Object.entries(nextLevel.requirements).forEach(([skill, minValue]) => {
                    const currentValue = gameState.character[skill] || 0;
                    const met = currentValue >= minValue;
                    this.output(
                        `  • ${this.formatSkillName(skill)}: ${currentValue}/${minValue}${met ? ' ✓' : ''}`,
                        met ? 'success' : 'error'
                    );
                });
            }

            const promotionCheck = this.canPromote();
            if (promotionCheck.canPromote) {
                this.output('', 'system');
                this.output("✓ You're ready for promotion! Type 'promote' to advance.", 'success');
            } else if (gameState.careerPath.experience >= currentLevel.experienceForNext) {
                this.output('', 'system');
                this.output('You have enough experience but need to meet the skill requirements.', 'system');
            }
        } else {
            this.output('', 'system');
            this.output("You're at the maximum level for this career path!", 'success');
        }

        // Show career path progression
        this.output('', 'system');
        this.output('CAREER PROGRESSION:', 'description');
        path.levels.forEach(level => {
            const isCurrent = level.level === gameState.careerPath.level;
            const marker = isCurrent ? '→ ' : '  ';
            const style = isCurrent ? 'success' : 'system';
            this.output(`${marker}Level ${level.level}: ${level.title} ($${level.wage}/shift)`, style);
        });
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
        this.output('  • apply for job - Get hired (check requirements first)', 'system');
        this.output('  • promote - Request promotion to next level', 'system');
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
        this.output('  • jobs - View all available careers and requirements', 'system');
        this.output('  • career - View detailed career path information', 'system');
        this.output('  • check [thing] - Examine something', 'system');
        this.output('  • inventory - View items', 'system');
        this.output('  • save - Save game to browser storage', 'system');
        this.output('  • load - Load saved game from browser storage', 'system');
        this.output('', 'system');
        this.output('Note: Game auto-saves after every action.', 'system');
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
        this.output('CAREER:', 'description');
        if (gameState.careerPath) {
            const currentLevel = this.getCurrentCareerLevel();
            const path = this.getCareerPath(gameState.careerPath.pathId);
            this.output(
                `  Current Job:  ${gameState.careerPath.title} (Level ${gameState.careerPath.level})`,
                'system'
            );
            this.output(`  Career Path:  ${path.name}`, 'system');
            this.output(`  Location:     ${currentLevel.location}`, 'system');
            this.output(`  Wage:         $${currentLevel.wage} per ${currentLevel.hoursPerShift}h shift`, 'system');
            this.output(`  Experience:   ${gameState.careerPath.experience}${currentLevel.experienceForNext ? `/${currentLevel.experienceForNext}` : ' (Max level)'}`, 'system');
        } else {
            this.output('  Current Job:  Unemployed', 'system');
            this.output("  Type 'jobs' to see available careers", 'system');
        }
        this.output('');
        this.output('FINANCIAL:', 'description');
        this.output(`  Cash:        $${c.money}`, 'system');
        this.output(
            `  Businesses:  ${gameState.flags.ownsCafe ? 'Coffee Bean Café' : 'None'}`,
            'system'
        );
        this.output('');
        
        // Display relationships
        const npcs = dataLoader.getNPCs();
        const relationshipEntries = Object.entries(gameState.relationships)
            .filter(([_id, value]) => value !== 0)
            .sort(([_a, valA], [_b, valB]) => valB - valA);
        
        if (relationshipEntries.length > 0) {
            this.output('RELATIONSHIPS:', 'description');
            relationshipEntries.forEach(([npcId, value]) => {
                const npc = npcs[npcId];
                const npcName = npc ? npc.name : npcId;
                const level = value >= 30 ? '(Good)' : value <= -30 ? '(Poor)' : '(Neutral)';
                const color = value >= 30 ? 'success' : value <= -30 ? 'error' : 'system';
                this.output(`  ${npcName}: ${value}/100 ${level}`, color);
            });
        } else {
            this.output('RELATIONSHIPS:', 'description');
            this.output('  No significant relationships yet.', 'system');
            this.output('  Talk to NPCs to build relationships!', 'system');
        }
    }

    showInventory() {
        this.output('INVENTORY:', 'description');
        gameState.inventory.forEach(item => {
            this.output(`  • ${item}`, 'system');
        });
    }

    showJobs() {
        const careers = dataLoader.getCareers();
        const loc = gameState.currentLocation;

        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('AVAILABLE CAREERS', 'location');
        this.output('═══════════════════════════════════════════════════', 'system');
        this.output('');

        // Find career paths at current location
        const localCareers = this.getAvailableCareersAtLocation();

        if (localCareers.length > 0) {
            this.output('AT YOUR CURRENT LOCATION:', 'description');
            localCareers.forEach(([_pathId, path, entryLevel]) => {
                const requirementCheck = this.checkRequirements(entryLevel.requirements || {});
                const qualifies = requirementCheck.met ? '✓' : '✗';

                this.output(
                    `\n${qualifies} ${entryLevel.title} (${path.name}) - $${entryLevel.wage} per ${entryLevel.hoursPerShift}h shift`,
                    requirementCheck.met ? 'success' : 'system'
                );
                this.output(`  ${entryLevel.description}`, 'description');
                this.output(`  Career Path: ${path.levels.length} levels`, 'system');

                if (entryLevel.requirements) {
                    const reqList = [];
                    Object.entries(entryLevel.requirements).forEach(([skill, minValue]) => {
                        const currentValue = gameState.character[skill] || 0;
                        const met = currentValue >= minValue;
                        reqList.push(
                            `${this.formatSkillName(skill)}: ${currentValue}/${minValue}${met ? ' ✓' : ''}`
                        );
                    });
                    this.output(`  Requirements: ${reqList.join(', ')}`, 'system');
                }

                if (entryLevel.skillGains) {
                    const gains = Object.entries(entryLevel.skillGains)
                        .map(([skill, gain]) => `${this.formatSkillName(skill)} +${gain}`)
                        .join(', ');
                    this.output(`  Skill Gains: ${gains}`, 'system');
                }

                // Show path progression
                const pathNames = path.levels.map(l => l.title).join(' → ');
                this.output(`  Progression: ${pathNames}`, 'system');
            });
            this.output('');
        }

        // Show all other career paths
        const otherCareers = Object.entries(careers).filter(
            ([_id, path]) => path.entryLocation && path.entryLocation !== loc
        );

        if (otherCareers.length > 0) {
            this.output('OTHER CAREER PATHS:', 'description');
            otherCareers.forEach(([_pathId, path]) => {
                if (path.levels && path.levels.length > 0) {
                    const entryLevel = path.levels[0];
                    const requirementCheck = this.checkRequirements(entryLevel.requirements || {});
                    const qualifies = requirementCheck.met ? '✓' : '✗';

                    this.output(
                        `${qualifies} ${path.name} at ${path.entryLocation} - Starting wage: $${entryLevel.wage}/shift`,
                        'system'
                    );
                }
            });
            this.output('');
        }

        this.output("Type 'apply for job' at a location to apply for available positions.", 'system');
        this.output("Type 'career' to view detailed information about your current career path.", 'system');
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
        const success = saveGameState();
        if (success) {
            const timestamp = new Date().toLocaleString();
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('GAME SAVED', 'success');
            this.output(`Saved at: ${timestamp}`, 'system');
            this.output(
                'Your progress has been automatically saved to your browser.',
                'description'
            );
            this.output('═══════════════════════════════════════════════════', 'system');
        } else {
            this.output('Failed to save game. Please try again.', 'error');
        }
    }

    loadGame() {
        if (!hasSavedGame()) {
            this.output('No saved game found.', 'error');
            return;
        }

        const success = loadGameState();
        if (success) {
            const timestamp = getSaveTimestamp();
            const date = timestamp ? new Date(timestamp).toLocaleString() : 'unknown time';
            this.updateUI();
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('GAME LOADED', 'success');
            this.output(`Loaded save from: ${date}`, 'system');
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('');
            this.describeLocation();
        } else {
            this.output('Failed to load game. Save file may be corrupted.', 'error');
        }
    }

    // UTILITY METHODS
    autoSave() {
        saveGameState();
    }

    /**
     * Generic requirements checking function
     * @param {Object} requirements - Requirements object with stats, items, flags, etc.
     * @returns {Object} { met: boolean, missing: Array<string> }
     */
    checkRequirements(requirements) {
        if (!requirements) {
            return { met: true, missing: [] };
        }

        const missing = [];

        // Check stat requirements
        if (requirements.stats) {
            Object.entries(requirements.stats).forEach(([stat, minValue]) => {
                if (gameState.character[stat] < minValue) {
                    missing.push(
                        `${this.formatSkillName(stat)}: ${gameState.character[stat]}/${minValue}`
                    );
                }
            });
        }

        // Legacy support: direct skill requirements (for backward compatibility with careers.json)
        // Only check properties that are skills (listed in SKILL_DISPLAY_NAMES)
        const validSkills = Object.keys(SKILL_DISPLAY_NAMES);
        validSkills.forEach(skill => {
            if (requirements[skill] && !requirements.stats && typeof gameState.character[skill] === 'number') {
                if (gameState.character[skill] < requirements[skill]) {
                    missing.push(
                        `${this.formatSkillName(skill)}: ${gameState.character[skill]}/${requirements[skill]}`
                    );
                }
            }
        });

        // Check item requirements
        if (requirements.items) {
            requirements.items.forEach(item => {
                if (!gameState.inventory.includes(item)) {
                    missing.push(`Item: ${item}`);
                }
            });
        }

        // Check flag requirements
        if (requirements.flags) {
            Object.entries(requirements.flags).forEach(([flag, value]) => {
                if (gameState.flags[flag] !== value) {
                    missing.push(`Flag: ${flag} must be ${value}`);
                }
            });
        }

        return {
            met: missing.length === 0,
            missing: missing
        };
    }

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

    /**
     * Modify relationship value with an NPC
     * @param {string} npcId - NPC identifier
     * @param {number} amount - Amount to change (positive or negative)
     * @returns {number} New relationship value
     */
    modifyRelationship(npcId, amount) {
        const npcs = dataLoader.getNPCs();
        
        // Initialize relationship if not exists
        if (gameState.relationships[npcId] === undefined) {
            const npc = npcs[npcId];
            gameState.relationships[npcId] = npc ? (npc.initialRelationship || 0) : 0;
        }

        // Modify and clamp between -100 and 100
        gameState.relationships[npcId] += amount;
        gameState.relationships[npcId] = Math.max(-100, Math.min(100, gameState.relationships[npcId]));

        return gameState.relationships[npcId];
    }

    /**
     * Get relationship value with an NPC
     * @param {string} npcId - NPC identifier
     * @returns {number} Relationship value (-100 to 100)
     */
    getRelationship(npcId) {
        const npcs = dataLoader.getNPCs();
        
        if (gameState.relationships[npcId] === undefined) {
            const npc = npcs[npcId];
            return npc ? (npc.initialRelationship || 0) : 0;
        }
        
        return gameState.relationships[npcId];
    }

    /**
     * Get relationship level as a string
     * @param {string} npcId - NPC identifier
     * @returns {string} Relationship level: 'high', 'default', or 'low'
     */
    getRelationshipLevel(npcId) {
        const value = this.getRelationship(npcId);
        if (value >= 30) return 'high';
        if (value <= -30) return 'low';
        return 'default';
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

    // CAREER SYSTEM HELPER METHODS

    /**
     * Get current career level data
     * @returns {Object|null} Current level data or null if no job
     */
    getCurrentCareerLevel() {
        if (!gameState.careerPath) return null;
        
        const careers = dataLoader.getCareers();
        const path = careers[gameState.careerPath.pathId];
        if (!path || !path.levels) return null;
        
        return path.levels.find(level => level.level === gameState.careerPath.level);
    }

    /**
     * Get career path data
     * @param {string} pathId - Career path ID
     * @returns {Object|null} Career path data or null
     */
    getCareerPath(pathId) {
        const careers = dataLoader.getCareers();
        return careers[pathId] || null;
    }

    /**
     * Get next career level in current path
     * @returns {Object|null} Next level data or null if at max level
     */
    getNextCareerLevel() {
        if (!gameState.careerPath) return null;
        
        const path = this.getCareerPath(gameState.careerPath.pathId);
        if (!path || !path.levels) return null;
        
        const nextLevel = gameState.careerPath.level + 1;
        return path.levels.find(level => level.level === nextLevel) || null;
    }

    /**
     * Check if player can be promoted to next level
     * @returns {Object} { canPromote: boolean, missing: Array<string> }
     */
    canPromote() {
        const nextLevel = this.getNextCareerLevel();
        if (!nextLevel) {
            return { canPromote: false, missing: ['Already at max level'] };
        }

        const currentLevel = this.getCurrentCareerLevel();
        if (!currentLevel) {
            return { canPromote: false, missing: ['No current job'] };
        }

        // Check if enough experience
        if (currentLevel.experienceForNext && gameState.careerPath.experience < currentLevel.experienceForNext) {
            return { 
                canPromote: false, 
                missing: [`Need ${currentLevel.experienceForNext - gameState.careerPath.experience} more experience`]
            };
        }

        // Check requirements for next level
        const requirementCheck = this.checkRequirements(nextLevel.requirements || {});
        return {
            canPromote: requirementCheck.met,
            missing: requirementCheck.missing
        };
    }

    /**
     * Promote player to next level in career path
     * @returns {boolean} True if promoted successfully
     */
    promotePlayer() {
        const promotionCheck = this.canPromote();
        if (!promotionCheck.canPromote) {
            return false;
        }

        const nextLevel = this.getNextCareerLevel();
        gameState.careerPath.level = nextLevel.level;
        gameState.careerPath.title = nextLevel.title;
        gameState.careerPath.experience = 0; // Reset experience for new level

        return true;
    }

    /**
     * Get available career paths at current location
     * @returns {Array} Array of [pathId, path, level] for entry-level positions
     */
    getAvailableCareersAtLocation() {
        const loc = gameState.currentLocation;
        const careers = dataLoader.getCareers();
        const available = [];

        Object.entries(careers).forEach(([pathId, path]) => {
            if (path.entryLocation === loc && path.levels && path.levels.length > 0) {
                available.push([pathId, path, path.levels[0]]);
            }
        });

        return available;
    }

    /**
     * Migrate legacy currentJob to new careerPath structure
     */
    migrateLegacyJob() {
        // If we have a currentJob but no careerPath, migrate it
        if (gameState.currentJob && !gameState.careerPath) {
            const careers = dataLoader.getCareers();
            
            // Map legacy job IDs to new career paths
            const legacyMapping = {
                'barista': { path: 'cafe_path', level: 1 },
                'personal_trainer': { path: 'fitness_path', level: 1 },
                'bank_teller': { path: 'banking_path', level: 1 },
                'bookstore_clerk': { path: 'bookstore_path', level: 1 },
                'restaurant_server': { path: 'restaurant_path', level: 1 },
                'tech_support': { path: 'tech_path', level: 1 },
                'park_maintenance': { path: 'maintenance_path', level: 1 },
                'business_consultant': { path: 'business_path', level: 2 }
            };

            const mapping = legacyMapping[gameState.currentJob];
            if (mapping) {
                const path = careers[mapping.path];
                if (path && path.levels) {
                    const level = path.levels.find(l => l.level === mapping.level);
                    if (level) {
                        gameState.careerPath = {
                            pathId: mapping.path,
                            level: mapping.level,
                            title: level.title,
                            experience: 0
                        };
                    }
                }
            }
            // Clear legacy field
            gameState.currentJob = null;
        }
    }
}
