/**
 * Business Management System
 * Handles business simulation, revenue calculation, and management
 */

/**
 * Business object structure:
 * {
 *   id: string,           // Unique business identifier (e.g., 'cafe_001')
 *   type: string,         // Business type (e.g., 'cafe', 'restaurant', 'shop')
 *   name: string,         // Business name (e.g., 'Coffee Bean Café')
 *   purchasePrice: number, // Original purchase price
 *   
 *   // Management parameters (adjustable by player)
 *   price: number,        // Price level multiplier (0.5 - 2.0, default 1.0)
 *   quality: number,      // Quality level (0-10, affects customer satisfaction)
 *   marketing: number,    // Marketing level (0-10, affects customer volume)
 *   staff: number,        // Number of staff (affects capacity and costs)
 *   
 *   // Calculated values
 *   baseRevenue: number,  // Base daily revenue before modifiers
 *   expenses: number,     // Daily operating expenses
 *   lastRevenue: number,  // Last calculated daily revenue
 *   
 *   // History
 *   totalRevenue: number, // Total revenue generated
 *   daysOwned: number     // Days business has been owned
 * }
 */

/**
 * Create a new business object
 * @param {string} type - Business type
 * @param {string} name - Business name
 * @param {number} purchasePrice - Purchase price
 * @returns {Object} New business object
 */
export function createBusiness(type, name, purchasePrice) {
    const id = `${type}_${Date.now()}`;
    
    // Default parameters based on business type
    const defaults = getBusinessDefaults(type);
    
    return {
        id,
        type,
        name,
        purchasePrice,
        
        // Management parameters
        price: 1.0,        // 100% of base price
        quality: 5,        // Mid-range quality
        marketing: 5,      // Mid-range marketing
        staff: defaults.defaultStaff,
        
        // Calculated values
        baseRevenue: defaults.baseRevenue,
        baseExpenses: defaults.baseExpenses,
        lastRevenue: 0,
        
        // History
        totalRevenue: 0,
        daysOwned: 0
    };
}

/**
 * Get default parameters for business type
 * @param {string} type - Business type
 * @returns {Object} Default parameters
 */
function getBusinessDefaults(type) {
    const defaults = {
        cafe: {
            baseRevenue: 300,
            baseExpenses: 100,
            defaultStaff: 2
        },
        restaurant: {
            baseRevenue: 600,
            baseExpenses: 250,
            defaultStaff: 4
        },
        shop: {
            baseRevenue: 400,
            baseExpenses: 150,
            defaultStaff: 2
        }
    };
    
    return defaults[type] || defaults.cafe;
}

/**
 * Calculate daily revenue for a business
 * 
 * FORMULA DOCUMENTATION:
 * Revenue = BaseRevenue × PriceModifier × QualityModifier × MarketingModifier × StaffModifier × RandomFactor
 * 
 * Components:
 * - BaseRevenue: Fixed daily revenue potential (varies by business type)
 * - PriceModifier: Impact of pricing (0.5-2.0)
 *   - Lower prices increase volume but reduce per-sale revenue
 *   - Higher prices reduce volume but increase per-sale revenue
 *   - Formula: price × (2.2 - price) [parabolic, peaks around 1.1]
 * 
 * - QualityModifier: Customer satisfaction from quality (0-10)
 *   - Higher quality attracts more customers and justifies higher prices
 *   - Formula: 0.5 + (quality / 20) [ranges from 0.5 to 1.0]
 * 
 * - MarketingModifier: Awareness and customer acquisition (0-10)
 *   - More marketing brings more customers
 *   - Formula: 0.6 + (marketing / 25) [ranges from 0.6 to 1.0]
 * 
 * - StaffModifier: Service capacity and quality (1+)
 *   - More staff = better service, but also higher costs
 *   - Formula: 0.8 + (staff × 0.15) [diminishing returns]
 *   - Below optimal staff (2) has penalties
 * 
 * - RandomFactor: Daily variance (0.85-1.15)
 *   - Simulates daily fluctuations in business
 *   - ±15% random variance
 * 
 * Expenses = BaseExpenses + (staff × staffCost) + (marketing × marketingCost) + (quality × qualityCost)
 * - BaseExpenses: Fixed costs (rent, utilities, etc.)
 * - Staff costs: $50/staff/day
 * - Marketing costs: $20/level/day
 * - Quality costs: $15/level/day (maintenance, ingredients, etc.)
 * 
 * Net Revenue = Revenue - Expenses
 * 
 * @param {Object} business - Business object
 * @returns {Object} { revenue, expenses, netRevenue, breakdown }
 */
