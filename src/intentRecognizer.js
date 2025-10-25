/**
 * Intent Recognition System
 * Maps natural language inputs to high-level intents with entity extraction
 */

export class IntentRecognizer {
    constructor() {
        // Intent vocabulary with keywords and patterns
        this.intents = {
            move: {
                keywords: [
                    'go',
                    'walk',
                    'move',
                    'travel',
                    'head',
                    'run',
                    'enter',
                    'visit',
                    'goto',
                    'leave',
                    'exit'
                ],
                patterns: ['to', 'toward', 'towards'],
                entities: ['location', 'direction'],
                priority: 10
            },
            look: {
                keywords: ['look', 'examine', 'inspect', 'observe', 'view', 'see'],
                patterns: ['around', 'at the room', 'at surroundings'],
                entities: [],
                priority: 5
            },
            talk: {
                keywords: ['talk', 'speak', 'chat', 'ask', 'tell', 'discuss', 'greet', 'converse'],
                patterns: ['to', 'with'],
                entities: ['npc', 'topic'],
                priority: 10
            },
            examine: {
                keywords: ['check', 'view', 'show', 'display', 'examine', 'inspect'],
                patterns: ['my', 'the'],
                entities: ['target'],
                priority: 8
            },
            work: {
                keywords: ['work', 'workout', 'exercise', 'train'],
                patterns: ['at', 'out'],
                entities: [],
                priority: 7
            },
            sleep: {
                keywords: ['sleep', 'rest', 'nap', 'slumber'],
                patterns: [],
                entities: ['duration'],
                priority: 6
            },
            eat: {
                keywords: ['eat', 'drink', 'consume', 'have'],
                patterns: ['food', 'meal', 'something'],
                entities: ['item'],
                priority: 6
            },
            loan: {
                keywords: ['loan', 'borrow'],
                patterns: ['take', 'get', 'request', 'for'],
                entities: ['amount'],
                priority: 9
            },
            apply: {
                keywords: ['apply'],
                patterns: ['for job', 'for work', 'for position'],
                entities: [],
                priority: 10
            },
            promote: {
                keywords: ['promote', 'promotion', 'advance', 'advancement'],
                patterns: ['get', 'request'],
                entities: [],
                priority: 8
            },
            careerinfo: {
                keywords: ['career', 'careerinfo'],
                patterns: ['path', 'info', 'information', 'details'],
                entities: [],
                priority: 7
            },
            buy: {
                keywords: ['buy', 'purchase', 'acquire', 'invest', 'open'],
                patterns: [],
                entities: ['target', 'business'],
                priority: 9
            },
            help: {
                keywords: ['help', 'commands', 'info', '?'],
                patterns: [],
                entities: [],
                priority: 10
            },
            inventory: {
                keywords: ['inventory', 'inv', 'items', 'backpack', 'bag'],
                patterns: [],
                entities: [],
                priority: 10
            },
            jobs: {
                keywords: ['jobs', 'careers', 'positions', 'employment'],
                patterns: [],
                entities: [],
                priority: 10
            },
            stats: {
                keywords: ['stats', 'status', 'character', 'profile'],
                patterns: [],
                entities: [],
                priority: 10
            },
            save: {
                keywords: ['save'],
                patterns: ['game'],
                entities: [],
                priority: 10
            },
            load: {
                keywords: ['load'],
                patterns: ['game'],
                entities: [],
                priority: 10
            }
        };

        // Entity types and their extraction patterns
        this.entityTypes = {
            location: {
                // Locations will be matched dynamically from game data
                prepositions: ['to', 'at', 'in', 'toward', 'towards']
            },
            npc: {
                // NPCs will be matched dynamically from game data
                prepositions: ['to', 'with']
            },
            direction: {
                values: ['north', 'south', 'east', 'west'],
                prepositions: []
            },
            amount: {
                // Numeric values (e.g., for loans)
                pattern: /\b(\d+)\b/,
                prepositions: ['for', 'of']
            },
            topic: {
                // Conversation topics
                prepositions: ['about', 'regarding']
            },
            target: {
                // Generic target for examine/check commands
                prepositions: ['my', 'the']
            }
        };

        // Unknown intent logging
        this.unknownIntents = [];
        this.maxUnknownLog = 50; // Maximum number of unknown intents to log
    }

