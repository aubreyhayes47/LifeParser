# LifeParser Data Model Documentation

This document describes the data structures and cross-referencing approach used in LifeParser's JSON data files.

## Overview

LifeParser uses a data-driven architecture where game content (locations, NPCs, careers, items, events) is defined in JSON files rather than hardcoded. All data files are loaded concurrently at game startup using `Promise.all()` for optimal performance.

## Data Files

### 1. locations.json

Defines all locations in the game world.

**Structure:**
```json
{
  "location_id": {
    "name": "Display name of the location",
    "description": "Detailed description shown to player",
    "exits": ["array", "of", "location_ids", "player", "can", "travel", "to"],
    "actions": ["array", "of", "available", "actions"],
    "npcs": ["array", "of", "npc_ids", "present", "at", "this", "location"]
  }
}
```

**Cross-References:**
- `exits[]`: Contains location IDs that must exist in locations.json
- `npcs[]`: Contains NPC IDs that must exist in npcs.json

**Example:**
```json
{
  "cafe": {
    "name": "Coffee Bean Café",
    "description": "A cozy café with wooden tables...",
    "exits": ["street"],
    "actions": ["order coffee", "talk to owner", "apply for job"],
    "npcs": ["owner", "barista"]
  }
}
```

### 2. npcs.json

Defines all non-player characters in the game.

**Structure:**
```json
{
  "npc_id": {
    "id": "npc_id (should match the key)",
    "name": "NPC's display name",
    "location": "location_id where this NPC is found",
    "dialogues": {
      "default": ["array", "of", "dialogue", "lines"],
      "quest_name": ["context-specific", "dialogue"]
    }
  }
}
```

**Cross-References:**
- `location`: Must match a location ID in locations.json
- NPC ID must be listed in the `npcs[]` array of the corresponding location

**Example:**
```json
{
  "barista": {
    "id": "barista",
    "name": "Barista",
    "location": "cafe",
    "dialogues": {
      "default": [
        "You chat with the barista. They seem friendly.",
        "\"This job keeps me busy, but I enjoy making coffee!\""
      ]
    }
  }
}
```

### 3. careers.json

Defines available career paths and jobs in the game.

**Structure:**
```json
{
  "career_id": {
    "id": "career_id (should match the key)",
    "name": "Career display name",
    "description": "Description of the job",
    "location": "location_id where this job is available",
    "requirements": {
      "skill_name": minimum_value,
      "another_skill": minimum_value
    },
    "wage": hourly_wage_in_dollars,
    "skillGains": {
      "skill_name": points_gained_per_shift,
      "another_skill": points_gained_per_shift
    },
    "hoursPerShift": number_of_hours
  }
}
```

**Cross-References:**
- `location`: Must match a location ID in locations.json
- `requirements` and `skillGains` use skill names that match player stats (health, energy, hunger, intelligence, charisma, strength, businessSkill)

**Example:**
```json
{
  "barista": {
    "id": "barista",
    "name": "Barista",
    "description": "Serve coffee and pastries at the local café",
    "location": "cafe",
    "requirements": {
      "charisma": 20,
      "intelligence": 10
    },
    "wage": 60,
    "skillGains": {
      "charisma": 0.5,
      "businessSkill": 0.3
    },
    "hoursPerShift": 8
  }
}
```

### 4. items.json

Defines items players can acquire and use.

**Structure:**
```json
{
  "item_id": {
    "name": "Item display name",
    "description": "Item description",
    "value": monetary_value_in_dollars
  }
}
```

**Example:**
```json
{
  "phone": {
    "name": "Phone",
    "description": "Your smartphone. Essential for modern life.",
    "value": 200
  }
}
```

### 5. events.json

Defines random events that can occur during gameplay.

**Structure:**
```json
{
  "events": [
    {
      "id": "event_id",
      "title": "EVENT TITLE",
      "text": "Event description text",
      "effect": {
        "type": "stat_or_money",
        "value": numeric_value
      }
    }
  ]
}
```

**Example:**
```json
{
  "events": [
    {
      "id": "lucky_find",
      "title": "LUCKY FIND",
      "text": "You find a $20 bill on the ground!",
      "effect": {
        "type": "money",
        "value": 20
      }
    }
  ]
}
```

### 6. config.json

Contains game configuration and initial state values.