export function calculateRevenue(business) {
    // Base revenue potential
    const baseRevenue = business.baseRevenue;
    
    // Price modifier: Parabolic function that peaks around 1.1
    // Lower prices increase volume but reduce per-sale revenue
    // Higher prices reduce volume but increase per-sale revenue
    const priceModifier = business.price * (2.2 - business.price);
    
    // Quality modifier: Better quality attracts more customers (0.7 to 1.2)
    const qualityModifier = 0.7 + (business.quality / 20);
    
    // Marketing modifier: More marketing brings more customers (0.8 to 1.2)
    const marketingModifier = 0.8 + (business.marketing / 25);
    
    // Staff modifier: Service capacity and quality
    // Minimum of 1 staff required, optimal is 2+ for most businesses
    const optimalStaff = 2;
    let staffModifier;
    if (business.staff < optimalStaff) {
        // Penalty for understaffing
        staffModifier = 0.6 + (business.staff / optimalStaff) * 0.5;
    } else {
        // Diminishing returns for overstaffing
        staffModifier = 1.0 + (business.staff * 0.1);
        if (staffModifier > 1.5) staffModifier = 1.5; // Cap at 150%
    }
    
    // Random daily variance (±15%)
    const randomFactor = 0.85 + Math.random() * 0.3;
    
    // Calculate gross revenue
    const grossRevenue = Math.floor(
        baseRevenue *
        priceModifier *
        qualityModifier *
        marketingModifier *
        staffModifier *
        randomFactor
    );
    
    // Calculate expenses
    const staffCost = business.staff * 50;        // $50 per staff per day
    const marketingCost = business.marketing * 20; // $20 per marketing level per day
    const qualityCost = business.quality * 15;    // $15 per quality level per day
    const totalExpenses = Math.floor(
        business.baseExpenses + staffCost + marketingCost + qualityCost
    );
    
    // Net revenue
    const netRevenue = grossRevenue - totalExpenses;
    
    return {
        revenue: grossRevenue,
        expenses: totalExpenses,
        netRevenue: netRevenue,
        breakdown: {
            baseRevenue,
            priceModifier: priceModifier.toFixed(2),
            qualityModifier: qualityModifier.toFixed(2),
            marketingModifier: marketingModifier.toFixed(2),
            staffModifier: staffModifier.toFixed(2),
            randomFactor: randomFactor.toFixed(2),
            staffCost,
            marketingCost,
            qualityCost,
            baseExpenses: business.baseExpenses
        }
    };
}

/**
 * Process end-of-day for a business
 * @param {Object} business - Business object
 * @returns {Object} Revenue calculation results
 */
export function processDailyBusiness(business) {
    const results = calculateRevenue(business);
    
    // Update business state
    business.lastRevenue = results.netRevenue;
    business.totalRevenue += results.netRevenue;
    business.daysOwned += 1;
    
    return results;
}

/**
 * Set business price level
 * @param {Object} business - Business object
 * @param {number} priceLevel - Price multiplier (0.5 - 2.0)
 * @returns {boolean} True if successful
 */
export function setBusinessPrice(business, priceLevel) {
    if (priceLevel < 0.5 || priceLevel > 2.0) {
        return false;
    }
    business.price = priceLevel;
    return true;
}

/**
 * Upgrade business quality
 * @param {Object} business - Business object
 * @param {number} _cost - Cost to upgrade (subtracted from player money separately)
 * @returns {boolean} True if successful
 */
export function upgradeQuality(business, _cost) {
    if (business.quality >= 10) {
        return false;
    }
    // Cost is handled by caller
    business.quality += 1;
    return true;
}

/**
 * Adjust marketing level
 * @param {Object} business - Business object
 * @param {number} level - Marketing level (0-10)
 * @returns {boolean} True if successful
 */
export function setMarketingLevel(business, level) {
    if (level < 0 || level > 10) {
        return false;
    }
    business.marketing = level;
    return true;
}

/**
 * Hire or fire staff
 * @param {Object} business - Business object
 * @param {number} staffCount - Number of staff (1-10)
 * @returns {boolean} True if successful
 */
export function setStaffCount(business, staffCount) {
    if (staffCount < 1 || staffCount > 10) {
        return false;
    }
    business.staff = staffCount;
    return true;
}

/**
 * Get business performance summary
 * @param {Object} business - Business object
 * @returns {string} Performance rating
 */
export function getBusinessPerformance(business) {
    if (business.daysOwned === 0) return 'New';
    
    const roi = (business.totalRevenue / business.purchasePrice) * 100;
    
    if (roi > 20) return 'Excellent';
    if (roi > 10) return 'Good';
    if (roi > 5) return 'Fair';
    if (roi > 0) return 'Poor';
    return 'Losing Money';
}

/**
 * Get recommended actions for business optimization
 * @param {Object} business - Business object
 * @returns {Array<string>} Array of recommendations
 */
export function getBusinessRecommendations(business) {
    const recommendations = [];
    
    // Check price optimization
    if (business.price < 0.8) {
        recommendations.push('Consider raising prices - very low prices hurt revenue');
    } else if (business.price > 1.5) {
        recommendations.push('Consider lowering prices - high prices may be driving customers away');
    }
    
    // Check quality
    if (business.quality < 5) {
        recommendations.push('Upgrade quality to attract more customers');
    }
    
    // Check marketing
    if (business.marketing < 5) {
        recommendations.push('Increase marketing to boost customer awareness');
    }
    
    // Check staffing
    if (business.staff < 2) {
        recommendations.push('Hire more staff - understaffing is hurting service quality');
    } else if (business.staff > 5) {
        recommendations.push('Consider reducing staff - overstaffing increases costs with diminishing returns');
    }
    
    // Balance check
    const balance = business.quality + business.marketing + business.staff;
    if (balance < 10) {
        recommendations.push('Overall investment is low - consider increasing quality, marketing, or staff');
    }
    
    return recommendations;
}
