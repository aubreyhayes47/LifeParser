# Intent/Entity Recognition Vocabulary

This document describes the intent and entity recognition system used in LifeParser for natural language command parsing.

## Overview

The parser uses a two-stage approach:
1. **Intent Recognition** - Identifies what the user wants to do (high-level action)
2. **Entity Extraction** - Extracts specific objects, locations, NPCs, amounts, etc. from the input

## Intent Vocabulary

### Movement Intents

#### `move`
- **Keywords**: go, walk, move, travel, head, run, enter, visit, goto, leave, exit
- **Patterns**: to, toward, towards
- **Entities**: location, direction
- **Examples**:
  - "go to cafe"
  - "walk to the bank"
  - "travel home"
  - "go north"

### Observation Intents

#### `look`
- **Keywords**: look, examine, inspect, observe, view, see
- **Patterns**: around, at the room, at surroundings
- **Entities**: none
- **Examples**:
  - "look around"
  - "examine the room"
  - "observe my surroundings"

#### `examine`
- **Keywords**: check, view, show, display, examine, inspect
- **Patterns**: my, the
- **Entities**: target
- **Examples**:
  - "check stats"
  - "view my money"
  - "show health"
  - "examine the cafe"

### Interaction Intents

#### `talk`
- **Keywords**: talk, speak, chat, ask, tell, discuss, greet, converse
- **Patterns**: to, with
- **Entities**: npc, topic
- **Examples**:
  - "talk to the owner"
  - "speak with the trainer"
  - "chat with barista about work"
  - "ask loan officer about rates"

### Action Intents

#### `work`
- **Keywords**: work, workout, exercise, train
- **Patterns**: at, out
- **Entities**: none
- **Examples**:
  - "work"
  - "workout"
  - "exercise at the gym"

#### `sleep`
- **Keywords**: sleep, rest, nap, slumber
- **Patterns**: none
- **Entities**: duration
- **Examples**:
  - "sleep"
  - "rest for 8 hours"
  - "take a nap"

#### `eat`
- **Keywords**: eat, drink, consume, have
- **Patterns**: food, meal, something
- **Entities**: item
- **Examples**:
  - "eat"
  - "drink coffee"
  - "have a meal"

### Business Intents

#### `loan`
- **Keywords**: loan, borrow
- **Patterns**: take, get, request, for
- **Entities**: amount
- **Examples**:
  - "take a loan"
  - "get loan for 10000"
  - "borrow 5000"
  - "request loan"

#### `buy`
- **Keywords**: buy, purchase, acquire, invest, open
- **Patterns**: none
- **Entities**: target, business
- **Examples**:
  - "buy cafe"
  - "purchase the coffee shop"
  - "acquire business"

#### `apply`
- **Keywords**: apply
- **Patterns**: for job, for work, for position
- **Entities**: none
- **Examples**:
  - "apply for job"
  - "apply for work"
  - "apply for position"

#### `promote`
- **Keywords**: promote, promotion, advance, advancement
- **Patterns**: get, request
- **Entities**: none
- **Examples**:
  - "promote"
  - "get promotion"
  - "request advancement"

### Career Intents

#### `careerinfo`
- **Keywords**: career, careerinfo
- **Patterns**: path, info, information, details
- **Entities**: none
- **Examples**:
  - "career"
  - "career path"
  - "show career info"

#### `jobs`
- **Keywords**: jobs, careers, positions, employment
- **Patterns**: none
- **Entities**: none
- **Examples**:
  - "jobs"
  - "show careers"
  - "list positions"

### Information Intents

#### `help`
- **Keywords**: help, commands, info, ?
- **Patterns**: none
- **Entities**: none
- **Examples**:
  - "help"
  - "show commands"
  - "?"

#### `inventory`
- **Keywords**: inventory, inv, items, backpack, bag
- **Patterns**: none
- **Entities**: none
- **Examples**:
  - "inventory"
  - "check inv"
  - "show items"

#### `stats`
- **Keywords**: stats, status, character, profile
- **Patterns**: none
- **Entities**: none
- **Examples**:
  - "stats"
  - "show status"
  - "view character"

### System Intents

