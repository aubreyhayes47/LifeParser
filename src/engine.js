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
import { isNPCAvailable, getNPCScheduleDescription, getNextAvailableTime } from './npcSchedule.js';
import {
    createBusiness,
    processDailyBusiness,
    setBusinessPrice,
    upgradeQuality,
    setMarketingLevel,
    setStaffCount,
    getBusinessPerformance,
    getBusinessRecommendations
} from './business.js';

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

        // Check for active dialogue context first
        if (gameState.pendingEvent) {
            this.handleDialogueResponse(input);
            return;
        }

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
            case 'schedule':
                this.handleSchedule(command);
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
            // Business management commands
            case 'setprice':
                this.handleSetPrice(command);
                break;
            case 'hirestaff':
                this.handleHireStaff();
                break;
            case 'firestaff':
                this.handleFireStaff();
                break;
            case 'setstaff':
                this.handleSetStaff(command);
                break;
            case 'setmarketing':
                this.handleSetMarketing(command);
                break;
            case 'upgradequality':
                this.handleUpgradeQuality();
                break;
            case 'runmarketing':
                this.handleRunMarketing();
                break;
            case 'businessinfo':
                this.showBusinessInfo();
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

    // ==================== DIALOGUE STATE MACHINE ====================

    /**
     * Handle user input when in a dialogue state
     * @param {string} input - User input
     */
    handleDialogueResponse(input) {
        const trimmedInput = input.trim().toLowerCase();

        // Allow cancellation from any dialogue state
        if (trimmedInput === 'cancel' || trimmedInput === 'quit' || trimmedInput === 'exit') {
            this.clearDialogueState();
            this.output('Action cancelled.', 'system');
            this.updateUI();
            return;
        }

        const event = gameState.pendingEvent;

        switch (event.type) {
            case 'incomplete_command':
                this.handleIncompleteCommand(input, event);
                break;
            case 'confirmation':
                this.handleConfirmation(input, event);
                break;
            case 'clarification':
                this.handleClarification(input, event);
                break;
            case 'yes_no':
                this.handleYesNo(input, event);
                break;
            default:
                this.output(`Unknown dialogue type: ${event.type}`, 'error');
                this.clearDialogueState();
        }

        this.updateUI();
        this.autoSave();
    }

    /**
     * Handle incomplete command dialogue
     * @param {string} input - User input providing missing information
     * @param {Object} event - The pending event object
     */
    handleIncompleteCommand(input, event) {
        const { action, missingEntity } = event.context;

        // Parse the provided entity
        const command = this.parser.parse(input);

        // Reconstruct complete command with missing information filled in
        const completeCommand = {
            action: action,
            [missingEntity]: command.target || input.trim()
        };

        // Copy any existing context
        if (event.context.existingData) {
            Object.assign(completeCommand, event.context.existingData);
        }

        this.clearDialogueState();

        // Execute the completed command using the switch statement
        this.executeCommand(completeCommand);
    }

    /**
     * Handle confirmation dialogue
     * @param {string} input - User's yes/no response
     * @param {Object} event - The pending event object
     */
    handleConfirmation(input, event) {
        const response = input.trim().toLowerCase();

        if (response === 'yes' || response === 'y') {
            const { action, details } = event.context;
            this.clearDialogueState();
            this.executeConfirmedAction(action, details);
        } else if (response === 'no' || response === 'n') {
            this.clearDialogueState();
            this.output('Action cancelled.', 'system');
        } else {
            this.output('Please answer yes or no.', 'error');
        }
    }

    /**
     * Handle clarification dialogue (selecting from multiple options)
     * @param {string} input - User's selection
     * @param {Object} event - The pending event object
     */
    handleClarification(input, event) {
        const { action, options } = event.context;
        const response = input.trim().toLowerCase();

        // Try to match number selection
        const numMatch = response.match(/^(\d+)$/);
        if (numMatch) {
            const index = parseInt(numMatch[1]) - 1;
            if (index >= 0 && index < options.length) {
                const selected = options[index];
                this.clearDialogueState();
                this.executeWithClarification(action, selected, event.context);
                return;
            }
        }

        // Try to match direct text selection
        const selected = options.find(
            opt => opt.toLowerCase() === response || response.includes(opt.toLowerCase())
        );

        if (selected) {
            this.clearDialogueState();
            this.executeWithClarification(action, selected, event.context);
        } else {
            this.output('Invalid selection. Please choose from the options above.', 'error');
        }
    }

    /**
     * Handle yes/no dialogue
     * @param {string} input - User's yes/no response
     * @param {Object} event - The pending event object
     */
    handleYesNo(input, event) {
        const response = input.trim().toLowerCase();

        if (response === 'yes' || response === 'y') {
            this.clearDialogueState();
            if (event.context.onConfirm) {
                this.executeYesNoCallback(event.context.onConfirm, event.context);
            }
        } else if (response === 'no' || response === 'n') {
            this.clearDialogueState();
            if (event.context.onCancel) {
                this.executeYesNoCallback(event.context.onCancel, event.context);
            } else {
                this.output('Action cancelled.', 'system');
            }
        } else {
            this.output('Please answer yes or no.', 'error');
        }
    }

    /**
     * Clear the current dialogue state
     */
    clearDialogueState() {
        gameState.pendingEvent = null;
    }

    /**
     * Set a new dialogue state
     * @param {string} type - Dialogue type (incomplete_command, confirmation, clarification, yes_no)
     * @param {Object} context - Context data for the dialogue
     * @param {string} prompt - Message to display to user
     */
    setDialogueState(type, context, prompt) {
        gameState.pendingEvent = {
            type: type,
            context: context,
            prompt: prompt
        };

        if (prompt) {
            this.output(prompt, 'system');
        }
    }

    /**
     * Execute a command object (used for completing incomplete commands)
     * @param {Object} command - Command object with action and entities
     */
    executeCommand(command) {
        switch (command.action) {
            case 'move':
                this.handleMovement(command);
                break;
            case 'talk':
                this.handleConversation(command);
                break;
            case 'buy':
                this.handleBuy(command);
                break;
            case 'loan':
                this.handleLoan(command);
                break;
            case 'eat':
                this.handleEat(command);
                break;
            default:
                this.output(`Cannot complete command: ${command.action}`, 'error');
        }
    }

    /**
     * Execute a confirmed action
     * @param {string} action - The action to execute
     * @param {Object} details - Action-specific details
     */
    executeConfirmedAction(action, details) {
        switch (action) {
            case 'buy':
                // Execute the buy without re-checking (already confirmed)
                this.performBuyAction(details);
                break;
            case 'loan':
                this.performLoanAction(details);
                break;
            case 'quit_job':
                this.performQuitJob();
                break;
            default:
                this.output(`Unknown confirmed action: ${action}`, 'error');
        }
    }

    /**
     * Execute command with clarified entity
     * @param {string} action - The action to execute
     * @param {string} selected - The clarified entity
     * @param {Object} context - Additional context from clarification
     */
    executeWithClarification(action, selected, context) {
        const command = {
            action: action,
            target: selected
        };

        // Add any additional context
        if (context.existingData) {
            Object.assign(command, context.existingData);
        }

        this.executeCommand(command);
    }

    /**
     * Execute yes/no callback
     * @param {string} callbackType - Type of callback to execute
     * @param {Object} context - Context containing callback data
     */
    executeYesNoCallback(callbackType, context) {
        switch (callbackType) {
            case 'apply_for_job':
                // Already checked requirements, just hire
                this.performApplyForJob(context.jobData);
                break;
            case 'promote':
                this.performPromotion();
                break;
            default:
                this.output(`Callback executed: ${callbackType}`, 'system');
        }
    }

    /**
     * Perform buy action (after confirmation)
     * @param {Object} details - Buy action details
     */
    performBuyAction(details) {
        const { target, cost, relationship } = details;
        const config = dataLoader.getConfig();

        if (gameState.character.money < cost) {
            this.output(`You don't have enough money. You need $${cost}.`, 'error');
            return;
        }

        // Execute the actual buy logic based on target
        if (target === 'cafe') {
            this.modifyMoney(-cost);

            const newBusiness = createBusiness('cafe', 'Coffee Bean Café', cost);
            gameState.businesses.push(newBusiness);
            gameState.flags.ownsCafe = true;

            this.output('═════════════════════════════════════', 'event');
            this.output('BUSINESS ACQUIRED!', 'success');
            this.output('You are now the proud owner of Coffee Bean Café!', 'description');
            if (relationship >= 30) {
                this.output(
                    `Thanks to your good relationship, you got it for $${cost} instead of $${config.prices.cafePrice}!`,
                    'success'
                );
            }
            this.output('', 'description');
            this.output('Your café is ready for business!', 'description');
            this.output(`Starting parameters:`, 'system');
            this.output(`  • Price Level: 100% (balanced)`, 'system');
            this.output(`  • Quality: 5/10 (average)`, 'system');
            this.output(`  • Marketing: 5/10 (average)`, 'system');
            this.output(`  • Staff: ${newBusiness.staff} employees`, 'system');
            this.output('', 'description');
            this.output("Manage your business with commands like:", 'system');
            this.output("  • 'business info' - View detailed business stats", 'system');
            this.output("  • 'set price to 120%' - Adjust pricing", 'system');
            this.output("  • 'upgrade quality' - Improve quality", 'system');
            this.output("  • 'set marketing to 7' - Adjust marketing", 'system');
            this.output("  • 'set staff to 3' - Adjust staffing", 'system');
            this.output('═════════════════════════════════════', 'event');
        }
    }

    /**
     * Perform loan action (after confirmation)
     * @param {Object} details - Loan details
     */
    performLoanAction(details) {
        const { amount, interestRate } = details;
        this.modifyMoney(amount);
        this.output(`Loan approved! You receive $${amount}.`, 'success');
        this.output(`Interest rate: ${(interestRate * 100).toFixed(1)}%`, 'system');
        this.output('Remember: Invest wisely!', 'system');
        this.advanceTime(30);
    }

    /**
     * Perform apply for job (after confirmation)
     * @param {Object} jobData - Job data
     */
    performApplyForJob(jobData) {
        const { pathId, path, entryLevel } = jobData;

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
    }

    /**
     * Perform promotion (after confirmation)
     */
    performPromotion() {
        const oldTitle = gameState.careerPath.title;
        const promoted = this.promotePlayer();

        if (promoted) {
            const newLevel = this.getCurrentCareerLevel();

            this.output('═════════════════════════════════════', 'event');
            this.output('PROMOTION!', 'success');
            this.output(
                `Congratulations! You've been promoted from ${oldTitle} to ${newLevel.title}!`,
                'description'
            );
            this.output(
                `New wage: $${newLevel.wage} per ${newLevel.hoursPerShift}-hour shift`,
                'system'
            );
            this.output('═════════════════════════════════════', 'event');
            this.advanceTime(30);
        } else {
            this.output("Promotion failed. This shouldn't happen - please try again.", 'error');
        }
    }

    /**
     * Perform quit job action
     */
    performQuitJob() {
        const oldTitle = gameState.careerPath ? gameState.careerPath.title : 'your job';
        gameState.flags.hasJob = false;
        gameState.careerPath = null;
        this.output(`You have quit your position as ${oldTitle}.`, 'system');
        this.output('You are now unemployed. Type "jobs" to see available careers.', 'system');
    }

    // ==================== END DIALOGUE STATE MACHINE ====================

    handleMovement(command) {
        let targetLocation = null;

        if (command.target) {
            targetLocation = this.parser.findClosestLocation(command.target);
        } else {
            // No target specified - prompt for it
            const currentLoc = locations[gameState.currentLocation];
            this.setDialogueState(
                'incomplete_command',
                {
                    action: 'move',
                    missingEntity: 'target'
                },
                `Where would you like to go?\nAvailable exits: ${currentLoc.exits.join(', ')}`
            );
            return;
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
            // Filter NPCs by their schedule availability
            const npcs = dataLoader.getNPCs();
            const availableNPCs = [];
            const unavailableNPCs = [];

            for (const npcId of loc.npcs) {
                const npc = npcs[npcId];
                if (npc && isNPCAvailable(npc, gameState.character.day, gameState.character.hour, gameState.character.minute)) {
                    availableNPCs.push(npc.name);
                } else if (npc) {
                    unavailableNPCs.push({ id: npcId, npc: npc });
                }
            }

            if (availableNPCs.length > 0) {
                this.output(`People here: ${availableNPCs.join(', ')}`, 'system');
            }

            if (unavailableNPCs.length > 0) {
                const unavailableNames = unavailableNPCs.map(item => {
                    const nextTime = getNextAvailableTime(item.npc, gameState.character.day, gameState.character.hour, gameState.character.minute);
                    return `${item.npc.name} (away${nextTime ? ', returns ' + nextTime : ''})`;
                }).join(', ');
                this.output(`Not here now: ${unavailableNames}`, 'system');
            }
        }

        this.output(`Exits: ${loc.exits.join(', ')}`, 'system');
        this.output(`Actions: ${loc.actions.join(', ')}`, 'system');
    }

    handleConversation(command) {
        const loc = locations[gameState.currentLocation];
        const target = command.target;
        const npcs = dataLoader.getNPCs();

        if (!target) {
            // No target specified - check if there are NPCs here
            const availableNPCs = loc.npcs.filter(npcId => {
                const npc = npcs[npcId];
                return npc && isNPCAvailable(npc, gameState.character.day, gameState.character.hour, gameState.character.minute);
            });

            if (availableNPCs.length === 0) {
                this.output("There's no one here to talk to.", 'error');
                return;
            }

            if (availableNPCs.length === 1) {
                // Only one NPC, talk to them automatically
                command.target = availableNPCs[0];
                this.handleConversation(command);
                return;
            }

            // Multiple NPCs - ask for clarification
            const npcNames = availableNPCs.map(id => npcs[id].name);
            const optionsList = npcNames.map((name, idx) => `${idx + 1}) ${name}`).join('\n');
            this.setDialogueState(
                'clarification',
                {
                    action: 'talk',
                    options: availableNPCs,
                    originalInput: 'talk'
                },
                `Multiple people are here. Who would you like to talk to?\n${optionsList}`
            );
            return;
        }

        if (!loc.npcs.some(npc => npc.includes(target) || target.includes(npc))) {
            this.output("There's no one like that here.", 'error');
            return;
        }

        gameState.lastNPC = target;

        // Get NPC dialogue from data
        const npcKey = Object.keys(npcs).find(key => key.includes(target) || target.includes(key));

        if (npcKey && npcs[npcKey] && npcs[npcKey].dialogues) {
            const npc = npcs[npcKey];
            
            // Check if NPC is available based on their schedule
            if (!isNPCAvailable(npc, gameState.character.day, gameState.character.hour, gameState.character.minute)) {
                this.output(`${npc.name} is not here right now.`, 'error');
                const nextTime = getNextAvailableTime(npc, gameState.character.day, gameState.character.hour, gameState.character.minute);
                if (nextTime) {
                    this.output(`They will be available ${nextTime}.`, 'system');
                }
                return;
            }
            
            // Get relationship level and select appropriate dialogue
            const relationshipLevel = this.getRelationshipLevel(npcKey);
            const dialogue = npc.dialogues[relationshipLevel] || npc.dialogues.default;
            
            dialogue.forEach(line => {
                this.output(line, 'description');
            });

            // Improve relationship slightly when talking
            const relationshipChange = 2;
            const oldRelationship = this.getRelationship(npcKey);
            const newRelationship = this.modifyRelationship(npcKey, relationshipChange);
            
            // Show relationship change if crossing significant threshold
            if (this.didCrossThreshold(oldRelationship, newRelationship, 30)) {
                this.output(`Your relationship with ${npc.name} has improved significantly!`, 'success');
            } else if (this.didCrossThreshold(oldRelationship, newRelationship, -30)) {
                this.output(`Your relationship with ${npc.name} has deteriorated.`, 'error');
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
            if (gameState.businesses.length > 0) {
                this.showBusinessInfo();
            } else {
                this.output("You don't own any businesses yet.", 'description');
            }
        } else {
            this.output(`You examine the ${target}. Nothing special.`, 'description');
        }
    }

    handleSchedule(command) {
        const npcs = dataLoader.getNPCs();
        const loc = locations[gameState.currentLocation];
        const target = command.target;

        // If no target specified, show schedules for all NPCs at current location
        if (!target || target.trim() === '') {
            if (loc.npcs.length === 0) {
                this.output('There are no NPCs at this location.', 'error');
                return;
            }

            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('NPC SCHEDULES AT THIS LOCATION', 'location');
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('');

            for (const npcId of loc.npcs) {
                const npc = npcs[npcId];
                if (npc) {
                    const schedule = getNPCScheduleDescription(npc);
                    const available = isNPCAvailable(npc, gameState.character.day, gameState.character.hour, gameState.character.minute);
                    const status = available ? '(HERE NOW)' : '(AWAY)';
                    
                    this.output(`${npc.name} ${status}`, 'description');
                    this.output(schedule, 'system');
                    this.output('', 'system');
                }
            }
        } else {
            // Show schedule for specific NPC
            const npcKey = Object.keys(npcs).find(key => 
                key.includes(target) || 
                target.includes(key) ||
                npcs[key].name.toLowerCase().includes(target)
            );

            if (!npcKey || !npcs[npcKey]) {
                this.output(`Could not find NPC: ${target}`, 'error');
                return;
            }

            const npc = npcs[npcKey];
            const schedule = getNPCScheduleDescription(npc);
            const available = isNPCAvailable(npc, gameState.character.day, gameState.character.hour, gameState.character.minute);
            
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output(`SCHEDULE FOR ${npc.name.toUpperCase()}`, 'location');
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('');
            this.output(`Location: ${locations[npc.location].name}`, 'description');
            this.output(`Current Status: ${available ? 'Available' : 'Away'}`, available ? 'success' : 'error');
            this.output('', 'system');
            this.output('Schedule:', 'description');
            this.output(schedule, 'system');
            
            if (!available) {
                const nextTime = getNextAvailableTime(npc, gameState.character.day, gameState.character.hour, gameState.character.minute);
                if (nextTime) {
                    this.output('', 'system');
                    this.output(`Next available: ${nextTime}`, 'system');
                }
            }
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
            
            // Format workout results message
            let resultMessage = `Strength +2, Energy -30, $${gymPrice} spent`;
            if (relationship >= 30) {
                resultMessage += ' (Discounted!)';
            }
            this.output(resultMessage, 'system');
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
        
        // Format interest rate message based on relationship
        let rateMessage = `Interest rate: ${(interestRate * 100).toFixed(1)}%`;
        let messageType = 'system';
        
        if (relationship >= 30) {
            rateMessage += ' (Reduced due to good relationship!)';
            messageType = 'success';
        } else if (relationship <= -30) {
            rateMessage += ' (Increased due to poor relationship)';
            messageType = 'error';
        }
        
        this.output(rateMessage, messageType);
        this.output('Remember: Invest wisely!', 'system');
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
            // Check if player already owns the cafe
            const existingBusiness = gameState.businesses.find(b => b.type === 'cafe');
            if (existingBusiness) {
                this.output('You already own the Coffee Bean Café!', 'error');
                return;
            }
            
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

            // Ask for confirmation before major purchase
            this.setDialogueState(
                'confirmation',
                {
                    action: 'buy',
                    details: {
                        target: 'cafe',
                        cost: cafePrice,
                        relationship: relationship
                    }
                },
                `═══════════════════════════════════════════════════\n` +
                `PURCHASE CONFIRMATION\n` +
                `═══════════════════════════════════════════════════\n` +
                `Business: Coffee Bean Café\n` +
                `Price: $${cafePrice}\n` +
                `Your Money: $${gameState.character.money}\n` +
                `Remaining: $${gameState.character.money - cafePrice}\n` +
                `═══════════════════════════════════════════════════\n` +
                `This is a major investment. Are you sure? (yes/no)`
            );
            return;
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

    // BUSINESS MANAGEMENT HANDLERS

    handleSetPrice(command) {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0]; // For now, manage first business
        let priceLevel = command.value;

        // Convert percentage to decimal if needed
        if (command.isPercent) {
            priceLevel = priceLevel / 100;
        }

        if (setBusinessPrice(business, priceLevel)) {
            const percentage = Math.round(priceLevel * 100);
            this.output(
                `${business.name} price level set to ${percentage}%.`,
                'success'
            );
            
            if (priceLevel < 0.8) {
                this.output('Low prices will increase volume but reduce per-sale revenue.', 'system');
            } else if (priceLevel > 1.3) {
                this.output('High prices may drive customers away despite higher margins.', 'system');
            } else {
                this.output('Balanced pricing strategy.', 'system');
            }
        } else {
            this.output('Price level must be between 50% and 200%.', 'error');
        }
    }

    handleHireStaff() {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0];
        if (business.staff >= 10) {
            this.output('You already have the maximum number of staff (10).', 'error');
            return;
        }

        setStaffCount(business, business.staff + 1);
        this.output(`Hired 1 staff member. You now have ${business.staff} employees.`, 'success');
        this.output(`Daily staff costs: $${business.staff * 50}`, 'system');
    }

    handleFireStaff() {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0];
        if (business.staff <= 1) {
            this.output('You need at least 1 staff member to run the business.', 'error');
            return;
        }

        setStaffCount(business, business.staff - 1);
        this.output(`Fired 1 staff member. You now have ${business.staff} employees.`, 'success');
        this.output(`Daily staff costs: $${business.staff * 50}`, 'system');
    }

    handleSetStaff(command) {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0];
        const staffCount = Math.floor(command.value);

        if (setStaffCount(business, staffCount)) {
            this.output(`${business.name} staff set to ${business.staff} employees.`, 'success');
            this.output(`Daily staff costs: $${business.staff * 50}`, 'system');
            
            if (business.staff < 2) {
                this.output('Warning: Understaffing will hurt service quality.', 'error');
            } else if (business.staff > 5) {
                this.output('Note: Overstaffing has diminishing returns.', 'system');
            }
        } else {
            this.output('Staff count must be between 1 and 10.', 'error');
        }
    }

    handleSetMarketing(command) {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0];
        const level = Math.floor(command.value);

        if (setMarketingLevel(business, level)) {
            this.output(`${business.name} marketing level set to ${business.marketing}.`, 'success');
            this.output(`Daily marketing costs: $${business.marketing * 20}`, 'system');
        } else {
            this.output('Marketing level must be between 0 and 10.', 'error');
        }
    }

    handleUpgradeQuality() {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0];

        if (business.quality >= 10) {
            this.output('Your business is already at maximum quality (10/10)!', 'success');
            return;
        }

        // Cost scales with current quality
        const upgradeCost = 1000 * (business.quality + 1);

        if (gameState.character.money < upgradeCost) {
            this.output(
                `Quality upgrade costs $${upgradeCost}. You need $${upgradeCost - gameState.character.money} more.`,
                'error'
            );
            return;
        }

        this.modifyMoney(-upgradeCost);
        upgradeQuality(business, upgradeCost);

        this.output(`${business.name} quality upgraded to ${business.quality}/10!`, 'success');
        this.output(`Cost: $${upgradeCost}`, 'system');
        this.output('Higher quality attracts more customers and justifies better pricing.', 'system');
    }

    handleRunMarketing() {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            return;
        }

        const business = gameState.businesses[0];
        
        // Marketing campaigns are now continuous via the setmarketing command
        this.output(`${business.name} current marketing level: ${business.marketing}/10`, 'description');
        this.output(`Daily marketing costs: $${business.marketing * 20}`, 'system');
        this.output('', 'system');
        this.output("Use 'set marketing to [level]' to adjust your marketing investment.", 'system');
        this.output('Higher marketing levels bring more customers.', 'system');
    }

    showBusinessInfo() {
        if (gameState.businesses.length === 0) {
            this.output("You don't own any businesses yet.", 'error');
            this.output("Type 'buy cafe' at the café to purchase your first business!", 'system');
            return;
        }

        gameState.businesses.forEach(business => {
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output(`${business.name.toUpperCase()} - BUSINESS REPORT`, 'location');
            this.output('═══════════════════════════════════════════════════', 'system');
            this.output('', 'system');
            
            // Performance summary
            const performance = getBusinessPerformance(business);
            const roi = business.daysOwned > 0 
                ? ((business.totalRevenue / business.purchasePrice) * 100).toFixed(1)
                : '0.0';
            
            this.output('PERFORMANCE:', 'description');
            this.output(`  Rating: ${performance}`, 'system');
            this.output(`  Days Owned: ${business.daysOwned}`, 'system');
            this.output(`  Total Revenue: $${business.totalRevenue}`, 'system');
            this.output(`  Last Daily Net: $${business.lastRevenue}`, business.lastRevenue >= 0 ? 'success' : 'error');
            this.output(`  ROI: ${roi}%`, 'system');
            this.output('', 'system');
            
            // Current parameters
            this.output('CURRENT PARAMETERS:', 'description');
            this.output(`  Price Level: ${Math.round(business.price * 100)}%`, 'system');
            this.output(`  Quality: ${business.quality}/10`, 'system');
            this.output(`  Marketing: ${business.marketing}/10`, 'system');
            this.output(`  Staff: ${business.staff}`, 'system');
            this.output('', 'system');
            
            // Financial breakdown
            this.output('DAILY COSTS:', 'description');
            this.output(`  Base Expenses: $${business.baseExpenses}`, 'system');
            this.output(`  Staff Cost: $${business.staff * 50}`, 'system');
            this.output(`  Marketing Cost: $${business.marketing * 20}`, 'system');
            this.output(`  Quality Cost: $${business.quality * 15}`, 'system');
            this.output(`  Total Daily Expenses: $${business.baseExpenses + (business.staff * 50) + (business.marketing * 20) + (business.quality * 15)}`, 'system');
            this.output('', 'system');
            
            // Recommendations
            const recommendations = getBusinessRecommendations(business);
            if (recommendations.length > 0) {
                this.output('RECOMMENDATIONS:', 'description');
                recommendations.forEach(rec => {
                    this.output(`  • ${rec}`, 'system');
                });
                this.output('', 'system');
            }
            
            // Management commands
            this.output('MANAGEMENT COMMANDS:', 'description');
            this.output("  • 'set price to [50-200]%' - Adjust pricing", 'system');
            this.output("  • 'upgrade quality' - Improve quality (costs money)", 'system');
            this.output("  • 'set marketing to [0-10]' - Adjust marketing", 'system');
            this.output("  • 'set staff to [1-10]' - Adjust staffing", 'system');
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
        this.output('  • talk - Start conversation (will prompt for who)', 'system');
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
        this.output('  • business info - View detailed business stats', 'system');
        this.output('  • set price to [%] - Adjust business pricing (50-200%)', 'system');
        this.output('  • upgrade quality - Improve business quality', 'system');
        this.output('  • set marketing to [0-10] - Adjust marketing level', 'system');
        this.output('  • set staff to [1-10] - Adjust staff count', 'system');
        this.output('');
        this.output('INFO:', 'description');
        this.output('  • stats - View full character stats', 'system');
        this.output('  • jobs - View all available careers and requirements', 'system');
        this.output('  • career - View detailed career path information', 'system');
        this.output('  • schedule [npc] - View NPC schedules (all or specific)', 'system');
        this.output('  • check [thing] - Examine something', 'system');
        this.output('  • inventory - View items', 'system');
        this.output('  • save - Save game to browser storage', 'system');
        this.output('  • load - Load saved game from browser storage', 'system');
        this.output('', 'system');
        this.output('DIALOGUE SYSTEM:', 'description');
        this.output('  • When prompted for information, just type your response', 'system');
        this.output('  • Type "cancel" at any time to exit a dialogue', 'system');
        this.output('  • Answer yes/no questions with "yes" or "no"', 'system');
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
        
        // Show business info
        if (gameState.businesses.length > 0) {
            this.output(`  Businesses:  ${gameState.businesses.length}`, 'system');
            gameState.businesses.forEach(business => {
                const performance = getBusinessPerformance(business);
                this.output(
                    `    • ${business.name} (${performance}) - Last: $${business.lastRevenue}/day`,
                    business.lastRevenue >= 0 ? 'success' : 'error'
                );
            });
            this.output("  Type 'business info' for detailed stats", 'system');
        } else {
            this.output('  Businesses:  None', 'system');
        }
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

            // Process all businesses at end of day
            if (gameState.businesses.length > 0) {
                this.output('', 'system');
                this.output('═══ END OF DAY BUSINESS REPORT ═══', 'event');
                
                let totalNetRevenue = 0;
                gameState.businesses.forEach(business => {
                    const results = processDailyBusiness(business);
                    totalNetRevenue += results.netRevenue;
                    
                    this.output(`${business.name}:`, 'description');
                    this.output(
                        `  Revenue: $${results.revenue} | Expenses: $${results.expenses} | Net: $${results.netRevenue}`,
                        results.netRevenue >= 0 ? 'success' : 'error'
                    );
                    
                    // Show performance rating
                    const performance = getBusinessPerformance(business);
                    this.output(`  Performance: ${performance}`, 'system');
                });
                
                // Apply total revenue to player's money
                this.modifyMoney(totalNetRevenue);
                
                this.output('', 'system');
                this.output(
                    `Total Business Income: $${totalNetRevenue}`,
                    totalNetRevenue >= 0 ? 'success' : 'error'
                );
                this.output('═══════════════════════════════════', 'event');
            }
            
            // Legacy support: Check old flag for backwards compatibility with saved games
            if (gameState.flags.ownsCafe && gameState.businesses.length === 0) {
                // Migrate old save to new system
                const config = dataLoader.getConfig();
                const migratedBusiness = createBusiness('cafe', 'Coffee Bean Café', config.prices.cafePrice);
                gameState.businesses.push(migratedBusiness);
                this.output('Your café has been upgraded to the new management system!', 'success');
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

    /**
     * Check if a value crossed a threshold
     * @param {number} oldValue - Previous value
     * @param {number} newValue - New value
     * @param {number} threshold - Threshold to check
     * @returns {boolean} True if crossed threshold
     */
    didCrossThreshold(oldValue, newValue, threshold) {
        return Math.abs(newValue) >= Math.abs(threshold) && 
               Math.abs(oldValue) < Math.abs(threshold);
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
