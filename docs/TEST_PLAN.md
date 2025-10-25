# Phase 1: Rigorous Verification Test Plan
## LifeParser Game Mechanics Testing

**Version:** 1.0  
**Date:** 2025-10-25  
**Purpose:** Comprehensive testing and verification of all game commands and mechanics after modular/data-driven refactor

---

## Test Environment Setup

### Prerequisites
1. Node.js (v14 or higher) installed
2. Dependencies installed via `npm install`
3. Development server running via `npm start`
4. Clean browser state (clear localStorage before testing)

### Browser Testing
- Primary: Chrome/Edge (latest)
- Secondary: Firefox, Safari
- Clear browser cache and localStorage between major test sections

---

## 1. MOVEMENT COMMANDS

### 1.1 Basic Movement (go to [location])

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| MC-001 | `go to cafe` | Travel to Coffee Bean Café, energy -5, time +15min | ⬜ |
| MC-002 | `go to gym` | Travel to 24/7 Fitness Gym, energy -5, time +15min | ⬜ |
| MC-003 | `go to bank` | Travel to First National Bank, energy -5, time +15min | ⬜ |
| MC-004 | `go to home` | Travel to Your Apartment, energy -5, time +15min | ⬜ |
| MC-005 | `go to street` | Travel to Main Street, energy -5, time +15min | ⬜ |
| MC-006 | `goto cafe` | Should work (alternate syntax) | ⬜ |
| MC-007 | `go cafe` | Should fail with error message | ⬜ |
| MC-008 | `go to xyz` | Error: "You can't go there from here" | ⬜ |
| MC-009 | `walk to cafe` | Should work (synonym) | ⬜ |
| MC-010 | `travel to bank` | Should work (synonym) | ⬜ |

**Exit Connections to Test:**
- From home: street only
- From street: gym, cafe, bank, home
- From gym: street only
- From cafe: street only
- From bank: street only

### 1.2 Location Description (look around)

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| MC-011 | `look around` | Display current location description | ⬜ |
| MC-012 | `look` | Same as look around | ⬜ |
| MC-013 | Look at each location | Verify description, NPCs, exits, actions | ⬜ |

---

## 2. INTERACTION COMMANDS

### 2.1 Conversation (talk to [person])

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IC-001 | `talk to owner` (at cafe) | Display owner's dialogue, time +10min | ⬜ |
| IC-002 | `talk to barista` (at cafe) | Display barista's dialogue, time +10min | ⬜ |
| IC-003 | `talk to trainer` (at gym) | Display trainer's dialogue, time +10min | ⬜ |
| IC-004 | `talk to loan officer` (at bank) | Display loan officer's dialogue, time +10min | ⬜ |
| IC-005 | `talk to nobody` | Error: "There's no one like that here" | ⬜ |
| IC-006 | `speak with owner` | Should work (synonym) | ⬜ |
| IC-007 | `chat with trainer` | Should work (synonym) | ⬜ |
| IC-008 | Talk when NPC not present | Error message | ⬜ |

### 2.2 Work System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IC-009 | `work` at gym (with $20) | -$20 money, -30 energy, +20 hunger, +2 strength, +60min time | ⬜ |
| IC-010 | `work` at gym (no money) | Error: "don't have enough money" | ⬜ |
| IC-011 | `work` at cafe (no job) | Error: "need to apply for a job first" | ⬜ |
| IC-012 | `work` at cafe (with job) | +$60 money, -25 energy, +15 hunger, +1 business skill, +240min time | ⬜ |
| IC-013 | `work` at home | Error: "nothing to work on here" | ⬜ |
| IC-014 | `workout` at gym | Should work same as work | ⬜ |
| IC-015 | `exercise` at gym | Should work same as work | ⬜ |

### 2.3 Job Application

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IC-016 | `apply for job` at cafe | Get hired, time +15min, flag hasJob = true | ⬜ |
| IC-017 | `apply for job` (already hired) | Error: "already work here" | ⬜ |
| IC-018 | `apply for job` elsewhere | Error: "no job openings here" | ⬜ |

---

## 3. BASIC NEEDS COMMANDS

### 3.1 Sleep System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| BN-001 | `sleep` at home | Energy = 100, +480min time, +30 hunger | ⬜ |
| BN-002 | `sleep` not at home | Error: "need to go home to sleep" | ⬜ |
| BN-003 | `rest` at home | Should work same as sleep | ⬜ |
| BN-004 | `nap` at home | Should work same as sleep | ⬜ |
| BN-005 | Sleep causing day rollover | Verify day increments, cafe revenue if owned | ⬜ |