#### `save`
- **Keywords**: save
- **Patterns**: game
- **Entities**: none
- **Examples**:
  - "save"
  - "save game"

#### `load`
- **Keywords**: load
- **Patterns**: game
- **Entities**: none
- **Examples**:
  - "load"
  - "load game"

## Entity Types

### `location`
Entity representing a place in the game world.
- **Extraction**: Matched against game locations dynamically
- **Prepositions**: to, at, in, toward, towards
- **Examples**: cafe, bank, home, gym, park

### `npc`
Entity representing a non-player character.
- **Extraction**: Matched against game NPCs dynamically
- **Prepositions**: to, with
- **Examples**: owner, trainer, barista, loan officer

### `direction`
Entity representing a cardinal direction.
- **Values**: north, south, east, west, up, down
- **Examples**: "go north", "head east"

### `amount`
Entity representing a numeric value (money, quantity).
- **Pattern**: Numbers in various formats
- **Formats**: 
  - Plain numbers: 1000, 5000
  - With separators: 1,000 or 5,000
  - With currency: $1000 or $5,000
  - With suffixes: 10k (10,000), 1m (1,000,000)
- **Examples**: 10000, $5000, 10k

### `duration`
Entity representing time duration in hours.
- **Pattern**: Number followed by "hour" or "hr"
- **Default**: 8 hours for sleep if not specified
- **Examples**: "8 hours", "2 hrs"

### `target`
Generic entity representing the object of an action.
- **Extraction**: Remaining words after command verb
- **Examples**: In "check stats", target is "stats"

### `topic`
Entity representing conversation topic.
- **Extraction**: Words after "about" or "regarding"
- **Examples**: In "talk about work", topic is "work"

## Confidence Scoring

The intent recognizer assigns confidence scores (0-1) to each recognized intent based on:
- Keyword matches in the input
- Pattern matches
- Position of keywords (bonus for keywords at start)
- Priority of the intent
- Input length normalization

Minimum confidence threshold: **0.3** (inputs below this are marked as unknown)

## Extensibility

### Adding New Intents

You can add new intents programmatically:

```javascript
parser.addIntent('newIntent', {
    keywords: ['keyword1', 'keyword2'],
    patterns: ['pattern1', 'pattern2'],
    entities: ['entity1', 'entity2'],
    priority: 8
});
```

### Unknown Intent Logging

Unknown intents are automatically logged for analysis:
- Maximum 50 unknown intents stored
- Console logging for debugging
- Available via `parser.getUnknownIntents()`
- Can be cleared with `parser.clearUnknownIntents()`

### Entity Extraction Customization

The `EntityExtractor` class can be extended to add new entity types:
1. Add extraction logic to `extractEntityType()` in `IntentRecognizer`
2. Add specific extraction method to `EntityExtractor`
3. Update entity type configuration

## Migration from Regex

The new system maintains backward compatibility with the previous regex-based parser:
- All existing commands work with the new parser
- Command objects maintain the same structure
- Handler functions in the engine don't need changes

### Key Improvements

1. **Flexibility**: Handles variations in phrasing better than rigid regexes
2. **Extensibility**: New intents/entities can be added without code changes
3. **Maintainability**: Clear separation of intent recognition and entity extraction
4. **Debugging**: Unknown intents are logged for future improvements
5. **Confidence**: Provides confidence scores for better error handling

## Examples of Intent Recognition

### Example 1: Movement
**Input**: "walk to the coffee shop"
- **Intent**: move (confidence: 0.85)
- **Entities**: 
  - location: "cafe"

### Example 2: Conversation
**Input**: "chat with the trainer about workout plans"
- **Intent**: talk (confidence: 0.82)
- **Entities**:
  - npc: "trainer"
  - topic: "workout plans"

### Example 3: Business
**Input**: "borrow 10000 dollars"
- **Intent**: loan (confidence: 0.78)
- **Entities**:
  - amount: 10000

### Example 4: Information
**Input**: "show me my stats"
- **Intent**: stats (confidence: 0.88)
- **Entities**: none

### Example 5: Unknown
**Input**: "juggle the oranges"
- **Intent**: unknown (confidence: 0.0)
- **Logged**: yes (for future improvements)
