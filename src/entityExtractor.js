/**
 * Entity Extractor
 * Extracts structured entities from natural language input
 */

export class EntityExtractor {
    constructor() {
        // Common stop words to filter out
        this.stopWords = new Set([
            'a',
            'an',
            'the',
            'to',
            'at',
            'in',
            'on',
            'for',
            'with',
            'from',
            'my',
            'your',
            'is',
            'are',
            'was',
            'were',
            'can',
            'could',
            'should',
            'would'
        ]);
    }

    /**
     * Extract location from input text
     * @param {string} text - Input text
     * @param {Object} locations - Available locations
     * @returns {Object|null} Location entity with key and confidence
     */
    extractLocation(text, locations) {
        if (!text || !locations) return null;

        const normalized = text.toLowerCase().trim();
        let bestMatch = null;
        let maxConfidence = 0;

        Object.entries(locations).forEach(([key, location]) => {
            const locationName = location.name.toLowerCase();
            const locationKey = key.toLowerCase();

            // Exact match (highest confidence)
            if (normalized.includes(locationKey)) {
                const confidence = locationKey.length / normalized.length;
                if (confidence > maxConfidence) {
                    maxConfidence = Math.min(confidence + 0.5, 1.0);
                    bestMatch = { key, name: location.name };
                }
            }

            // Name match
            if (normalized.includes(locationName)) {
                const confidence = locationName.length / normalized.length;
                if (confidence > maxConfidence) {
                    maxConfidence = Math.min(confidence + 0.3, 1.0);
                    bestMatch = { key, name: location.name };
                }
            }

            // Partial match on significant words
            const words = this.extractSignificantWords(normalized);
            const locationWords = locationKey.split('_');

            for (const word of words) {
                if (word.length > 3 && locationWords.some(lw => lw.includes(word))) {
                    const confidence = 0.6;
                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        bestMatch = { key, name: location.name };
                    }
                }
            }
        });

        if (bestMatch && maxConfidence > 0.4) {
            return { ...bestMatch, confidence: maxConfidence, type: 'location' };
        }

