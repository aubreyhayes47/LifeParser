/**
 * NLP Parser
 * Natural Language Processing for command interpretation using Intent/Entity Recognition
 */

import { locations } from './locations.js';
import { IntentRecognizer } from './intentRecognizer.js';
import { EntityExtractor } from './entityExtractor.js';
import { dataLoader } from './dataLoader.js';

export class NLPParser {
    constructor() {
        this.intentRecognizer = new IntentRecognizer();
        this.entityExtractor = new EntityExtractor();
    }

    /**
     * Parse user input using intent/entity recognition
     * @param {string} input - User input text
     * @returns {Object} Command object with action and extracted entities
     */
    parse(input) {
        if (!input || typeof input !== 'string') {
            return { action: 'unknown', input: '' };
        }

        const trimmedInput = input.trim();
        if (!trimmedInput) {
            return { action: 'unknown', input: '' };
        }

        // Build context for entity extraction
        const context = this.buildContext();

        // Recognize intent and extract entities
        const recognized = this.intentRecognizer.recognize(trimmedInput, context);

        // Convert to legacy command format for backward compatibility
        return this.convertToLegacyFormat(recognized, context);
    }

    /**
     * Build context object for entity extraction
     * @returns {Object} Context with locations, npcs, etc.
     */
    buildContext() {
        const context = {
            locations: locations
        };

        // Add NPCs if data is loaded
        try {
            if (dataLoader.isDataLoaded()) {
                context.npcs = dataLoader.getNPCs();
            }
        } catch (error) {
            // NPCs not loaded yet, continue without them
        }

        return context;
    }

    /**
     * Convert intent/entity format to legacy command format
     * @param {Object} recognized - Recognized intent and entities
     * @param {Object} context - Game context
     * @returns {Object} Legacy command format
     */
    convertToLegacyFormat(recognized, context) {
        const { intent, entities } = recognized;

        // Build base command
        const command = {
            action: intent,
            originalInput: recognized.originalInput,
            confidence: recognized.confidence
        };

        // Map entities to legacy format based on intent
        switch (intent) {
            case 'move':
                if (entities.location) {
                    command.target = entities.location;
                } else if (entities.direction) {
                    command.direction = entities.direction;
                } else {
                    // Try to extract location from input
                    const location = this.findClosestLocation(recognized.originalInput);
                    if (location) {
                        command.target = location;
                    }
                }
                break;

            case 'talk':
                if (entities.npc) {
                    command.target = entities.npc;
                } else {
                    // Try to extract NPC from input
                    const npcEntity = this.entityExtractor.extractNPC(
                        recognized.originalInput,
                        context.npcs
                    );
                    if (npcEntity) {
                        command.target = npcEntity.key;
                    }
                }
                if (entities.topic) {
                    command.topic = entities.topic;
                }
                break;

            case 'examine':
                if (entities.target) {
                    command.target = entities.target;
                } else {
                    // Extract target from input
                    const targetEntity = this.entityExtractor.extractTarget(
                        recognized.originalInput,
                        'examine'
                    );
                    if (targetEntity) {
                        command.target = targetEntity.value;
                    }
                }
                break;

            case 'look':
                command.target = 'room';
                break;

            case 'work':
                command.target = 'current';
                break;

            case 'sleep':
                if (entities.duration) {
                    command.duration = entities.duration;
                } else {
                    command.duration = 8; // Default sleep duration
                }
                break;

            case 'eat':
                if (entities.item) {
                    command.target = entities.item;
                } else {
                    command.target = '';
                }
                break;

            case 'loan':
                if (entities.amount) {
                    command.amount = entities.amount;
                } else {
                    // Try to extract amount from input
                    const amountEntity = this.entityExtractor.extractAmount(
                        recognized.originalInput
                    );
                    if (amountEntity) {
                        command.amount = amountEntity.value;
                    }
                }
                break;

            case 'apply':
                command.target = 'job';
                break;

            case 'buy':
                if (entities.target) {
                    command.target = entities.target;
                } else if (entities.business) {
                    command.target = entities.business;
                } else {
                    // Extract target from input
                    const targetEntity = this.entityExtractor.extractTarget(
                        recognized.originalInput,
                        'buy'
                    );
                    if (targetEntity) {
                        command.target = targetEntity.value;
                    }
                }
                break;

            case 'unknown':
                command.input = recognized.originalInput.toLowerCase();
                break;

            default:
                // For simple commands without entities (help, stats, etc.)
                break;
        }

        return command;
    }

    /**
     * Find closest matching location (legacy method for backward compatibility)
     * @param {string} input - User input
     * @returns {string|null} Location key or null
     */
    findClosestLocation(input) {
        if (!input) return null;

        const normalized = input.toLowerCase();
        const locationsList = Object.keys(locations);

        // Try exact match first
        for (const loc of locationsList) {
            if (normalized.includes(loc) || loc.includes(normalized)) {
                return loc;
            }
        }

        // Try name match
        for (const loc of locationsList) {
            const locationName = locations[loc].name.toLowerCase();
            if (normalized.includes(locationName)) {
                return loc;
            }
        }

        // Try partial word match
        const words = normalized.split(/\s+/);
        for (const word of words) {
            if (word.length > 3) {
                for (const loc of locationsList) {
                    if (loc.includes(word)) {
                        return loc;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Get unknown intents for analysis
     * @returns {Array<string>} List of unknown intents
     */
    getUnknownIntents() {
        return this.intentRecognizer.getUnknownIntents();
    }

    /**
     * Clear unknown intents log
     */
    clearUnknownIntents() {
        this.intentRecognizer.clearUnknownIntents();
    }

    /**
     * Add custom intent to the recognizer
     * @param {string} intentName - Intent name
     * @param {Object} intentData - Intent configuration
     */
    addIntent(intentName, intentData) {
        this.intentRecognizer.addIntent(intentName, intentData);
    }

    /**
     * Get all registered intents
     * @returns {Object} Intent vocabulary
     */
    getIntents() {
        return this.intentRecognizer.getIntents();
    }
}