### 3.2 Eating System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| BN-006 | `eat` at home (with $10) | -$10 money, -40 hunger, +30min time | ⬜ |
| BN-007 | `eat` at home (no money) | Error: "don't have enough money" | ⬜ |
| BN-008 | `eat` at cafe (with $15) | -$15 money, -50 hunger, +20min time | ⬜ |
| BN-009 | `eat` at cafe (no money) | Error: "don't have enough money" | ⬜ |
| BN-010 | `eat` at gym/bank/street | Error: "can't eat here" | ⬜ |
| BN-011 | `drink` anywhere | Should work same as eat | ⬜ |

---

## 4. BUSINESS COMMANDS

### 4.1 Loan System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| BS-001 | `take loan` at bank | +$10000 money (default), +30min time | ⬜ |
| BS-002 | `take loan` not at bank | Error: "need to be at the bank" | ⬜ |
| BS-003 | `get loan` at bank | Should work (synonym) | ⬜ |
| BS-004 | `request loan` at bank | Should work (synonym) | ⬜ |
| BS-005 | `take loan for 5000` | +$5000 money (min amount) | ⬜ |
| BS-006 | `take loan for 50000` | +$50000 money (max amount) | ⬜ |
| BS-007 | `take loan for 1000` | Error: amount below min | ⬜ |
| BS-008 | `take loan for 100000` | Error: amount above max | ⬜ |

### 4.2 Business Purchase

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| BS-009 | `buy cafe` (with $50000) | -$50000 money, ownsCafe flag = true, success message | ⬜ |
| BS-010 | `buy cafe` (no money) | Error: "need $50000" | ⬜ |
| BS-011 | `purchase cafe` | Should work (synonym) | ⬜ |
| BS-012 | `buy xyz` | Error: "can't buy that" | ⬜ |
| BS-013 | Cafe daily revenue | +$200/day when day advances | ⬜ |

---

## 5. INFORMATION/SYSTEM COMMANDS

### 5.1 Stats Display

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IS-001 | `stats` | Display full character stats (all values) | ⬜ |
| IS-002 | Verify stats format | Day, time, physical, skills, financial sections | ⬜ |

### 5.2 Check/Examine System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IS-003 | `check stats` | Display full character stats | ⬜ |
| IS-004 | `check character` | Display current money amount | ⬜ |
| IS-005 | `check money` | Display current money amount | ⬜ |
| IS-006 | `check balance` | Display current money amount | ⬜ |
| IS-007 | `check cash` | Display current money amount | ⬜ |
| IS-008 | `check health` | Display current health value | ⬜ |
| IS-009 | `check time` | Display current day and time | ⬜ |
| IS-010 | `check business` | Display owned businesses or "none" | ⬜ |
| IS-011 | `check cafe` | Display cafe ownership status | ⬜ |
| IS-012 | `check xyz` | Generic "nothing special" message | ⬜ |

### 5.3 Inventory System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IS-013 | `inventory` | Display: phone, wallet, keys | ⬜ |
| IS-014 | `inv` | Should work (shorthand) | ⬜ |
| IS-015 | `items` | Should work (synonym) | ⬜ |

### 5.4 Help System

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| IS-016 | `help` | Display all available commands | ⬜ |
| IS-017 | `?` | Should work same as help | ⬜ |
| IS-018 | `commands` | Should work same as help | ⬜ |
| IS-019 | Verify help sections | Movement, Interaction, Basic Needs, Business, Info | ⬜ |

---

## 6. SAVE/LOAD SYSTEM

### 6.1 Save Functionality

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| SL-001 | `save` | Manual save confirmation with timestamp | ⬜ |
| SL-002 | Auto-save | Occurs after every command | ⬜ |
| SL-003 | Save persistence | Verify localStorage contains save data | ⬜ |
| SL-004 | Save timestamp | Verify timestamp is stored | ⬜ |

### 6.2 Load Functionality

| Test Case | Command | Expected Outcome | Status |
|-----------|---------|------------------|--------|
| SL-005 | `load` | Reload game from save with timestamp | ⬜ |
| SL-006 | Auto-load on startup | Game loads automatically on page load | ⬜ |
| SL-007 | Load with no save | Error: "No saved game found" | ⬜ |
| SL-008 | Save/Load integrity | All state preserved correctly | ⬜ |

