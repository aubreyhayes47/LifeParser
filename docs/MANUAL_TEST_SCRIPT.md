# Manual Testing Script
## LifeParser - Systematic Command Verification

**Instructions:** Execute these commands in order, checking the result after each. Mark ✓ for pass, ✗ for fail.

---

## SETUP

1. Open game in browser: `http://localhost:8080`
2. Open browser console (F12)
3. Clear localStorage: `localStorage.clear()` then refresh
4. Verify fresh start: Day 1, 8:00 AM, $500

---

## TEST SUITE 1: BASIC COMMANDS (10 min)

### Help & Info Commands

```
Command: help
Expected: Display all command categories
Result: [ ]

Command: stats
Expected: Show character stats, Day 1, 8:00 AM
Result: [ ]

Command: inventory
Expected: Show phone, wallet, keys
Result: [ ]

Command: inv
Expected: Same as inventory
Result: [ ]

Command: check money
Expected: "You have $500."
Result: [ ]

Command: check health
Expected: "Your health is 100/100."
Result: [ ]

Command: check time
Expected: "It's Day 1, 8:00 AM."
Result: [ ]
```

---

## TEST SUITE 2: MOVEMENT (15 min)

### From Home to Street

```
Command: look around
Expected: Display apartment description
Result: [ ]

Command: go to street
Expected: Travel to Main Street, energy 95
Result: [ ]
Note time: _____

Command: look around
Expected: Display street description with 4 exits
Result: [ ]
```

### Explore All Locations

```
Command: go to gym
Expected: Travel to gym, energy 90
Result: [ ]

Command: look around
Expected: Show gym description, trainer present
Result: [ ]

Command: go to street
Expected: Back to street, energy 85
Result: [ ]

Command: go to cafe
Expected: Travel to cafe, energy 80
Result: [ ]

Command: look around
Expected: Show cafe, owner and barista present
Result: [ ]

Command: go to street
Expected: Back to street, energy 75
Result: [ ]

Command: go to bank
Expected: Travel to bank, energy 70
Result: [ ]

Command: look around
Expected: Show bank, loan officer present
Result: [ ]

Command: go to street
Expected: Back to street, energy 65
Result: [ ]

Command: go to home
Expected: Back home, energy 60
Result: [ ]
```

### Test Invalid Movement

```
Command: go to xyz
Expected: Error message "can't go there"
Result: [ ]

Command: go to gym
Expected: Error (can't reach from home)
Result: [ ]
```

### Test Movement Synonyms

```
Command: go to street
Expected: Success
Result: [ ]

Command: walk to cafe
Expected: Success
Result: [ ]

Command: travel to street
Expected: Success
Result: [ ]

Command: goto bank
Expected: Success
Result: [ ]
```

---

## TEST SUITE 3: CONVERSATION (10 min)

```
Command: go to cafe
Result: [ ]

Command: talk to owner
Expected: Display owner dialogue, time advances
Result: [ ]

Command: talk to barista
Expected: Display barista dialogue
Result: [ ]

Command: speak with owner
Expected: Works (synonym)
Result: [ ]

Command: chat with barista
Expected: Works (synonym)
Result: [ ]

Command: talk to nobody
Expected: Error "no one like that here"
Result: [ ]

Command: go to gym
Result: [ ]

Command: talk to trainer
Expected: Display trainer dialogue
Result: [ ]

Command: go to bank
Result: [ ]

Command: talk to loan officer
Expected: Display loan officer dialogue
Result: [ ]

Command: talk to owner
Expected: Error (not at cafe)
Result: [ ]
```

---

## TEST SUITE 4: JOB & WORK (15 min)

### Apply for Job

```
Command: go to cafe
Result: [ ]

Command: apply for job
Expected: Get hired, message about $60 wage
Result: [ ]

Command: apply for job
Expected: Error "already work here"
Result: [ ]

Command: go to bank
Result: [ ]

Command: apply for job
Expected: Error "no job openings here"
Result: [ ]
```

### Work at Cafe

```
Command: go to cafe
Result: [ ]

Command: work
Expected: +$60, -25 energy, +15 hunger, +1 business, +4 hours
Before: Money=_____, Energy=_____, Time=_____
After:  Money=_____, Energy=_____, Time=_____
Result: [ ]

Command: work
Expected: Same changes again
Result: [ ]
```

### Work at Gym

