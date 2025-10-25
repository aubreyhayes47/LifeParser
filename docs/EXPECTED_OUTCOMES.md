# Expected Outcomes Documentation
## LifeParser Game Mechanics - Detailed Behavior Specifications

**Version:** 1.0  
**Purpose:** Define exact expected behavior for each game mechanic for regression testing

---

## 1. MOVEMENT SYSTEM

### Command: `go to [location]`
**Variants:** `goto`, `walk to`, `travel to`, `move to`, `head to`

**Preconditions:**
- Target location must exist
- Target location must be accessible from current location (in exits list)

**Expected Behavior:**
1. If valid:
   - Player location changes to target
   - Energy decreases by 5 points
   - Time advances by 15 minutes
   - Success message: "You travel to [Location Name]."
   - Location description automatically displayed
   
2. If invalid location:
   - Error message: "You can't go there from here."
   - List of available exits shown
   - No state changes

3. If location not reachable:
   - Error message: "You can't reach [Location] from here."
   - List of available exits shown
   - No state changes

**Location Graph:**
```
      gym
       |
home - street - cafe
       |
      bank
```

**State Changes:**
- `gameState.currentLocation` → new location
- `gameState.character.energy` → energy - 5
- `gameState.character.minute` → minute + 15
- UI updates: All stat displays refresh

---

### Command: `look around` / `look`

**Expected Behavior:**
- Display location name (uppercase)
- Display location description
- List NPCs present (if any): "People here: [list]"
- List available exits: "Exits: [list]"
- List available actions: "Actions: [list]"

**State Changes:**
- No stat changes
- No time advancement

---

## 2. CONVERSATION SYSTEM

### Command: `talk to [person]`
**Variants:** `speak with`, `chat with`, `ask`, `discuss`

**Preconditions:**
- NPC must be present at current location
- NPC name must match (partial match allowed)

**Expected Behavior:**
1. If NPC present and has dialogue data:
   - Display NPC dialogue from data file
   - Time advances by 10 minutes
   - `gameState.lastNPC` updated to NPC name

2. If NPC present but no dialogue:
   - Generic message: "You chat with the [person]. They seem friendly."
   - Time advances by 10 minutes

3. If NPC not present:
   - Error: "There's no one like that here."
   - No state changes

**State Changes:**
- `gameState.character.minute` → minute + 10
- `gameState.lastNPC` → NPC name

**NPC Locations:**
- Cafe: owner, barista
- Gym: trainer
- Bank: loan officer
- Home: none
- Street: none

---

## 3. WORK SYSTEM

### Command: `work` (at Gym)
**Variants:** `workout`, `exercise`

**Preconditions:**
- Must be at gym location
- Must have ≥ $20

**Expected Behavior:**
1. If conditions met:
   - Money decreases by $20
   - Energy decreases by 30
   - Hunger increases by 20
   - Strength increases by 2
   - Time advances by 60 minutes
   - Success message about workout
   - Summary: "Strength +2, Energy -30, $20 spent"

2. If insufficient money:
   - Error: "You don't have enough money for a gym session ($20)."
   - No state changes

**State Changes:**
- `gameState.character.money` → money - 20
- `gameState.character.energy` → energy - 30
- `gameState.character.hunger` → hunger + 20
- `gameState.character.strength` → strength + 2
- `gameState.character.minute` → minute + 60

---

### Command: `work` (at Cafe)

**Preconditions:**
- Must be at cafe location
- Must have job (hasJob flag = true)

**Expected Behavior:**
1. If has job:
   - Money increases by $60
   - Energy decreases by 25
   - Hunger increases by 15
   - Business skill increases by 1
   - Time advances by 240 minutes (4 hours)
   - Success message about shift
   - Summary: "Earned $60, Business Skill +1"

2. If no job:
   - Error: "You need to apply for a job first. Try 'apply for job'."
   - No state changes

3. At other locations:
   - Error: "There's nothing to work on here."
   - No state changes

**State Changes:**
- `gameState.character.money` → money + 60
- `gameState.character.energy` → energy - 25
- `gameState.character.hunger` → hunger + 15
- `gameState.character.businessSkill` → businessSkill + 1
- `gameState.character.minute` → minute + 240

