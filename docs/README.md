# LifeParser Testing Documentation

This directory contains comprehensive testing documentation for Phase 1: Rigorous Verification of Refactored Game Mechanics.

## 📚 Documentation Files

### 1. TEST_PLAN.md
**Purpose:** Complete formal test plan with 200+ test cases  
**Use Case:** Systematic testing and quality assurance  
**Contents:**
- Detailed test cases for all commands
- Expected outcomes for each test
- Regression test scenarios
- Edge case testing
- Data-driven verification
- Test execution tracking

### 2. EXPECTED_OUTCOMES.md
**Purpose:** Detailed specifications for all game behaviors  
**Use Case:** Source of truth for expected functionality  
**Contents:**
- Exact behavior specifications for each command
- State changes documentation
- Time progression rules
- Stat boundaries and calculations
- Error message catalog
- Data loading specifications

### 3. MANUAL_TEST_SCRIPT.md
**Purpose:** Step-by-step testing script  
**Use Case:** Manual testing execution guide  
**Contents:**
- 12 test suites covering all features
- Exact commands to type
- Expected results for each command
- Checkboxes for tracking progress
- Issue logging templates

### 4. TESTING_CHECKLIST.md
**Purpose:** Quick reference testing checklist  
**Use Case:** Rapid verification and smoke testing  
**Contents:**
- Quick command reference
- Critical path testing (30 min)
- Edge cases testing (15 min)
- Data-driven testing (10 min)
- Regression issues log

### 5. COMMAND_REFERENCE.md
**Purpose:** Complete command documentation  
**Use Case:** Reference guide for testers and users  
**Contents:**
- All commands with syntax
- Command aliases and variations
- Effects and requirements
- Game mechanics explanation
- Tips and strategies
- Quick reference tables

## 🎯 How to Use This Documentation

### For Manual Testing

1. **Start Here:** Read `COMMAND_REFERENCE.md` to understand all commands
2. **Follow Script:** Use `MANUAL_TEST_SCRIPT.md` for systematic testing
3. **Quick Checks:** Use `TESTING_CHECKLIST.md` for smoke testing
4. **Reference:** Consult `EXPECTED_OUTCOMES.md` when verifying results
5. **Track Issues:** Log findings in `TEST_PLAN.md`

### For Regression Testing

1. Review `EXPECTED_OUTCOMES.md` for baseline behavior
2. Execute test cases from `TEST_PLAN.md`
3. Compare actual vs expected results
4. Document any deviations

### For New Features

1. Add test cases to `TEST_PLAN.md`
2. Document expected behavior in `EXPECTED_OUTCOMES.md`
3. Update `COMMAND_REFERENCE.md` with new commands
4. Add to `MANUAL_TEST_SCRIPT.md` for manual verification

## 📊 Test Coverage

This documentation covers:

- ✅ **Movement Commands** - All location navigation
- ✅ **Interaction Commands** - NPCs, work, jobs
- ✅ **Basic Needs** - Sleep, eating
- ✅ **Business Commands** - Loans, purchases
- ✅ **Information Commands** - Stats, inventory, help
- ✅ **System Commands** - Save/load functionality
- ✅ **Time Progression** - Time advancement and stat changes
- ✅ **Random Events** - Event triggering and effects
- ✅ **UI Updates** - Status bar and color coding
- ✅ **Data Loading** - JSON configuration files
- ✅ **Error Handling** - All error scenarios
- ✅ **Edge Cases** - Boundary conditions and race conditions

## 🔍 Test Statistics

- **Total Test Cases:** 200+
- **Commands Documented:** 25+
- **Command Variations:** 50+
- **Locations Tested:** 5
- **NPCs Tested:** 4
- **Game Mechanics:** 15+
- **Error Scenarios:** 20+

## 📝 Testing Workflow

### Before Testing
1. Clear browser localStorage
2. Start development server: `npm start`
3. Open browser to `http://localhost:8080`
4. Have documentation open for reference

### During Testing
1. Follow test scripts in order
2. Mark results in checkboxes
3. Note any unexpected behavior
4. Take screenshots of issues
5. Log issues immediately

### After Testing
1. Complete issue logs
2. Calculate pass/fail statistics
3. Document observations
4. Sign off on test completion
5. Report findings

## 🐛 Issue Tracking

Issues should be logged with:
- Test case ID (e.g., MC-001)
- Description of issue
- Steps to reproduce
- Expected vs actual behavior
- Severity (Critical/Non-Critical)
- Status (Open/Fixed/Won't Fix)

## 🔄 Maintenance

This documentation should be updated when:
- New commands are added
- Existing commands are modified
- Game mechanics change
- Bugs are fixed
- New features are implemented

## 📅 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-25 | Initial documentation | GitHub Copilot Agent |

## 🎓 Best Practices

### For Testers
- Read all documentation before testing
- Follow scripts exactly as written
- Test in isolation (fresh state)
- Document everything
- Verify fixes are complete

### For Developers
- Consult expected outcomes before changes
- Update documentation with code changes
- Run full regression after changes
- Add new test cases for new features

### For Quality Assurance
- Use test plan for comprehensive coverage
- Track metrics and trends
- Report patterns in failures
- Suggest improvements to tests

## 🚀 Getting Started

**New to testing LifeParser?**

1. Read `COMMAND_REFERENCE.md` (20 min)
2. Try `TESTING_CHECKLIST.md` critical path (30 min)
3. Review findings and get familiar with the game
4. Then proceed to full `MANUAL_TEST_SCRIPT.md` (1-2 hours)
5. For comprehensive testing, use `TEST_PLAN.md` (4+ hours)

## 📧 Contact

For questions about testing documentation:
- Open an issue on GitHub
- Tag: `testing`, `documentation`

---

**Remember:** These tests ensure the quality and reliability of LifeParser. Thorough testing prevents regressions and maintains user trust!
