# Command Reference Guide
## LifeParser - Complete Command Documentation

**Quick navigation:** [Movement](#movement) | [Interaction](#interaction) | [Needs](#basic-needs) | [Business](#business) | [Information](#information) | [System](#system)

---

## MOVEMENT

### go to [location]

**Purpose:** Travel to a different location  
**Aliases:** `goto`, `walk to`, `travel to`, `move to`, `head to`, `run to`, `enter`

**Available Locations:**
- `home` - Your Apartment
- `street` - Main Street (hub)
- `cafe` - Coffee Bean Café
- `gym` - 24/7 Fitness Gym
- `bank` - First National Bank

**Examples:**
```
go to cafe
goto bank
walk to gym
travel to home
```

**Effects:**
- Energy: -5
- Time: +15 minutes

**Location Map:**
```
      gym
       |
home - street - cafe
       |
      bank
```

---

### look around

**Purpose:** Examine current location  
**Aliases:** `look`

**Examples:**
```
look around
look
```

**Effects:**
- No stat changes
- Displays: location name, description, NPCs, exits, actions

---

## INTERACTION

### talk to [person]

**Purpose:** Converse with NPCs  
**Aliases:** `speak with`, `speak to`, `chat with`, `ask`, `tell`, `discuss`, `greet`

**NPCs by Location:**
- **Cafe:** owner, barista
- **Gym:** trainer
- **Bank:** loan officer

**Examples:**
```
talk to owner
speak with trainer
chat with barista
```

**Effects:**
- Time: +10 minutes

---

### work

**Purpose:** Perform activities at current location  
**Aliases:** `workout`, `exercise` (at gym only)

**At Gym:**
- Cost: $20
- Time: +60 minutes
- Money: -$20
- Energy: -30
- Hunger: +20
- Strength: +2

**At Cafe:**
- Requirements: Must have job (use `apply for job`)
- Time: +240 minutes (4 hours)
- Money: +$60
- Energy: -25
- Hunger: +15
- Business Skill: +1

**Examples:**
```
work
workout (at gym)
exercise (at gym)
```

---

### apply for job

**Purpose:** Get hired at the cafe  
**Requirements:** Must be at cafe

**Effects:**
- Time: +15 minutes
- Sets job flag (can now work at cafe)

**Example:**
```
apply for job
```

**Note:** Can only be done once. Wage is $60 per 4-hour shift.

---

## BASIC NEEDS

### sleep

**Purpose:** Rest and restore energy  
**Aliases:** `rest`, `nap`  
**Requirements:** Must be at home

**Effects:**
- Time: +480 minutes (8 hours)
- Energy: Set to 100
- Hunger: +30

**Examples:**
```
sleep
rest
nap
```

**Note:** If sleep causes day rollover and you own the cafe, you'll earn $200 revenue.

---

### eat

**Purpose:** Reduce hunger  
**Aliases:** `drink`

**At Home:**
- Cost: $10
- Time: +30 minutes
- Money: -$10
- Hunger: -40

**At Cafe:**
- Cost: $15
- Time: +20 minutes
- Money: -$15
- Hunger: -50

**Examples:**
```
eat
drink
```

**Note:** Cannot eat at gym, bank, or street.

---

## BUSINESS

### take loan

**Purpose:** Get a business loan from the bank  
**Aliases:** `get loan`, `request loan`  
**Requirements:** Must be at bank

**Loan Amounts:**
- Minimum: $5,000
- Maximum: $50,000
- Default (if not specified): $10,000

**Examples:**
```
take loan              (gets $10,000)
take loan for 5000     (gets $5,000)
take loan for 50000    (gets $50,000)
get loan
request loan for 20000
```

**Effects:**
- Time: +30 minutes
- Money: +[loan amount]

**Note:** Interest rate is 8% (informational, not enforced in current version).

---

### buy [item]

**Purpose:** Purchase businesses or items  
**Aliases:** `purchase`, `buy`

**Available Purchases:**
- **Cafe:** $50,000

**Examples:**
```
buy cafe
purchase cafe
```

**Effects (Cafe):**
- Money: -$50,000
- Sets ownership flag
- Generates $200/day passive income

---

## INFORMATION

### stats

**Purpose:** Display full character statistics

**Example:**
```
stats
```

**Shows:**
- Day and time
- Physical: Health, Energy, Hunger
- Skills: Intelligence, Charisma, Strength, Business
- Financial: Cash, Businesses

---

### check [thing]

**Purpose:** Examine specific aspects  
**Aliases:** `examine`, `view`, `show`, `read`, `inspect`

**What You Can Check:**
- `stats` or `character` - Full stats
- `money`, `balance`, or `cash` - Current money
- `health` - Health value
- `time` - Current day and time
- `business` or `cafe` - Business ownership
- Anything else - Generic examination

**Examples:**
```
check stats
check money
check health
check time
check business
examine cafe
```

---

### inventory

**Purpose:** View your items  
**Aliases:** `inv`, `items`

**Examples:**
```
inventory
inv
items
```

**Default Items:**
- phone
- wallet
- keys

---

### help

**Purpose:** Show available commands  
**Aliases:** `commands`, `?`

**Examples:**
```
help
?
commands
```

---

## SYSTEM

### save

**Purpose:** Manually save your game

**Example:**
```
save
```

**Effects:**
- Saves game state to browser localStorage
- Shows confirmation with timestamp

**Note:** Game auto-saves after every command.

---

### load

**Purpose:** Manually reload your saved game

**Example:**
```
load
```

**Effects:**
- Restores game from localStorage
- Shows timestamp of save

**Note:** Game auto-loads on page load if save exists.

---

## GAME MECHANICS

### Time System

**12-Hour Format:** Commands display time like "8:00 AM" or "11:30 PM"

**Time Advancement:**
- Every command advances time
- 60 minutes → 1 hour increment
- 24 hours → 1 day increment

**Day Rollover:**
- Day counter increases
- If you own cafe: +$200 revenue

---

### Passive Stat Changes

**Over Time (per hour):**
- Energy: -2
- Hunger: +3

**Hunger Penalty:**
- When hunger ≥ 80: Health -5 per advancement

---

### Stat Ranges

| Stat | Min | Max | Notes |
|------|-----|-----|-------|
| Health | 0 | 100 | Game continues at 0 |
| Energy | 0 | 100 | Game continues at 0 |
| Hunger | 0 | 100 | Penalty at 80+ |
| Money | 0 | ∞ | Cannot go negative |
| All Skills | 0 | 100 | Intelligence, Charisma, Strength, Business |

---

### UI Color Indicators

**Health & Energy:**
- 🔴 Red: < 30
- 🟡 Yellow: 30-59
- ⚪ Normal: 60+

**Hunger:**
- 🔴 Red: > 70
- 🟡 Yellow: 50-70
- ⚪ Normal: < 50

---

### Random Events

**Trigger Conditions:**
- 5% chance per command
- Only after Day 2

**Events:**
1. **Lucky Find:** Find $20
2. **Helpful Stranger:** +1 Intelligence

---

## PARSER FEATURES

### Natural Language

The parser understands natural variations of commands:
- Case insensitive: `HELP`, `help`, `HeLp` all work
- Partial matching: `go to caf` matches "cafe"
- Flexible syntax: "the" and "a" are optional

### Examples of Flexible Input

```
✓ go to the cafe
✓ go to cafe
✓ goto cafe
✓ walk to the cafe
✓ travel to cafe

✓ talk to the owner
✓ talk to owner
✓ speak with owner
✓ chat with the barista
```

---

## TIPS & STRATEGIES

### Getting Started
1. Use `help` to see all commands
2. Use `stats` to check your character
3. Explore locations with `look around`
4. Get a job at the cafe to earn money

### Earning Money
- **Early game:** Apply at cafe, work shifts ($60 per 4 hours)
- **Mid game:** Take loans from bank ($5k-$50k available)
- **Late game:** Buy cafe for passive income ($200/day)

### Managing Needs
- **Energy:** Sleep at home (restores to 100)
- **Hunger:** Eat at home ($10) or cafe ($15, more effective)
- **Health:** Maintain hunger below 80 to prevent health drain

### Building Skills
- **Strength:** Work out at gym (+2 per session, costs $20)
- **Business:** Work at cafe (+1 per shift)
- **Intelligence:** Random events only (currently)

### Time Management
- Working at cafe takes 4 hours (longest activity)
- Sleeping takes 8 hours (useful for day rollovers)
- Plan activities to maximize efficiency

---

## SAVE SYSTEM

### Auto-Save
- Happens after every command
- Completely automatic
- No action needed

### Manual Save
- Command: `save`
- Shows confirmation
- Useful before risky actions

### Auto-Load
- Happens on page load
- Shows timestamp of last save
- Seamless game continuation

### Manual Load
- Command: `load`
- Restores last save
- Shows when save was made

### Storage Location
- Browser localStorage
- Key: `lifeparser_save`
- Persists across sessions
- Cleared if you clear browser data

---

## ERROR MESSAGES

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "I don't understand..." | Unknown command | Use `help` to see valid commands |
| "You can't go there..." | Invalid/unreachable location | Check `look around` for exits |
| "There's no one like that here" | NPC not at location | Go to correct location |
| "You don't have enough money" | Insufficient funds | Work at cafe or take loan |
| "You need to apply for a job first" | Working at cafe without job | Use `apply for job` at cafe |
| "You need to go home to sleep" | Trying to sleep elsewhere | Go home first |
| "You can't eat here" | Wrong location for eating | Go home or cafe |
| "You need to be at the bank" | Loan request elsewhere | Go to bank |
| "No saved game found" | Loading when no save exists | Start new game |

---

## QUICK REFERENCE TABLE

| Category | Commands | Location | Cost/Gain |
|----------|----------|----------|-----------|
| **Move** | go to [place] | Any → Connected | -5 energy |
| **Look** | look around | Any | Free |
| **Talk** | talk to [npc] | Where NPC is | Free |
| **Apply** | apply for job | Cafe | Free |
| **Work Cafe** | work | Cafe (with job) | +$60 |
| **Work Gym** | work/workout | Gym | -$20 |
| **Sleep** | sleep | Home | Energy→100 |
| **Eat Home** | eat | Home | -$10 |
| **Eat Cafe** | eat | Cafe | -$15 |
| **Loan** | take loan | Bank | +$10k default |
| **Buy Cafe** | buy cafe | Anywhere | -$50k |
| **Stats** | stats | Anywhere | Free |
| **Check** | check [thing] | Anywhere | Free |
| **Inventory** | inventory | Anywhere | Free |
| **Help** | help | Anywhere | Free |
| **Save** | save | Anywhere | Free |
| **Load** | load | Anywhere | Free |

---

## VERSION INFORMATION

**Game Version:** 1.0  
**Documentation Version:** 1.0  
**Last Updated:** 2025-10-25

---

## ADDITIONAL RESOURCES

- **Full Test Plan:** See `docs/TEST_PLAN.md`
- **Expected Behaviors:** See `docs/EXPECTED_OUTCOMES.md`
- **Manual Testing Script:** See `docs/MANUAL_TEST_SCRIPT.md`
- **Quick Checklist:** See `docs/TESTING_CHECKLIST.md`

---

**Need help?** Type `help` in the game for an in-game command reference!