        return null;
    }

    /**
     * Extract NPC from input text
     * @param {string} text - Input text
     * @param {Object} npcs - Available NPCs
     * @returns {Object|null} NPC entity with key and confidence
     */
    extractNPC(text, npcs) {
        if (!text || !npcs) return null;

        const normalized = text.toLowerCase().trim();
        let bestMatch = null;
        let maxConfidence = 0;

        Object.entries(npcs).forEach(([key, npc]) => {
            const npcName = npc.name.toLowerCase();
            const npcKey = key.toLowerCase();

            // Exact match (highest confidence)
            if (normalized.includes(npcKey)) {
                const confidence = npcKey.length / normalized.length;
                if (confidence > maxConfidence) {
                    maxConfidence = Math.min(confidence + 0.5, 1.0);
                    bestMatch = { key, name: npc.name };
                }
            }

            // Name match
            if (normalized.includes(npcName)) {
                const confidence = npcName.length / normalized.length;
                if (confidence > maxConfidence) {
                    maxConfidence = Math.min(confidence + 0.3, 1.0);
                    bestMatch = { key, name: npc.name };
                }
            }

            // Partial match on significant words
            const words = this.extractSignificantWords(normalized);
            const npcWords = npcKey.split('_');

            for (const word of words) {
                if (word.length > 3 && npcWords.some(nw => nw.includes(word))) {
                    const confidence = 0.6;
                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        bestMatch = { key, name: npc.name };
                    }
                }
            }
        });

        if (bestMatch && maxConfidence > 0.4) {
            return { ...bestMatch, confidence: maxConfidence, type: 'npc' };
        }

        return null;
    }

    /**
     * Extract numeric amount from text
     * @param {string} text - Input text
     * @returns {Object|null} Amount entity with value and confidence
     */
    extractAmount(text) {
        if (!text) return null;

        // Match various number formats
        const patterns = [
            /\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, // $1,000.00 or 1000.00
            /(\d+)k/gi, // 10k
            /(\d+)m/gi // 10m
        ];

        const amounts = [];

        patterns.forEach((pattern, index) => {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => {
                let value = match[1].replace(/,/g, '');

                if (index === 1) {
                    // k suffix
                    value = parseFloat(value) * 1000;
                } else if (index === 2) {
                    // m suffix
                    value = parseFloat(value) * 1000000;
                } else {
                    value = parseFloat(value);
                }

                if (!isNaN(value) && value > 0) {
                    amounts.push({
                        value: Math.floor(value),
                        confidence: 0.9,
                        type: 'amount'
                    });
                }
            });
        });

        return amounts.length > 0 ? amounts[0] : null;
    }

    /**
     * Extract duration (hours) from text
     * @param {string} text - Input text
     * @returns {Object|null} Duration entity with hours and confidence
     */
    extractDuration(text) {
        if (!text) return null;

        const normalized = text.toLowerCase();

        // Match explicit hour mentions
        const hourMatch = normalized.match(/(\d+)\s*(?:hour|hr)s?/);
        if (hourMatch) {
            return {
                hours: parseInt(hourMatch[1]),
                confidence: 0.95,
                type: 'duration'
            };
        }

        // Default sleep duration
        if (normalized.includes('sleep') || normalized.includes('rest')) {
            return {
                hours: 8,
                confidence: 0.7,
                type: 'duration'
            };
        }

        return null;
    }

    /**
     * Extract target object/concept from text
     * @param {string} text - Input text
     * @param {string} intentVerb - The main verb/intent
     * @returns {Object|null} Target entity
     */
    extractTarget(text, intentVerb = '') {
        if (!text) return null;

        const normalized = text.toLowerCase().trim();

        // Remove the intent verb and common prepositions
        const cleaned = normalized
            .replace(new RegExp(`^(${intentVerb}|check|view|show|examine|inspect|my|the)\\s+`, 'g'), '')
            .trim();

        if (cleaned) {
            return {
                value: cleaned,
                confidence: 0.8,
                type: 'target'
            };
        }

        return null;
    }

    /**
     * Extract conversation topic from text
     * @param {string} text - Input text
     * @returns {Object|null} Topic entity
     */
    extractTopic(text) {
        if (!text) return null;

        const normalized = text.toLowerCase();

        // Look for "about X" pattern
        const aboutMatch = normalized.match(/about\s+(.+)/);
        if (aboutMatch) {
            return {
                value: aboutMatch[1].trim(),
                confidence: 0.9,
                type: 'topic'
            };
        }

        // Look for "regarding X" pattern
        const regardingMatch = normalized.match(/regarding\s+(.+)/);
        if (regardingMatch) {
            return {
                value: regardingMatch[1].trim(),
                confidence: 0.9,
                type: 'topic'
            };
        }

        return null;
    }

    /**
     * Extract direction from text
     * @param {string} text - Input text
     * @returns {Object|null} Direction entity
     */
    extractDirection(text) {
        if (!text) return null;

        const normalized = text.toLowerCase();
        const directions = ['north', 'south', 'east', 'west', 'up', 'down'];

        for (const dir of directions) {
            if (normalized.includes(dir)) {
                return {
                    value: dir,
                    confidence: 0.95,
                    type: 'direction'
                };
            }
        }

        return null;
    }

    /**
     * Extract significant words by filtering stop words
     * @param {string} text - Input text
     * @returns {Array<string>} Significant words
     */
    extractSignificantWords(text) {
        if (!text) return [];

        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.stopWords.has(word));
    }

    /**
     * Extract all entities from text
     * @param {string} text - Input text
     * @param {Object} context - Game context (locations, npcs, etc.)
     * @returns {Object} Map of entity types to extracted entities
     */
    extractAll(text, context = {}) {
        const entities = {};

        if (context.locations) {
            const location = this.extractLocation(text, context.locations);
            if (location) entities.location = location;
        }

        if (context.npcs) {
            const npc = this.extractNPC(text, context.npcs);
            if (npc) entities.npc = npc;
        }

        const amount = this.extractAmount(text);
        if (amount) entities.amount = amount;

        const duration = this.extractDuration(text);
        if (duration) entities.duration = duration;

        const topic = this.extractTopic(text);
        if (topic) entities.topic = topic;

        const direction = this.extractDirection(text);
        if (direction) entities.direction = direction;

        return entities;
    }
}
