# Dialogue State Machine Documentation

## Overview

The LifeParser dialogue system uses a simple state machine to handle contextual multi-turn interactions. This allows the game to maintain conversational context and guide players through incomplete commands or clarification requests.

## Architecture

### State Structure

The `gameState.pendingEvent` field stores the current dialogue context:

```javascript
gameState.pendingEvent = {
    type: 'dialogue_type',    // Type of pending interaction
    context: {                // Context-specific data
        // ... contextual information
    },
    prompt: 'string',         // Optional: message to display to user
    timeout: number           // Optional: turns until auto-cancel
};
```

### Dialogue State Types

#### 1. `incomplete_command`
Used when a command requires additional information.

**Context Fields:**
- `action`: The intended action (e.g., 'move', 'talk', 'buy')
- `missingEntity`: What information is needed (e.g., 'location', 'npc', 'item')
- `originalInput`: The original incomplete command

**Example:**
```javascript
{
    type: 'incomplete_command',
    context: {
        action: 'move',
        missingEntity: 'location',
        originalInput: 'go to'
    },
    prompt: 'Where would you like to go?'
}
```

#### 2. `confirmation`
Used when confirming an action with significant consequences.

**Context Fields:**
- `action`: The action to confirm (e.g., 'buy', 'quit_job', 'take_loan')
- `details`: Information about what's being confirmed
- `onConfirm`: Callback or data for confirmed action

**Example:**
```javascript
{
    type: 'confirmation',
    context: {
        action: 'buy',
        details: {
            item: 'cafe',
            cost: 50000
        }
    },
    prompt: 'This will cost $50,000. Confirm? (yes/no)'
}
```

#### 3. `clarification`
Used when user input is ambiguous and needs clarification.

**Context Fields:**
- `action`: The intended action
- `options`: Array of possible interpretations
- `originalInput`: The ambiguous input

**Example:**
```javascript
{
    type: 'clarification',
    context: {
        action: 'talk',
        options: ['owner', 'barista'],
        originalInput: 'talk to person'
    },
    prompt: 'Did you mean: 1) owner, 2) barista?'
}
```

#### 4. `yes_no`
Used for simple yes/no decisions.

**Context Fields:**
- `question`: The yes/no question being asked
- `onYes`: Callback or data for 'yes' response
- `onNo`: Callback or data for 'no' response

**Example:**
```javascript
{
    type: 'yes_no',
    context: {
        question: 'apply_for_job',
        jobDetails: { title: 'Barista', wage: 60 }
    },
    prompt: 'Would you like to apply for the Barista position? (yes/no)'
}
```

## Implementation

### State Machine Flow

```
User Input
    ↓
Has pendingEvent? ──No──→ Process normally
    ↓ Yes
Route to dialogue handler
    ↓
Handle based on type
    ↓
Clear or update pendingEvent
    ↓
Continue game logic
```

### Core Functions

#### `processCommand(input)` (in GameEngine)
Enhanced to check for active dialogue context:

```javascript
processCommand(input) {
    if (!input.trim()) return;
    
    // Check for active dialogue context
    if (gameState.pendingEvent) {
        this.handleDialogueResponse(input);
        return;
    }
    
    // Normal command processing
    // ...
}
```

#### `handleDialogueResponse(input)` (new in GameEngine)
Routes input to appropriate handler based on dialogue type:

```javascript
handleDialogueResponse(input) {
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
            this.clearDialogueState();
    }
}
```

#### `clearDialogueState()` (new in GameEngine)
Clears the current dialogue context:

```javascript
clearDialogueState() {
    gameState.pendingEvent = null;
}
```

#### `setDialogueState(type, context, prompt)` (new in GameEngine)
Sets a new dialogue context:

```javascript
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
```

### Dialogue Handlers

#### Incomplete Command Handler
Completes commands that were missing required information:

```javascript
handleIncompleteCommand(input, event) {
    const { action, missingEntity } = event.context;
    
    // Parse the provided entity
    const command = this.parser.parse(input);
    
    // Reconstruct complete command
    const completeCommand = {
        action: action,
        [missingEntity]: command.target || input.trim()
    };
    
    this.clearDialogueState();
    
    // Execute the original command with new information
    this.executeCommand(completeCommand);
}
```

#### Confirmation Handler
Handles yes/no confirmations:

```javascript
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
```

#### Clarification Handler
Handles selection from multiple options:

```javascript
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
            this.executeWithClarification(action, selected);
            return;
        }
    }
    
    // Try to match direct text selection
    const selected = options.find(opt => 
        opt.toLowerCase() === response || 
        response.includes(opt.toLowerCase())
    );
    
    if (selected) {
        this.clearDialogueState();
        this.executeWithClarification(action, selected);
    } else {
        this.output('Invalid selection. Please choose from the options.', 'error');
    }
}
```