```
Command: go to gym
Result: [ ]

Note before: Money=_____, Energy=_____, Strength=_____

Command: work
Expected: -$20, -30 energy, +20 hunger, +2 strength, +1 hour
After: Money=_____, Energy=_____, Strength=_____
Result: [ ]

Command: workout
Expected: Same as work
Result: [ ]

Command: exercise
Expected: Same as work
Result: [ ]
```

### Insufficient Money for Gym

```
Spend all money at gym or eating until < $20

Command: work
Expected: Error "don't have enough money"
Result: [ ]
```

---

## TEST SUITE 5: BASIC NEEDS (15 min)

### Eating at Home

```
Command: go to home
Result: [ ]

Note before: Money=_____, Hunger=_____

Command: eat
Expected: -$10, -40 hunger, +30 min
After: Money=_____, Hunger=_____
Result: [ ]

Command: drink
Expected: Same as eat (synonym)
Result: [ ]
```

### Eating at Cafe

```
Command: go to cafe
Result: [ ]

Note before: Money=_____, Hunger=_____

Command: eat
Expected: -$15, -50 hunger, +20 min
After: Money=_____, Hunger=_____
Result: [ ]
```

### Eating Errors

```
Command: go to bank
Result: [ ]

Command: eat
Expected: Error "can't eat here"
Result: [ ]

Work until money < $10

Command: go to home
Result: [ ]

Command: eat
Expected: Error "don't have enough money"
Result: [ ]
```

### Sleeping

```
Command: go to home
Result: [ ]

Note before: Energy=_____, Time=_____

Command: sleep
Expected: Energy=100, +8 hours
After: Energy=_____, Time=_____
Result: [ ]

Command: rest
Expected: Same as sleep
Result: [ ]

Command: nap
Expected: Same as sleep
Result: [ ]

Command: go to cafe
Result: [ ]

Command: sleep
Expected: Error "need to go home"
Result: [ ]
```

---

## TEST SUITE 6: BUSINESS SYSTEM (15 min)

### Taking Loans

```
Command: go to bank
Result: [ ]

Note before: Money=_____

Command: take loan
Expected: +$10,000, message about 8% interest
After: Money=_____
Result: [ ]

Command: get loan
Expected: Works (synonym)
Result: [ ]

Command: request loan
Expected: Works (synonym)
Result: [ ]

Command: take loan for 5000
Expected: +$5,000 exactly
Result: [ ]

Command: take loan for 50000
Expected: +$50,000 exactly
Result: [ ]

Command: take loan for 1000
Expected: Error "Loans are available from $5000 to $50000"
Result: [ ]

Command: take loan for 100000
Expected: Error about range
Result: [ ]

Command: go to home
Result: [ ]

Command: take loan
Expected: Error "need to be at the bank"
Result: [ ]
```

### Buying Cafe (if have money)

```
If money < $50,000, take more loans or work at cafe to earn it

Command: check business
Expected: "don't own any businesses" or similar
Result: [ ]

Note before: Money=_____

Command: buy cafe
Expected: -$50,000, success message, ownership confirmed
After: Money=_____
Result: [ ]

Command: check cafe
Expected: Show ownership and revenue info
Result: [ ]

Command: purchase cafe
Expected: Should still work or say already owned
Result: [ ]

Command: buy xyz
Expected: Error "can't buy that"
Result: [ ]
```

### Cafe Revenue on Day Change

```
If own cafe:

Command: go to home
Result: [ ]

Command: sleep
Expected: Day should increase, +$200 cafe revenue message
Result: [ ]
```

---

## TEST SUITE 7: SAVE/LOAD (10 min)

### Manual Save

```
Note current state:
- Day: _____
- Time: _____
- Location: _____
- Money: _____
- Energy: _____
- Has Job: _____
- Owns Cafe: _____

Command: save
Expected: Save confirmation with timestamp
Result: [ ]
```

### Manual Load

```
Change state (move, work, etc.)

Command: load
Expected: Restore to saved state, confirmation message
After load:
- Day: _____
- Time: _____
- Location: _____
- Money: _____
- Energy: _____
Result: [ ]
```

### Auto-Save Verification

```
Open browser console:
localStorage.getItem('lifeparser_save')
Expected: Should see JSON data
Result: [ ]

localStorage.getItem('lifeparser_save_timestamp')
Expected: Should see ISO timestamp
Result: [ ]
```

### Auto-Load on Startup

```
Note current state before refresh

Refresh browser (F5)

Expected: Game auto-loads, shows "SAVE GAME LOADED" message
Verify state matches before refresh
Result: [ ]
```