---

## 4. JOB APPLICATION

### Command: `apply for job`

**Preconditions:**
- Must be at cafe
- Must not already have job

**Expected Behavior:**
1. If at cafe and no job:
   - hasJob flag set to true
   - Success message with owner dialogue
   - Information about wage: $60 per 4-hour shift
   - Time advances by 15 minutes

2. If already has job:
   - Error: "You already work here!"
   - No state changes

3. If at other locations:
   - Error: "There are no job openings here."
   - No state changes

**State Changes:**
- `gameState.flags.hasJob` → true
- `gameState.character.minute` → minute + 15

---

## 5. SLEEP SYSTEM

### Command: `sleep` / `rest` / `nap`

**Preconditions:**
- Must be at home

**Expected Behavior:**
1. If at home:
   - Energy set to 100 (full restore)
   - Hunger increases by 30
   - Time advances by 480 minutes (8 hours)
   - Success message: "You sleep for 8 hours and wake up refreshed."
   - Info: "Energy restored to 100"

2. If not at home:
   - Error: "You need to go home to sleep properly."
   - No state changes

**Special Cases:**
- If sleep causes day rollover:
  - Day counter increments
  - If owns cafe: Add $200 revenue with message

**State Changes:**
- `gameState.character.energy` → 100
- `gameState.character.hunger` → hunger + 30
- `gameState.character.minute` → minute + 480
- Possibly `gameState.character.day` → day + 1
- Possibly `gameState.character.money` → money + 200 (if owns cafe)

---

## 6. EATING SYSTEM

### Command: `eat` / `drink`

**Location: Home**
**Preconditions:**
- Must be at home
- Must have ≥ $10

**Expected Behavior:**
1. If conditions met:
   - Money decreases by $10
   - Hunger decreases by 40
   - Time advances by 30 minutes
   - Success message about home meal
   - Summary: "Hunger -40, $10 spent"

2. If insufficient money:
   - Error: "You don't have enough money for food ($10)."
   - No state changes

**State Changes (Home):**
- `gameState.character.money` → money - 10
- `gameState.character.hunger` → hunger - 40
- `gameState.character.minute` → minute + 30

---

**Location: Cafe**
**Preconditions:**
- Must be at cafe
- Must have ≥ $15

**Expected Behavior:**
1. If conditions met:
   - Money decreases by $15
   - Hunger decreases by 50
   - Time advances by 20 minutes
   - Success message: "You order a sandwich and coffee. Delicious!"
   - Summary: "Hunger -50, $15 spent"

2. If insufficient money:
   - Error: "You don't have enough money for café food ($15)."
   - No state changes

**State Changes (Cafe):**
- `gameState.character.money` → money - 15
- `gameState.character.hunger` → hunger - 50
- `gameState.character.minute` → minute + 20

---

**Location: Other**
**Expected Behavior:**
- Error: "You can't eat here. Try going home or to a café."
- No state changes

---

## 7. LOAN SYSTEM

### Command: `take loan` / `get loan` / `request loan`

**Preconditions:**
- Must be at bank

**Expected Behavior:**
1. Default (no amount specified):
   - Money increases by $10,000
   - Time advances by 30 minutes
   - Success: "Loan approved! You receive $10000."
   - Info about interest: "Remember: This comes with 8% interest. Invest wisely!"

2. With amount (between $5,000 and $50,000):
   - Money increases by specified amount
   - Time advances by 30 minutes
   - Success message with amount
   - Interest rate info

3. If amount < $5,000 or > $50,000:
   - Error: "Loans are available from $5000 to $50000."
   - No state changes

4. If not at bank:
   - Error: "You need to be at the bank to get a loan."
   - No state changes

**State Changes:**
- `gameState.character.money` → money + loanAmount
- `gameState.character.minute` → minute + 30

**Valid Amounts:**
- Minimum: $5,000
- Maximum: $50,000
- Default: $10,000
- Interest Rate: 8% (informational only, not enforced)

---