**Structure:**
```json
{
  "game": {
    "title": "Game title",
    "subtitle": "Game subtitle",
    "initialMoney": starting_money,
    "randomEventChance": probability_0_to_1,
    "minDayForEvents": minimum_day_for_events
  },
  "initialCharacter": {
    "name": "Player name",
    "day": starting_day,
    "hour": starting_hour,
    "minute": starting_minute,
    "money": starting_money,
    "health": 100,
    "energy": 100,
    "hunger": 30,
    "intelligence": 50,
    "charisma": 50,
    "strength": 40,
    "businessSkill": 30
  },
  "initialInventory": ["item_id1", "item_id2"],
  "initialLocation": "location_id",
  "prices": {
    "various_prices": numeric_values
  },
  "loans": {
    "min": minimum_loan_amount,
    "max": maximum_loan_amount,
    "interestRate": interest_rate_decimal
  }
}
```

**Cross-References:**
- `initialInventory[]`: Contains item IDs that must exist in items.json
- `initialLocation`: Must match a location ID in locations.json

## Cross-Referencing Rules

### Location ↔ NPC Relationship
1. Each NPC has a `location` field pointing to a location ID
2. Each location has an `npcs[]` array listing NPC IDs present there
3. These must be consistent: if an NPC lists a location, that location must include the NPC in its npcs array

### Career ↔ Location Relationship
1. Each career has a `location` field indicating where the job is available
2. To apply for a career, the player must be at the specified location

### Item References
1. Items in `initialInventory` must exist in items.json
2. Any item given through events or gameplay must be defined in items.json

### Skill Names
The following skill names are standardized across the game:
- `health`: Physical health (0-100)
- `energy`: Energy level (0-100)
- `hunger`: Hunger level (0-100, lower is better)
- `intelligence`: Mental capability
- `charisma`: Social skills
- `strength`: Physical strength
- `businessSkill`: Business acumen

## Data Loading Process

All data files are loaded at game startup using the following process:

1. **Parallel Loading**: All JSON files are fetched concurrently using `Promise.all()`
2. **Validation**: After loading, data is validated to ensure all required fields exist
3. **Cross-Reference Validation**: The game engine can optionally verify that all references are valid
4. **Accessibility**: Once loaded, data is accessible through the `dataLoader` singleton

**Code Example:**
```javascript
// Loading (in dataLoader.js)
const promises = Object.entries(dataFiles).map(async ([key, path]) => {
    const response = await fetch(path);
    const data = await response.json();
    this.data[key] = data;
});
await Promise.all(promises);

// Accessing
const locations = dataLoader.getLocations();
const npcs = dataLoader.getNPCs();
const careers = dataLoader.getCareers();
```

## Adding New Content

### Adding a New Location
1. Add entry to `locations.json` with unique ID
2. Add exits to/from other locations as needed
3. List any NPCs present in the `npcs[]` array
4. Update any careers that should be available at this location

### Adding a New NPC
1. Add entry to `npcs.json` with unique ID
2. Set the `location` field to where the NPC appears
3. Add the NPC's ID to the location's `npcs[]` array in locations.json
4. Create dialogue options as needed

### Adding a New Career
1. Add entry to `careers.json` with unique ID
2. Set appropriate requirements based on game balance
3. Define skill gains that make sense for the career
4. Set the `location` where players can apply for this career
5. Consider adding an NPC at that location who mentions the career

### Adding a New Item
1. Add entry to `items.json` with unique ID
2. Set appropriate name, description, and value
3. Items can then be added to inventory through game events or purchases

## Best Practices

1. **Consistent Naming**: Use lowercase with underscores for IDs (e.g., `coffee_shop`, `bank_manager`)
2. **Meaningful IDs**: Choose IDs that are descriptive and easy to understand
3. **Cross-Reference Integrity**: Always update both sides of a relationship (e.g., location ↔ NPC)
4. **Validation**: Test that all cross-references are valid by starting the game
5. **Documentation**: Update this document when adding new data structures or relationships
6. **Balance**: Consider game balance when setting skill requirements, wages, and skill gains
7. **Narrative Consistency**: Ensure NPC dialogues, locations, and careers tell a cohesive story

## Future Extensibility

The data model is designed to be easily extensible. Potential additions include:

- **Quests**: A quests.json file with objectives, rewards, and NPC relationships
- **Shops**: A shops.json file defining what items are sold at each location
- **Skills**: Additional skills beyond the current set
- **Time-based Events**: Events that trigger at specific times or days
- **Relationships**: NPC relationship system with friendship/reputation values
- **Businesses**: More detailed business ownership with management options

When extending the data model:
1. Create new JSON files in the `data/` directory
2. Update `dataLoader.js` to load the new files
3. Add validation for the new data structures
4. Document the new structures in this file
5. Maintain backward compatibility where possible
