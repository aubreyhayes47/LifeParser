# Phase 1: Testing Quick Reference Checklist

## Quick Command Reference

### Movement Commands
- [ ] `go to [location]` - Test with: cafe, gym, bank, home, street
- [ ] `goto [location]` - Alternative syntax
- [ ] `walk to [location]` - Synonym
- [ ] `travel to [location]` - Synonym
- [ ] `look around` - Display location
- [ ] `look` - Alternative

### Interaction Commands
- [ ] `talk to [person]` - Test with: owner, barista, trainer, loan officer
- [ ] `speak with [person]` - Synonym
- [ ] `chat with [person]` - Synonym
- [ ] `work` - At gym (costs $20) or cafe (needs job)
- [ ] `workout` - Synonym at gym
- [ ] `exercise` - Synonym at gym
- [ ] `apply for job` - At cafe only

### Basic Needs
- [ ] `sleep` - At home only, restores energy
- [ ] `rest` - Synonym
- [ ] `nap` - Synonym
- [ ] `eat` - At home ($10) or cafe ($15)
- [ ] `drink` - Synonym

### Business Commands
- [ ] `take loan` - At bank, default $10,000
- [ ] `take loan for [amount]` - Specify amount (5k-50k)
- [ ] `get loan` - Synonym
- [ ] `request loan` - Synonym
- [ ] `buy cafe` - Costs $50,000
- [ ] `purchase cafe` - Synonym

### Info Commands
- [ ] `stats` - Full character stats
- [ ] `check [thing]` - money, health, time, business, etc.
- [ ] `inventory` / `inv` / `items` - Show inventory
- [ ] `help` / `?` / `commands` - Show help
- [ ] `save` - Manual save
- [ ] `load` - Manual load

---

## Critical Path Testing (30 minutes)

### Test 1: Initial State (5 min)
1. [ ] Start new game (clear localStorage)
2. [ ] Verify initial stats: $500, Day 1, 8:00 AM
3. [ ] Verify location: Your Apartment
4. [ ] Run `help` command
5. [ ] Run `stats` command
6. [ ] Run `inventory` command

### Test 2: Movement & Exploration (5 min)
1. [ ] `look around` at home
2. [ ] `go to street`
3. [ ] `look around` at street
4. [ ] `go to cafe`
5. [ ] `go to street`
6. [ ] `go to gym`
7. [ ] `go to street`
8. [ ] `go to bank`
9. [ ] `go to street`
10. [ ] `go to home`

### Test 3: Job System (5 min)
1. [ ] `go to cafe`
2. [ ] `apply for job`
3. [ ] Verify success message
4. [ ] `work` (should earn $60)
5. [ ] Verify stats: money increased, energy decreased
6. [ ] `work` again
7. [ ] Verify stats updated again

### Test 4: Basic Needs (5 min)
1. [ ] `go to home`
2. [ ] `eat` (should cost $10)
3. [ ] Verify hunger decreased
4. [ ] `sleep`
5. [ ] Verify energy = 100
6. [ ] Verify time advanced 8 hours

### Test 5: Business Operations (5 min)
1. [ ] `go to bank`
2. [ ] `take loan` (get $10,000)
3. [ ] Verify money increased
4. [ ] Work multiple times at cafe to earn money
5. [ ] Check if have $50,000
6. [ ] `buy cafe` (if have money)
7. [ ] Verify ownership message

### Test 6: Save/Load (5 min)
1. [ ] Note current stats (day, time, money, location)
2. [ ] `save` command
3. [ ] Verify save confirmation
4. [ ] Refresh browser
5. [ ] Verify auto-load message
6. [ ] Verify all stats match previous state
7. [ ] `load` command
8. [ ] Verify load confirmation

---

## Edge Cases Testing (15 minutes)

### Energy/Health Depletion
- [ ] Work repeatedly until energy < 30 (should show yellow)
- [ ] Continue until energy < 10
- [ ] Verify game still playable
- [ ] Sleep to restore energy

### Hunger System
- [ ] Don't eat for extended time
- [ ] Let hunger reach > 80
- [ ] Verify health starts decreasing
- [ ] Eat to reduce hunger

### Money Constraints
- [ ] Try to eat with $0 money (spend all money first)
- [ ] Try to work at gym with < $20
- [ ] Try to buy cafe without $50,000
- [ ] Verify all error messages appropriate

### Invalid Commands
- [ ] Type random gibberish
- [ ] Try to go to invalid location
- [ ] Try to talk to non-existent NPC
- [ ] Try commands at wrong locations
- [ ] Verify error messages clear and helpful

### Time Progression
- [ ] Perform actions that advance time
- [ ] Watch minute → hour rollover
- [ ] Watch hour → day rollover
- [ ] If own cafe, verify daily revenue on day change

---

## Data-Driven Testing (10 minutes)

### Config Values Verification
- [ ] Initial money = $500 ✓
- [ ] Gym session = $20 ✓
- [ ] Cafe wage = $60 ✓
- [ ] Home meal = $10 ✓
- [ ] Cafe meal = $15 ✓
- [ ] Cafe price = $50,000 ✓
- [ ] Cafe revenue = $200/day ✓
- [ ] Loan min = $5,000 ✓
- [ ] Loan max = $50,000 ✓

### Location Data
- [ ] All 5 locations load correctly
- [ ] All location descriptions display
- [ ] All NPCs appear in correct locations
- [ ] All exits work as expected

### Events (if triggered)
- [ ] Lucky Find: +$20 ✓
- [ ] Helpful Stranger: +1 intelligence ✓

---

## Regression Issues Log

### Critical Issues
| ID | Description | Severity | Steps to Reproduce | Status |
|----|-------------|----------|-------------------|--------|
| | | | | |

### Non-Critical Issues
| ID | Description | Severity | Steps to Reproduce | Status |
|----|-------------|----------|-------------------|--------|
| | | | | |

### Observations
- 
- 
- 

---

## Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Duration:** _______________  
**Result:** PASS / FAIL / CONDITIONAL

**Notes:**
