# Business Management System Documentation

## Overview

The business management system in LifeParser allows players to own and actively manage businesses. Unlike the previous passive income model, businesses now require strategic decision-making across multiple parameters to maximize profitability.

## Business Object Structure

Each business is represented by an object with the following properties:

```javascript
{
  id: string,              // Unique identifier (e.g., 'cafe_1234567890')
  type: string,            // Business type: 'cafe', 'restaurant', 'shop'
  name: string,            // Display name (e.g., 'Coffee Bean Café')
  purchasePrice: number,   // Original purchase price
  
  // Management Parameters (Adjustable by player)
  price: number,           // Price level multiplier (0.5 - 2.0, default 1.0)
  quality: number,         // Quality level (0-10, affects satisfaction)
  marketing: number,       // Marketing level (0-10, affects awareness)
  staff: number,           // Number of staff (1-10, affects capacity)
  
  // Calculated Values
  baseRevenue: number,     // Base daily revenue before modifiers
  expenses: number,        // Daily operating expenses
  lastRevenue: number,     // Last calculated daily net revenue
  
  // History
  totalRevenue: number,    // Cumulative net revenue
  daysOwned: number        // Days business has been owned
}
```

## Revenue Calculation Formula

The daily revenue for a business is calculated using the following formula:

```
Net Revenue = Gross Revenue - Total Expenses

Gross Revenue = BaseRevenue × PriceModifier × QualityModifier × 
                MarketingModifier × StaffModifier × RandomFactor
```

### Revenue Components

#### 1. Base Revenue
- Fixed daily revenue potential that varies by business type
- **Café:** $300/day
- **Restaurant:** $600/day
- **Shop:** $400/day

#### 2. Price Modifier
Represents the impact of pricing strategy on revenue.

**Formula:** `price × (2.2 - price)`

This creates a parabolic curve that:
- Peaks around 1.1 (110% pricing)
- Lower prices increase volume but reduce per-sale revenue
- Higher prices reduce volume but increase per-sale revenue

**Examples:**
- 50% pricing: 0.5 × 1.7 = 0.85 multiplier
- 100% pricing: 1.0 × 1.2 = 1.2 multiplier
- 110% pricing: 1.1 × 1.1 = 1.21 multiplier (optimal)
- 150% pricing: 1.5 × 0.7 = 1.05 multiplier
- 200% pricing: 2.0 × 0.2 = 0.4 multiplier

#### 3. Quality Modifier
Customer satisfaction from service/product quality.

**Formula:** `0.5 + (quality / 20)`

**Range:** 0.5 to 1.0
- Quality 0: 0.50× revenue
- Quality 5: 0.75× revenue
- Quality 10: 1.00× revenue

Higher quality attracts more customers and justifies premium pricing.

#### 4. Marketing Modifier
Customer awareness and acquisition through marketing efforts.

**Formula:** `0.6 + (marketing / 25)`

**Range:** 0.6 to 1.0
- Marketing 0: 0.60× revenue
- Marketing 5: 0.80× revenue
- Marketing 10: 1.00× revenue

More marketing brings more customers to your business.

#### 5. Staff Modifier
Service capacity and quality from staffing levels.

**Formula:**
- If `staff < 2` (understaffed): `0.5 + (staff / 2) × 0.3`
- If `staff >= 2`: `0.8 + (staff × 0.15)` (capped at 1.3)

**Examples:**
- 1 staff: 0.65× revenue (understaffed penalty)
- 2 staff: 1.10× revenue (optimal baseline)
- 3 staff: 1.25× revenue
- 5+ staff: 1.30× revenue (diminishing returns cap)

#### 6. Random Factor
Daily variance simulating business fluctuations.

**Formula:** `0.85 + random(0.3)`

**Range:** 0.85 to 1.15 (±15% variance)

This adds realistic day-to-day variability in business performance.

## Expense Calculation

Total daily expenses are calculated as:

```
Total Expenses = Base Expenses + Staff Cost + Marketing Cost + Quality Cost
```

### Expense Components

1. **Base Expenses:** Fixed operating costs (rent, utilities, supplies)
   - Café: $100/day
   - Restaurant: $250/day
   - Shop: $150/day

2. **Staff Cost:** `$50 × number of staff`
   - Scales linearly with staff count
   - Example: 3 staff = $150/day

3. **Marketing Cost:** `$20 × marketing level`
   - Each marketing level costs $20/day
   - Example: Marketing level 7 = $140/day

4. **Quality Cost:** `$15 × quality level`
   - Each quality level costs $15/day (ingredients, maintenance)
   - Example: Quality level 8 = $120/day

## Management Strategies

### Balanced Strategy (Recommended for beginners)
- Price: 100% (1.0)
- Quality: 5
- Marketing: 5
- Staff: 2-3

**Expected Daily Net:** ~$100-150

### High-Volume Strategy
- Price: 80-90%
- Quality: 3-4
- Marketing: 7-8
- Staff: 3-4

**Expected Daily Net:** ~$120-180
**Pros:** High customer volume
**Cons:** Lower margins, requires more staff