### 6.3 Save/Load State Verification

| Test Case | State to Verify | Expected Behavior | Status |
|-----------|-----------------|-------------------|--------|
| SL-009 | Character stats | All preserved | ⬜ |
| SL-010 | Current location | Preserved | ⬜ |
| SL-011 | Inventory items | All preserved | ⬜ |
| SL-012 | Flags (hasJob, ownsCafe) | All preserved | ⬜ |
| SL-013 | Day/time | Preserved | ⬜ |
| SL-014 | Money | Preserved | ⬜ |
| SL-015 | Command history | Preserved | ⬜ |

---

## 7. GAME STATE & TIME PROGRESSION

### 7.1 Time System

| Test Case | Scenario | Expected Outcome | Status |
|-----------|----------|------------------|--------|
| TS-001 | 60 minutes pass | Hour increments by 1 | ⬜ |
| TS-002 | 24 hours pass | Day increments by 1 | ⬜ |
| TS-003 | Day rollover with cafe | Revenue added ($200) | ⬜ |
| TS-004 | Time display format | 12-hour format with AM/PM | ⬜ |
| TS-005 | Time advancement | Correct for each action | ⬜ |

### 7.2 Stat Modifications

| Test Case | Scenario | Expected Outcome | Status |
|-----------|----------|------------------|--------|
| TS-006 | Energy depletion | Decreases over time (2 per hour) | ⬜ |
| TS-007 | Hunger increase | Increases over time (3 per hour) | ⬜ |
| TS-008 | Health from hunger | Health -5 when hunger >= 80 | ⬜ |
| TS-009 | Energy bounds | Stays between 0-100 | ⬜ |
| TS-010 | Hunger bounds | Stays between 0-100 | ⬜ |
| TS-011 | Health bounds | Stays between 0-100 | ⬜ |
| TS-012 | Money never negative | Stays >= 0 | ⬜ |

### 7.3 UI Updates

| Test Case | Element | Expected Behavior | Status |
|-----------|---------|-------------------|--------|
| UI-001 | Day display | Updates in real-time | ⬜ |
| UI-002 | Time display | Updates with proper format | ⬜ |
| UI-003 | Money display | Updates immediately | ⬜ |
| UI-004 | Health color | Red (<30), yellow (30-60), normal (>60) | ⬜ |
| UI-005 | Energy color | Red (<30), yellow (30-60), normal (>60) | ⬜ |
| UI-006 | Hunger color | Red (>70), yellow (50-70), normal (<50) | ⬜ |

---

## 8. RANDOM EVENTS SYSTEM

### 8.1 Event Triggering

| Test Case | Scenario | Expected Outcome | Status |
|-----------|----------|------------------|--------|
| RE-001 | Events before day 2 | No events trigger (minDayForEvents = 2) | ⬜ |
| RE-002 | Events after day 2 | 5% chance per command | ⬜ |
| RE-003 | Event display | Formatted with title and description | ⬜ |

### 8.2 Event Effects

| Test Case | Event | Expected Effect | Status |
|-----------|-------|-----------------|--------|
| RE-004 | Lucky Find | +$20 money | ⬜ |
| RE-005 | Helpful Stranger | +1 intelligence | ⬜ |

---

## 9. NATURAL LANGUAGE PARSING

### 9.1 Command Variations

| Test Case | Variations | Should Work | Status |
|-----------|-----------|-------------|--------|
| NLP-001 | Movement | go to, goto, walk to, travel to, head to | ⬜ |
| NLP-002 | Talking | talk to, speak to, chat with, ask | ⬜ |
| NLP-003 | Looking | look, look around | ⬜ |
| NLP-004 | Working | work, workout, exercise (at gym) | ⬜ |
| NLP-005 | Sleeping | sleep, rest, nap | ⬜ |
| NLP-006 | Eating | eat, drink | ⬜ |
| NLP-007 | Examining | check, examine, view, show | ⬜ |
| NLP-008 | Inventory | inventory, inv, items | ⬜ |
| NLP-009 | Help | help, commands, ? | ⬜ |

### 9.2 Fuzzy Matching

| Test Case | Input | Expected Match | Status |
|-----------|-------|----------------|--------|
| NLP-010 | "go to caf" | Match "cafe" | ⬜ |
| NLP-011 | "talk to own" | Match "owner" | ⬜ |
| NLP-012 | Case insensitive | All commands work in any case | ⬜ |

---

