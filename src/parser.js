/**
 * NLP Parser
 * Natural Language Processing for command interpretation
 */

import { locations } from './locations.js';

export class NLPParser {
    constructor() {
        this.verbs = {
            movement: ['go', 'walk', 'move', 'travel', 'head', 'run', 'enter', 'leave', 'exit'],
            interaction: ['talk', 'speak', 'chat', 'ask', 'tell', 'discuss', 'greet'],
            business: ['buy', 'purchase', 'sell', 'invest', 'hire', 'fire', 'manage', 'open'],
            action: ['work', 'train', 'study', 'eat', 'sleep', 'exercise', 'workout', 'drink'],
            examination: ['look', 'examine', 'inspect', 'check', 'read', 'view', 'show'],
            inventory: ['take', 'grab', 'get', 'drop', 'use', 'give', 'order']
        };

        this.patterns = [
            { regex: /^(go to|goto|enter|visit)\s+(the\s+)?(.*)/i, action: 'move', target: 3 },
            { regex: /^go\s+(north|south|east|west)/i, action: 'move', direction: 1 },
            {
                regex: /^talk to\s+(the\s+)?(.*?)(\s+about\s+(.*))?$/i,
                action: 'talk',
                target: 2,
                topic: 4
            },
            { regex: /^(check|view|show)\s+(my\s+)?(.*)/i, action: 'examine', target: 3 },
            { regex: /^(look|look around)/i, action: 'look', target: 'room' },
            { regex: /^(work|workout|exercise)/i, action: 'work', target: 'current' },
            { regex: /^(sleep|rest|nap)/i, action: 'sleep', duration: 8 },
            { regex: /^(eat|drink)\s*(.*)/i, action: 'eat', target: 2 },
            {
                regex: /^(take|get|request)\s+(a\s+)?loan(\s+for\s+)?(\d+)?/i,
                action: 'loan',
                amount: 4
            },
            { regex: /^apply for job/i, action: 'apply', target: 'job' },
            { regex: /^(promote|promotion|advance)/i, action: 'promote' },
            { regex: /^(buy|purchase|open)\s+(a\s+)?(.*)/i, action: 'buy', target: 3 },
            { regex: /^(help|commands|\?)/i, action: 'help' },
            { regex: /^(inventory|inv|items)/i, action: 'inventory' },
            { regex: /^(jobs|careers|positions)/i, action: 'jobs' },
            { regex: /^career(\s+path)?(\s+info)?/i, action: 'careerinfo' },
            { regex: /^stats/i, action: 'stats' },
            { regex: /^save/i, action: 'save' },
            { regex: /^load/i, action: 'load' }
        ];
    }

    parse(input) {
        input = input.trim().toLowerCase();

        for (const pattern of this.patterns) {
            const match = input.match(pattern.regex);
            if (match) {
                const command = { action: pattern.action };

                if (pattern.target) {
                    command.target = match[pattern.target] || null;
                }
                if (pattern.topic && match[pattern.topic]) {
                    command.topic = match[pattern.topic];
                }
                if (pattern.direction) {
                    command.direction = match[pattern.direction];
                }
                if (pattern.amount && match[pattern.amount]) {
                    command.amount = parseInt(match[pattern.amount]);
                }
                if (pattern.duration) {
                    command.duration = pattern.duration;
                }

                return command;
            }
        }

        return { action: 'unknown', input: input };
    }

    findClosestLocation(input) {
        const locationsList = Object.keys(locations);
        for (const loc of locationsList) {
            if (input.includes(loc) || loc.includes(input)) {
                return loc;
            }
        }
        return null;
    }
}