#### Yes/No Handler
Handles simple yes/no questions:

```javascript
handleYesNo(input, event) {
    const response = input.trim().toLowerCase();
    
    if (response === 'yes' || response === 'y') {
        this.clearDialogueState();
        if (event.context.onYes) {
            this.executeCallback(event.context.onYes);
        }
    } else if (response === 'no' || response === 'n') {
        this.clearDialogueState();
        if (event.context.onNo) {
            this.executeCallback(event.context.onNo);
        }
    } else {
        this.output('Please answer yes or no.', 'error');
    }
}
```

## Usage Examples

### Example 1: Incomplete Movement Command

```javascript
// User types: "go to"
// System detects missing location and sets state:
this.setDialogueState('incomplete_command', {
    action: 'move',
    missingEntity: 'location',
    originalInput: 'go to'
}, 'Where would you like to go? (Available: cafe, bank, home, gym)');

// User responds: "cafe"
// System completes command and executes movement
```

### Example 2: Purchase Confirmation

```javascript
// User types: "buy cafe"
// System prompts for confirmation:
this.setDialogueState('confirmation', {
    action: 'buy',
    details: { item: 'cafe', cost: 50000 }
}, 'This will cost $50,000. Are you sure? (yes/no)');

// User responds: "yes"
// System executes purchase
```

### Example 3: Ambiguous NPC Reference

```javascript
// User types: "talk to them"
// Multiple NPCs present, system asks for clarification:
this.setDialogueState('clarification', {
    action: 'talk',
    options: ['owner', 'barista'],
    originalInput: 'talk to them'
}, 'Multiple people here. Who did you mean?\n1) owner\n2) barista');

// User responds: "1"
// System talks to owner
```

## Best Practices

### When to Use Dialogue States

1. **Required Information Missing**: Command can't execute without additional input
2. **High-Impact Actions**: Actions with significant consequences need confirmation
3. **Ambiguous Input**: Multiple valid interpretations exist
4. **Tutorial/Guidance**: Guide new players through complex interactions

### When NOT to Use Dialogue States

1. **Simple Commands**: Commands with clear intent and no risks
2. **Repeatable Actions**: Actions users do frequently (e.g., "work", "sleep")
3. **Information Display**: Commands that just show information
4. **Low-Risk Actions**: Actions with minimal consequences

### Error Handling

Always include:
- Clear prompts explaining what's expected
- Validation of user responses
- Option to cancel (e.g., "cancel", "quit", "exit")
- Timeout for abandoned dialogues

### Cancel Command

All dialogue states should support cancellation:

```javascript
handleDialogueResponse(input) {
    const response = input.trim().toLowerCase();
    
    if (response === 'cancel' || response === 'quit' || response === 'exit') {
        this.clearDialogueState();
        this.output('Action cancelled.', 'system');
        return;
    }
    
    // ... rest of handler
}
```

## Future Enhancements

### Planned Features

1. **State Stack**: Support nested dialogue contexts for complex interactions
2. **Timeout System**: Auto-cancel dialogues after N turns of inactivity
3. **Context Hints**: Show available commands/options in UI when in dialogue mode
4. **Dialogue History**: Track conversation history for smarter follow-ups
5. **Multi-Step Workflows**: Chain multiple dialogue states for complex tasks
6. **Smart Defaults**: Remember user preferences for common clarifications

### Extensibility

The system is designed to be extended with new dialogue types:

```javascript
// Add new dialogue type
case 'multi_choice':
    this.handleMultiChoice(input, event);
    break;
```

New handlers follow the same pattern:
1. Parse user input
2. Validate response
3. Clear or update state
4. Execute appropriate action

## Testing

### Test Scenarios

1. **Incomplete Commands**: Test all action types with missing entities
2. **Confirmations**: Test yes/no/cancel responses
3. **Clarifications**: Test numeric and text selection
4. **Cancel at Any Time**: Ensure all states can be cancelled
5. **Invalid Input**: Test error handling for all dialogue types
6. **State Persistence**: Verify dialogue state survives save/load

### Manual Testing Script

```
1. Type: "go to" → Should prompt for location
2. Type: "cafe" → Should complete movement
3. Type: "buy cafe" → Should ask for confirmation
4. Type: "yes" → Should complete purchase (if affordable)
5. Type: "talk to" → Should prompt for NPC
6. Type: "cancel" → Should cancel dialogue
```

## Integration with Save System

Dialogue states are saved/loaded as part of `gameState.pendingEvent`:
- State persists across page refreshes
- Can resume interrupted dialogues after load
- Forward-compatible with new dialogue types

## Performance Considerations

- Minimal overhead: single check per command
- No state stored when not in dialogue
- State cleared immediately after resolution
- No memory leaks from abandoned dialogues