    /**
     * Recognize intent and extract entities from input
     * @param {string} input - User input text
     * @param {Object} context - Game context (locations, npcs, etc.)
     * @returns {Object} Structured command with intent and entities
     */
    recognize(input, context = {}) {
        if (!input || typeof input !== 'string') {
            return this.createCommand('unknown', {}, input);
        }

        const normalizedInput = input.trim().toLowerCase();
        if (!normalizedInput) {
            return this.createCommand('unknown', {}, input);
        }

        // Calculate confidence scores for each intent
        const intentScores = this.calculateIntentScores(normalizedInput);

        // Get best matching intent
        const bestIntent = this.getBestIntent(intentScores);

        if (!bestIntent || bestIntent.confidence < 0.3) {
            // Log unknown intent for future improvements
            this.logUnknownIntent(input);
            return this.createCommand('unknown', {}, input);
        }

        // Extract entities based on the recognized intent
        const entities = this.extractEntities(
            normalizedInput,
            bestIntent.intent,
            context
        );

        return this.createCommand(bestIntent.intent, entities, input, bestIntent.confidence);
    }

    /**
     * Calculate confidence scores for all intents
     * @param {string} input - Normalized input text
     * @returns {Object} Map of intent names to confidence scores
     */
    calculateIntentScores(input) {
        const scores = {};
        const tokens = input.split(/\s+/);

        Object.entries(this.intents).forEach(([intentName, intentData]) => {
            let score = 0;
            let matches = 0;

            // Check keyword matches
            intentData.keywords.forEach(keyword => {
                if (tokens.includes(keyword) || input.includes(keyword)) {
                    score += 1.0;
                    matches++;
                }
            });

            // Check pattern matches
            intentData.patterns.forEach(pattern => {
                if (input.includes(pattern)) {
                    score += 0.5;
                    matches++;
                }
            });

            // Adjust score by priority and position
            if (matches > 0) {
                // Bonus for keyword at start of input
                const firstToken = tokens[0];
                if (intentData.keywords.includes(firstToken)) {
                    score += 0.3;
                }

                // Special handling for single-token exact matches
                let confidence;
                if (tokens.length === 1 && intentData.keywords.includes(tokens[0])) {
                    // Exact single-word match gets high confidence
                    confidence = 0.95;
                } else {
                    // Normalize score by total words and priority
                    confidence = score / (tokens.length * 0.5 + 1);
                }
                
                scores[intentName] = {
                    confidence: Math.min(confidence * (intentData.priority / 10), 1.0),
                    matches: matches
                };
            }
        });

        return scores;
    }

    /**
     * Get the best matching intent from scores
     * @param {Object} scores - Intent scores map
     * @returns {Object|null} Best intent with confidence
     */
    getBestIntent(scores) {
        let bestIntent = null;
        let maxConfidence = 0;

        Object.entries(scores).forEach(([intentName, data]) => {
            if (data.confidence > maxConfidence) {
                maxConfidence = data.confidence;
                bestIntent = { intent: intentName, confidence: data.confidence };
            }
        });

        return bestIntent;
    }

    /**
     * Extract entities from input based on intent
     * @param {string} input - Normalized input text
     * @param {string} intent - Recognized intent
     * @param {Object} context - Game context (locations, npcs, etc.)
     * @returns {Object} Extracted entities
     */
    extractEntities(input, intent, context) {
        const entities = {};
        const intentData = this.intents[intent];

        if (!intentData || !intentData.entities) {
            return entities;
        }

        // Extract each entity type specified for this intent
        intentData.entities.forEach(entityType => {
            const extracted = this.extractEntityType(input, entityType, context);
            if (extracted !== null) {
                entities[entityType] = extracted;
            }
        });

        return entities;
    }

    /**
     * Extract a specific entity type from input
     * @param {string} input - Normalized input text
     * @param {string} entityType - Type of entity to extract
     * @param {Object} context - Game context
     * @returns {*} Extracted entity value or null
     */
    extractEntityType(input, entityType, context) {
        const entityConfig = this.entityTypes[entityType];
        if (!entityConfig) {
            return null;
        }

        // Handle location entity
        if (entityType === 'location' && context.locations) {
            return this.extractLocation(input, context.locations);
        }

        // Handle NPC entity
        if (entityType === 'npc' && context.npcs) {
            return this.extractNPC(input, context.npcs);
        }

        // Handle direction entity
        if (entityType === 'direction') {
            for (const dir of entityConfig.values) {
                if (input.includes(dir)) {
                    return dir;
                }
            }
        }

        // Handle amount entity
        if (entityType === 'amount') {
            const match = input.match(entityConfig.pattern);
            if (match && match[1]) {
                return parseInt(match[1]);
            }
        }

        // Handle topic entity (after "about")
        if (entityType === 'topic') {
            const aboutMatch = input.match(/about\s+(.+)/);
            if (aboutMatch) {
                return aboutMatch[1].trim();
            }
        }

        // Handle generic target entity
        if (entityType === 'target') {
            // Remove common command words and prepositions
            const words = input
                .replace(/^(check|view|show|examine|inspect|my|the)\s+/g, '')
                .trim();
            return words || null;
        }

        // Handle generic business/item entity
        if (entityType === 'business' || entityType === 'item') {
            // Extract everything after the main verb
            const words = input
                .replace(/^(buy|purchase|acquire|eat|drink|consume|a|the)\s+/g, '')
                .trim();
            return words || null;
        }

        return null;
    }