## 10. ERROR HANDLING

### 10.1 Command Errors

| Test Case | Invalid Input | Expected Error | Status |
|-----------|---------------|----------------|--------|
| EH-001 | Empty command | No response, no error | ⬜ |
| EH-002 | Unknown command | "I don't understand..." | ⬜ |
| EH-003 | Invalid location | "You can't go there from here" | ⬜ |
| EH-004 | Missing NPC | "There's no one like that here" | ⬜ |
| EH-005 | Insufficient funds | Appropriate error message | ⬜ |
| EH-006 | Wrong location | Appropriate error message | ⬜ |

---

## 11. DATA-DRIVEN VERIFICATION

### 11.1 Config Data Loading

| Test Case | Data File | Expected Result | Status |
|-----------|-----------|-----------------|--------|
| DD-001 | config.json | Loads correctly | ⬜ |
| DD-002 | locations.json | Loads correctly | ⬜ |
| DD-003 | npcs.json | Loads correctly | ⬜ |
| DD-004 | items.json | Loads correctly | ⬜ |
| DD-005 | events.json | Loads correctly | ⬜ |
| DD-006 | Missing data file | Error message displayed | ⬜ |
| DD-007 | Invalid JSON | Error message displayed | ⬜ |

### 11.2 Config Values Usage

| Test Case | Config Value | Usage Location | Status |
|-----------|--------------|----------------|--------|
| DD-008 | initialMoney ($500) | Character creation | ⬜ |
| DD-009 | gymSession ($20) | Gym work cost | ⬜ |
| DD-010 | cafeWage ($60) | Cafe work payment | ⬜ |
| DD-011 | cafePrice ($50000) | Cafe purchase cost | ⬜ |
| DD-012 | cafeRevenue ($200) | Daily income | ⬜ |
| DD-013 | homeMeal ($10) | Home eating cost | ⬜ |
| DD-014 | cafeMeal ($15) | Cafe eating cost | ⬜ |
| DD-015 | Loan min/max | Loan validation | ⬜ |
| DD-016 | Interest rate (8%) | Loan message | ⬜ |
| DD-017 | randomEventChance (5%) | Event triggering | ⬜ |
| DD-018 | minDayForEvents (2) | Event filtering | ⬜ |

---

## 12. REGRESSION TEST SCENARIOS

### 12.1 Complete Gameplay Flow

| Test Case | Scenario | Steps | Status |
|-----------|----------|-------|--------|
| REG-001 | New player tutorial | Start → help → look → go to cafe | ⬜ |
| REG-002 | Job acquisition | Go to cafe → apply → work → earn money | ⬜ |
| REG-003 | Loan & purchase | Go to bank → loan → save → buy cafe | ⬜ |
| REG-004 | Basic needs | Eat → sleep → verify stat changes | ⬜ |
| REG-005 | Multi-day progression | Play through 3+ days, verify all systems | ⬜ |
| REG-006 | Save/Load cycle | Save → close → reopen → load → verify | ⬜ |
| REG-007 | Stat boundary testing | Deplete energy/health, verify behavior | ⬜ |

### 12.2 Edge Cases

| Test Case | Scenario | Expected Behavior | Status |
|-----------|----------|-------------------|--------|
| EC-001 | Energy = 0 | Player can still act (no game over) | ⬜ |
| EC-002 | Health = 0 | Player can still act (no game over) | ⬜ |
| EC-003 | Hunger = 100 | Continued health drain | ⬜ |
| EC-004 | Money = 0 | Can't afford anything | ⬜ |
| EC-005 | 24+ hour play session | Multiple day rollovers work | ⬜ |
| EC-006 | Rapid command entry | No race conditions | ⬜ |

---

## Test Execution Log

### Test Session Information
- **Tester:** _______________
- **Date:** _______________
- **Browser:** _______________
- **Build Version:** _______________

### Summary Statistics
- Total Test Cases: 200+
- Passed: ___
- Failed: ___
- Blocked: ___
- Not Tested: ___

### Critical Issues Found
1. 
2. 
3. 

### Non-Critical Issues Found
1. 
2. 
3. 

### Notes and Observations
- 
- 
- 

---

## Sign-Off

**Test Plan Created By:** GitHub Copilot Agent  
**Test Plan Approved By:** _______________  
**Date:** _______________

**Testing Completed By:** _______________  
**Testing Completed Date:** _______________  
**Result:** PASS / FAIL / CONDITIONAL PASS