### Load with No Save

```
In console: localStorage.clear()

Command: load
Expected: Error "No saved game found"
Result: [ ]
```

---

## TEST SUITE 8: TIME & STAT PROGRESSION (10 min)

### Time Rollover

```
Current time: _____

Execute commands to advance 60+ minutes

After 60 min:
Expected: Hour should increment
Actual: _____
Result: [ ]

Execute commands to advance 24+ hours

After 24 hours:
Expected: Day should increment
Actual: _____
Result: [ ]
```

### Passive Stat Changes

```
Initial: Energy=_____, Hunger=_____

Work at cafe (4 hours)

Expected changes:
- Energy: -25 (from work) + -8 (4h * 2/h) = -33 total
- Hunger: +15 (from work) + +12 (4h * 3/h) = +27 total

Actual: Energy=_____, Hunger=_____
Result: [ ]
```

### Hunger Health Penalty

```
Let hunger reach 80+

Note health before: _____

Wait more time or do actions

Expected: Health should decrease by 5
Actual: _____
Result: [ ]
```

### Stat Boundaries

```
Try to get energy below 0:
Command: work repeatedly at cafe
Expected: Energy stops at 0, game still playable
Result: [ ]

Try to get hunger above 100:
Let hunger increase naturally
Expected: Hunger stops at 100
Result: [ ]

Sleep to restore energy:
Expected: Energy goes to exactly 100
Result: [ ]

Try to spend more money than you have:
Expected: Transactions fail with appropriate errors
Result: [ ]
```

---

## TEST SUITE 9: UI VERIFICATION (5 min)

### Status Bar Updates

```
Check that status bar updates immediately after commands:

After movement:
- Energy display updates: [ ]
- Time display updates: [ ]

After earning money:
- Money display updates: [ ]

After eating:
- Hunger display updates: [ ]

After sleeping:
- Energy display updates: [ ]
- Time display updates: [ ]
```

### Color Coding

```
Get energy < 30:
Expected: Yellow/red color
Result: [ ]

Get hunger > 70:
Expected: Yellow/red color
Result: [ ]

Restore to normal:
Expected: Normal colors
Result: [ ]
```

---

## TEST SUITE 10: EDGE CASES (10 min)

### Empty Command

```
Command: (press enter with nothing)
Expected: No response, no error
Result: [ ]
```

### Unknown Commands

```
Command: asdfghjkl
Expected: Error "I don't understand 'asdfghjkl'"
Result: [ ]

Command: fly to moon
Expected: Error message
Result: [ ]
```

### Case Insensitivity

```
Command: HELP
Expected: Works
Result: [ ]

Command: Go To Cafe
Expected: Works
Result: [ ]

Command: TaLk To OwNeR
Expected: Works
Result: [ ]
```

### Rapid Command Entry

```
Quickly type and execute 10 commands in a row
Expected: All process correctly, no errors
Result: [ ]
```

### Money = 0

```
Spend all money

Command: eat
Expected: Appropriate error
Result: [ ]

Command: work at gym
Expected: Appropriate error
Result: [ ]
```

---

## TEST SUITE 11: RANDOM EVENTS (Optional - 10 min)

### Event Testing

```
Note: Events are random (5% chance after day 2)

Get to day 2 or later

Execute many commands and watch for events

If "LUCKY FIND" appears:
Expected: +$20 money, formatted message
Result: [ ]

If "HELPFUL STRANGER" appears:
Expected: +1 intelligence
Result: [ ]
```

---

## TEST SUITE 12: DATA-DRIVEN VALUES (5 min)

### Verify Config Values

```
Initial money: $500 [ ]
Gym cost: $20 [ ]
Cafe wage: $60 [ ]
Home meal: $10 [ ]
Cafe meal: $15 [ ]
Cafe price: $50,000 [ ]
Cafe revenue: $200/day [ ]
Loan min: $5,000 [ ]
Loan max: $50,000 [ ]
```

---

## COMPLETION CHECKLIST

- [ ] All test suites completed
- [ ] All critical path tests pass
- [ ] All issues logged in TEST_PLAN.md
- [ ] Screenshot or video recording made (if needed)
- [ ] Results documented

---

## ISSUES FOUND

### Critical

1. 

### Non-Critical

1. 

### Notes

- 

---

**Tested By:** _______________  
**Date:** _______________  
**Duration:** _______________  
**Browser:** _______________  
**Overall Result:** PASS / FAIL / CONDITIONAL