    /**
     * Extract location entity from input
     * @param {string} input - Normalized input text
     * @param {Object} locations - Available locations from game
     * @returns {string|null} Matched location key or null
     */
    extractLocation(input, locations) {
        if (!locations) return null;

        // Remove common prepositions to isolate location name
        const cleanInput = input.replace(/^(go|walk|move|travel|head|run|to|at|in)\s+/g, '');

        // Try exact match first
        for (const [key, location] of Object.entries(locations)) {
            const locationName = location.name.toLowerCase();
            if (cleanInput.includes(key) || cleanInput.includes(locationName)) {
                return key;
            }
        }

        // Try partial match
        for (const [key, location] of Object.entries(locations)) {
            const locationName = location.name.toLowerCase();
            const keyWords = key.split(/[_\s]+/);
            const nameWords = locationName.split(/\s+/);

            for (const word of [...keyWords, ...nameWords]) {
                if (word.length > 3 && cleanInput.includes(word)) {
                    return key;
                }
            }
        }

        return null;
    }

    /**
     * Extract NPC entity from input
     * @param {string} input - Normalized input text
     * @param {Object} npcs - Available NPCs from game
     * @returns {string|null} Matched NPC key or null
     */
    extractNPC(input, npcs) {
        if (!npcs) return null;

        // Remove common prepositions to isolate NPC name
        const cleanInput = input.replace(/^(talk|speak|chat|ask|tell|to|with|the)\s+/g, '');

        // Try exact match first
        for (const [key, npc] of Object.entries(npcs)) {
            const npcName = npc.name.toLowerCase();
            if (cleanInput.includes(key) || cleanInput.includes(npcName)) {
                return key;
            }
        }

        // Try partial match (last word often contains the role/name)
        const words = cleanInput.split(/\s+/);
        for (const word of words) {
            if (word.length > 3) {
                for (const [key, npc] of Object.entries(npcs)) {
                    const npcName = npc.name.toLowerCase();
                    if (key.includes(word) || npcName.includes(word)) {
                        return key;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Create a structured command object
     * @param {string} intent - Recognized intent
     * @param {Object} entities - Extracted entities
     * @param {string} originalInput - Original user input
     * @param {number} confidence - Confidence score (0-1)
     * @returns {Object} Structured command
     */
    createCommand(intent, entities = {}, originalInput = '', confidence = 0) {
        return {
            intent: intent,
            entities: entities,
            originalInput: originalInput,
            confidence: confidence,
            timestamp: Date.now()
        };
    }

    /**
     * Log unknown intent for future improvements
     * @param {string} input - User input that wasn't recognized
     */
    logUnknownIntent(input) {
        // Avoid duplicates
        if (this.unknownIntents.includes(input)) {
            return;
        }

        this.unknownIntents.push(input);

        // Keep log size manageable
        if (this.unknownIntents.length > this.maxUnknownLog) {
            this.unknownIntents.shift();
        }

        // Log to console for debugging
        console.log('[Intent Recognition] Unknown intent:', input);
    }

    /**
     * Get logged unknown intents for analysis
     * @returns {Array<string>} List of unknown intents
     */
    getUnknownIntents() {
        return [...this.unknownIntents];
    }

    /**
     * Clear unknown intents log
     */
    clearUnknownIntents() {
        this.unknownIntents = [];
    }

    /**
     * Add a new intent to the vocabulary (for extensibility)
     * @param {string} intentName - Name of the intent
     * @param {Object} intentData - Intent configuration
     */
    addIntent(intentName, intentData) {
        if (!intentName || !intentData) {
            throw new Error('Intent name and data are required');
        }

        if (!intentData.keywords || !Array.isArray(intentData.keywords)) {
            throw new Error('Intent must have keywords array');
        }

        this.intents[intentName] = {
            keywords: intentData.keywords || [],
            patterns: intentData.patterns || [],
            entities: intentData.entities || [],
            priority: intentData.priority || 5
        };
    }

    /**
     * Get all registered intents
     * @returns {Object} Intents vocabulary
     */
    getIntents() {
        return { ...this.intents };
    }
}