## 8. BUSINESS PURCHASE

### Command: `buy cafe` / `purchase cafe`

**Preconditions:**
- Must have ≥ $50,000

**Expected Behavior:**
1. If can afford:
   - Money decreases by $50,000
   - ownsCafe flag set to true
   - Special formatted success message:
     ```
     ═════════════════════════════════════
     BUSINESS ACQUIRED!
     You are now the proud owner of Coffee Bean Café!
     The café will generate passive income of $200/day.
     ═════════════════════════════════════
     ```

2. If cannot afford:
   - Error: "You need $50000 to buy the café. Keep working and saving!"
   - No state changes

3. Other items:
   - Error: "You can't buy that right now."
   - No state changes

**State Changes:**
- `gameState.character.money` → money - 50000
- `gameState.flags.ownsCafe` → true

**Ongoing Effect:**
- Each day rollover: +$200 with message
- Message: "Your café generated $200 in revenue today!"

---

## 9. INFORMATION COMMANDS

### Command: `stats`

**Expected Behavior:**
- Display formatted character sheet with sections:
  - Header with day and time
  - PHYSICAL: Health, Energy, Hunger (all /100)
  - SKILLS: Intelligence, Charisma, Strength, Business (all /100)
  - FINANCIAL: Cash, Businesses owned

**No State Changes**

---

### Command: `check [thing]`

**Variants:** `examine`, `view`, `show`

**Expected Behavior:**

| Target | Response |
|--------|----------|
| stats, character | Full stats display (same as `stats`) |
| money, balance, cash | "You have $[amount]." |
| health | "Your health is [value]/100." |
| time | "It's Day [day], [formatted time]." |
| business, cafe | Ownership status and revenue info |
| anything else | "You examine the [thing]. Nothing special." |

**No State Changes**

---

### Command: `inventory` / `inv` / `items`

**Expected Behavior:**
- Display header: "INVENTORY:"
- List each item with bullet: "• [item]"
- Default items: phone, wallet, keys

**No State Changes**

---

### Command: `help` / `commands` / `?`

**Expected Behavior:**
- Display formatted command reference
- Sections: Movement, Interaction, Basic Needs, Business, Info
- Each section lists commands with descriptions
- Note about auto-save

**No State Changes**

---

## 10. SAVE/LOAD SYSTEM

### Command: `save`

**Expected Behavior:**
- Serialize entire gameState to JSON
- Store in localStorage as 'lifeparser_save'
- Store timestamp in 'lifeparser_save_timestamp'
- Display formatted confirmation:
  ```
  ═══════════════════════════════════════════════════
  GAME SAVED
  Saved at: [timestamp]
  Your progress has been automatically saved to your browser.
  ═══════════════════════════════════════════════════
  ```

**State Changes:**
- localStorage['lifeparser_save'] → JSON state
- localStorage['lifeparser_save_timestamp'] → ISO timestamp

---

### Command: `load`

**Preconditions:**
- Save must exist in localStorage

**Expected Behavior:**
1. If save exists:
   - Load state from localStorage
   - Merge with default state for forward compatibility
   - Update all UI elements
   - Display confirmation with timestamp
   - Display current location description

2. If no save:
   - Error: "No saved game found."
   - No state changes

**State Changes:**
- Entire gameState replaced with loaded state
- All UI elements updated

---

### Auto-Save

**Trigger:**
- After every command execution (in processCommand)

**Expected Behavior:**
- Silent save (no message)
- Updates localStorage

---

### Auto-Load (On Start)

**Trigger:**
- When game initializes (GameEngine.init)

**Expected Behavior:**
1. If save exists:
   - Auto-load state
   - Display message:
     ```
     ═══════════════════════════════════════════════════
     SAVE GAME LOADED
     Last saved: [timestamp]
     ═══════════════════════════════════════════════════
     ```
   - Show current location
   - No welcome message

2. If no save:
   - Initialize fresh game state
   - Show welcome message
   - Show starting location

---

## 11. TIME PROGRESSION

### Time Advancement Rules