### Premium Strategy
- Price: 110-130%
- Quality: 8-10
- Marketing: 6-7
- Staff: 3

**Expected Daily Net:** ~$150-200
**Pros:** High margins, prestige
**Cons:** High costs, smaller customer base

### Profit Maximization Strategy
- Price: 110%
- Quality: 7-8
- Marketing: 6-7
- Staff: 2-3

**Expected Daily Net:** ~$180-250
**Pros:** Optimal balance of all factors
**Cons:** Requires tuning and adjustment

## Player Commands

### Viewing Business Information
- `business info` - View detailed business report
- `check business` - Quick business status
- `stats` - Shows business summary in character stats

### Managing Price
- `set price to 80%` - Set price to 80% of base
- `set price to 120` - Set price to 120% (% is optional)
- Valid range: 50% - 200%

### Managing Quality
- `upgrade quality` - Increase quality by 1 level
- Cost scales with level: $1000 × (current level + 1)
- Example: Upgrading from 5 to 6 costs $6000
- Maximum: 10

### Managing Marketing
- `set marketing to 7` - Set marketing level to 7
- Valid range: 0 - 10
- Ongoing cost: $20/level/day

### Managing Staff
- `hire staff` - Hire one staff member
- `fire staff` - Fire one staff member
- `set staff to 3` - Set staff count to 3
- Valid range: 1 - 10
- Cost: $50/staff/day

## Performance Metrics

### Return on Investment (ROI)
```
ROI = (Total Revenue / Purchase Price) × 100
```

**Performance Ratings:**
- **Excellent:** ROI > 20%
- **Good:** ROI > 10%
- **Fair:** ROI > 5%
- **Poor:** ROI > 0%
- **Losing Money:** ROI ≤ 0%

### Break-Even Analysis
To calculate break-even point:
1. Calculate daily expenses at current settings
2. Adjust parameters to generate revenue > expenses
3. Monitor daily net revenue for profitability

**Example:**
- Daily expenses: $350
- Need revenue > $350 to be profitable
- Adjust price, quality, marketing, or staff to optimize

## Tuning and Balance

### Current Balance Goals
- **Early game** (first business): $50-100/day net profit
- **Mid game** (optimized business): $150-250/day net profit
- **Late game** (multiple businesses): $500+/day total profit

### Tuning Parameters
To adjust game balance, modify these values in `business.js`:

1. **Base Revenue** (line 72-86): Adjust starting revenue potential
2. **Price Modifier Formula** (line 159): Change pricing curve
3. **Quality/Marketing/Staff Formulas** (lines 162-179): Adjust modifier ranges
4. **Expense Costs** (lines 197-199): Change operating costs
5. **Random Factor Range** (line 182): Adjust daily variance

### Future Enhancements
Potential additions for future versions:
- Business upgrades (expand capacity, new equipment)
- Competition mechanics (other businesses affect your revenue)
- Location-based modifiers (better locations = more customers)
- Seasonal events (holidays increase revenue)
- Business skills (higher business skill = better modifiers)
- Employee management (train staff, hire specialists)
- Marketing campaigns (one-time boosts)
- Business reputation system
- Multiple locations for same business type
- Business types beyond café (restaurant, shop, etc.)

## Technical Implementation

### Files
- **src/business.js** - Core business logic and calculations
- **src/engine.js** - Command handlers and UI integration
- **src/gameState.js** - Business data storage in `gameState.businesses[]`
- **src/parser.js** - Command parsing for business management

### End-of-Day Processing
Business revenue is calculated and applied at the end of each game day (when hour >= 24):
1. `processDailyBusiness()` is called for each business
2. Revenue is calculated using `calculateRevenue()`
3. Business state is updated (totalRevenue, daysOwned, lastRevenue)
4. Net revenue is added to player's money
5. Report is displayed to player

### Save System
Businesses are automatically saved to localStorage as part of `gameState.businesses[]` array. The system supports:
- Legacy save migration (old `ownsCafe` flag → new business object)
- Forward compatibility (new fields added with defaults)
- Multiple businesses in the array

## Testing Checklist

- [ ] Buy café with enough money
- [ ] Buy café without enough money (error)
- [ ] Set price to various levels (50%, 100%, 150%, 200%)
- [ ] Set price outside valid range (error)
- [ ] Upgrade quality at each level (1-10)
- [ ] Upgrade quality at max level (error)
- [ ] Upgrade quality without enough money (error)
- [ ] Set marketing to various levels (0-10)
- [ ] Set marketing outside valid range (error)
- [ ] Hire and fire staff
- [ ] Set staff to various counts (1-10)
- [ ] Set staff outside valid range (error)
- [ ] View business info command
- [ ] View stats with business
- [ ] Check end-of-day revenue calculation
- [ ] Test revenue with different parameter combinations
- [ ] Verify save/load preserves business state
- [ ] Test legacy save migration (old flag → new object)

## Summary

The business management system transforms LifeParser from a passive income simulator to an active management game. Players must balance multiple parameters (price, quality, marketing, staff) to maximize profitability while managing expenses. The formula is designed to reward strategic thinking while providing realistic daily variance and clear feedback on performance.