**Per Command:**
- Movement: +15 minutes
- Talk: +10 minutes
- Work (gym): +60 minutes
- Work (cafe): +240 minutes
- Sleep: +480 minutes
- Eat (home): +30 minutes
- Eat (cafe): +20 minutes
- Loan: +30 minutes
- Apply: +15 minutes

### Hour Rollover
**When minutes ≥ 60:**
- Subtract 60 from minutes
- Add 1 to hour

### Day Rollover
**When hours ≥ 24:**
- Subtract 24 from hours
- Add 1 to day
- If owns cafe: Add $200 revenue with message

### Passive Stat Changes
**Per hour that passes:**
- Energy: -2 per hour
- Hunger: +3 per hour

**When hunger ≥ 80:**
- Health: -5 (additional penalty)

---

## 12. STAT BOUNDARIES

### Enforced Ranges

| Stat | Minimum | Maximum | Notes |
|------|---------|---------|-------|
| Health | 0 | 100 | No game over at 0 |
| Energy | 0 | 100 | No game over at 0 |
| Hunger | 0 | 100 | Penalty at 80+ |
| Money | 0 | ∞ | Can't go negative |
| Skills | 0 | 100 | Intelligence, Charisma, Strength, Business |

### UI Color Coding

**Health & Energy:**
- < 30: Red (error class)
- 30-59: Yellow (warning class)
- ≥ 60: Normal

**Hunger:**
- > 70: Red (error class)
- 50-70: Yellow (warning class)
- < 50: Normal

---

## 13. RANDOM EVENTS

### Trigger Conditions
- 5% chance per command (`randomEventChance: 0.05`)
- Only after day 2 (`minDayForEvents: 2`)

### Event Display Format
```
═════════════════════════════════════
[EVENT TITLE]
[Event description text]
═════════════════════════════════════
```

### Available Events

**Lucky Find:**
- Title: "LUCKY FIND"
- Text: "You find a $20 bill on the ground!"
- Effect: +$20 money

**Helpful Stranger:**
- Title: "HELPFUL STRANGER"
- Text: "A stranger gives you a productivity tip. You feel inspired!"
- Effect: +1 intelligence

---

## 14. ERROR MESSAGES

### Standard Error Responses

| Situation | Message |
|-----------|---------|
| Unknown command | "I don't understand '[input]'. Try 'help' for available commands." |
| Invalid location | "You can't go there from here." + exits list |
| Unreachable location | "You can't reach [location] from here." + exits list |
| NPC not present | "There's no one like that here." |
| Insufficient funds (gym) | "You don't have enough money for a gym session ($20)." |
| Insufficient funds (food) | "You don't have enough money for food ($[cost])." |
| Insufficient funds (cafe food) | "You don't have enough money for café food ($15)." |
| Insufficient funds (cafe purchase) | "You need $50000 to buy the café. Keep working and saving!" |
| No job | "You need to apply for a job first. Try 'apply for job'." |
| Already has job | "You already work here!" |
| No job openings | "There are no job openings here." |
| Can't work here | "There's nothing to work on here." |
| Sleep not at home | "You need to go home to sleep properly." |
| Can't eat here | "You can't eat here. Try going home or to a café." |
| Loan not at bank | "You need to be at the bank to get a loan." |
| Loan invalid amount | "Loans are available from $5000 to $50000." |
| Can't buy | "You can't buy that right now." |
| No save | "No saved game found." |
| Talk to whom | "Talk to whom?" |

---

## 15. DATA LOADING

### Required Files
1. `/data/config.json` - Game configuration
2. `/data/locations.json` - Location definitions
3. `/data/npcs.json` - NPC dialogue
4. `/data/items.json` - Item definitions
5. `/data/events.json` - Random events

### Load Failure Behavior
- Display loading screen
- On error: Show error message with filename
- Suggest page refresh
- Game does not start

### Validation
- All required fields present in each data file
- Location exits reference valid locations
- Config values are correct types

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-25 | Initial documentation | GitHub Copilot Agent |

---

**Note:** This document serves as the source of truth for expected game behavior. Any deviations found during testing should be logged as bugs unless intentional design changes are made.
