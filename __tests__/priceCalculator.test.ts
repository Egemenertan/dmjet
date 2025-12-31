/**
 * Price Calculator Tests
 * Tests for price rounding to whole numbers
 */

import {calculateFinalPrice, calculateProfit, calculateProfitMarginFromPrices} from '../src/core/utils/priceCalculator';

describe('calculateFinalPrice - Whole Number Rounding', () => {
  describe('with 10% profit margin', () => {
    it('should round 81.82 * 1.10 = 90.002 up to 91', () => {
      const result = calculateFinalPrice(81.82, 10);
      expect(result).toBe(91);
    });

    it('should round 90.01 * 1.10 = 99.011 up to 100', () => {
      const result = calculateFinalPrice(90.01, 10);
      expect(result).toBe(100);
    });

    it('should round 90.37 * 1.10 = 99.407 up to 100', () => {
      const result = calculateFinalPrice(90.37, 10);
      expect(result).toBe(100);
    });

    it('should round 90.91 * 1.10 = 100.001 up to 101', () => {
      const result = calculateFinalPrice(90.91, 10);
      expect(result).toBe(101);
    });

    it('should keep 100.00 * 1.10 = 110.00 as 110', () => {
      const result = calculateFinalPrice(100, 10);
      expect(result).toBe(110);
    });

    it('should round 50.50 * 1.10 = 55.55 up to 56', () => {
      const result = calculateFinalPrice(50.50, 10);
      expect(result).toBe(56);
    });
  });

  describe('with 15% profit margin', () => {
    it('should round 81.82 * 1.15 = 94.093 up to 95', () => {
      const result = calculateFinalPrice(81.82, 15);
      expect(result).toBe(95);
    });

    it('should round 90.01 * 1.15 = 103.512 up to 104', () => {
      const result = calculateFinalPrice(90.01, 15);
      expect(result).toBe(104);
    });

    it('should round 90.37 * 1.15 = 103.926 up to 104', () => {
      const result = calculateFinalPrice(90.37, 15);
      expect(result).toBe(104);
    });
  });

  describe('with 20% profit margin', () => {
    it('should round 75.00 * 1.20 = 90.00 to 90', () => {
      const result = calculateFinalPrice(75, 20);
      expect(result).toBe(90);
    });

    it('should round 75.01 * 1.20 = 90.012 up to 91', () => {
      const result = calculateFinalPrice(75.01, 20);
      expect(result).toBe(91);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for invalid prices (0)', () => {
      const result = calculateFinalPrice(0, 10);
      expect(result).toBe(0);
    });

    it('should return 0 for invalid prices (negative)', () => {
      const result = calculateFinalPrice(-10, 10);
      expect(result).toBe(0);
    });

    it('should handle very small prices', () => {
      const result = calculateFinalPrice(0.01, 10);
      expect(result).toBe(1); // 0.01 * 1.10 = 0.011 -> 1
    });

    it('should handle very large prices', () => {
      const result = calculateFinalPrice(10000, 10);
      expect(result).toBe(11000); // 10000 * 1.10 = 11000
    });
  });

  describe('default profit margin (10%)', () => {
    it('should use 10% as default when not specified', () => {
      const result = calculateFinalPrice(90.91);
      expect(result).toBe(101); // 90.91 * 1.10 = 100.001 -> 101
    });
  });
});

describe('calculateProfit', () => {
  it('should calculate profit correctly with rounded prices', () => {
    const sellPrice = 81.82;
    const finalPrice = 91; // Rounded from 90.002
    const profit = calculateProfit(sellPrice, finalPrice);
    expect(profit).toBe(9.18); // 91 - 81.82 = 9.18
  });

  it('should handle exact whole numbers', () => {
    const sellPrice = 100;
    const finalPrice = 110;
    const profit = calculateProfit(sellPrice, finalPrice);
    expect(profit).toBe(10);
  });
});

describe('calculateProfitMarginFromPrices', () => {
  it('should calculate actual profit margin after rounding', () => {
    const sellPrice = 81.82;
    const finalPrice = 91; // Rounded from 90.002
    const margin = calculateProfitMarginFromPrices(sellPrice, finalPrice);
    // (91 - 81.82) / 81.82 * 100 = 11.22%
    expect(margin).toBeCloseTo(11.22, 2);
  });

  it('should return exact 10% for perfect whole numbers', () => {
    const sellPrice = 100;
    const finalPrice = 110;
    const margin = calculateProfitMarginFromPrices(sellPrice, finalPrice);
    expect(margin).toBe(10);
  });

  it('should return 0 for invalid sell price', () => {
    const margin = calculateProfitMarginFromPrices(0, 100);
    expect(margin).toBe(0);
  });
});

describe('Real-world scenarios', () => {
  describe('Shopping cart with multiple items', () => {
    it('should calculate total correctly with rounded prices', () => {
      const items = [
        {sellPrice: 81.82, quantity: 2}, // 91 * 2 = 182
        {sellPrice: 90.37, quantity: 1}, // 100 * 1 = 100
        {sellPrice: 50.50, quantity: 3}, // 56 * 3 = 168
      ];

      const total = items.reduce((sum, item) => {
        const finalPrice = calculateFinalPrice(item.sellPrice, 10);
        return sum + finalPrice * item.quantity;
      }, 0);

      expect(total).toBe(450); // 182 + 100 + 168 = 450
    });
  });

  describe('Minimum order check', () => {
    it('should meet minimum order with rounded prices', () => {
      const minOrder = 150;
      const items = [
        {sellPrice: 81.82, quantity: 2}, // 91 * 2 = 182
      ];

      const total = items.reduce((sum, item) => {
        const finalPrice = calculateFinalPrice(item.sellPrice, 10);
        return sum + finalPrice * item.quantity;
      }, 0);

      expect(total).toBeGreaterThanOrEqual(minOrder);
      expect(total).toBe(182);
    });
  });

  describe('Free delivery threshold', () => {
    it('should reach free delivery threshold easier with rounded prices', () => {
      const freeDeliveryThreshold = 300;
      const items = [
        {sellPrice: 90.91, quantity: 3}, // 101 * 3 = 303
      ];

      const total = items.reduce((sum, item) => {
        const finalPrice = calculateFinalPrice(item.sellPrice, 10);
        return sum + finalPrice * item.quantity;
      }, 0);

      expect(total).toBeGreaterThanOrEqual(freeDeliveryThreshold);
      expect(total).toBe(303);
    });
  });
});

describe('Comparison with old rounding method', () => {
  const oldCalculateFinalPrice = (sellPrice: number, profitMargin: number = 10): number => {
    if (!sellPrice || sellPrice <= 0) {
      return 0;
    }
    const finalPrice = sellPrice * (1 + profitMargin / 100);
    return Math.round(finalPrice * 100) / 100; // Old method: 2 decimal places
  };

  it('should show difference between old and new method', () => {
    const testCases = [
      {price: 81.82, margin: 10},
      {price: 90.01, margin: 10},
      {price: 90.37, margin: 10},
    ];

    testCases.forEach(({price, margin}) => {
      const oldResult = oldCalculateFinalPrice(price, margin);
      const newResult = calculateFinalPrice(price, margin);
      
      // New result should always be a whole number
      expect(newResult % 1).toBe(0);
      
      // New result should be greater than or equal to old result
      expect(newResult).toBeGreaterThanOrEqual(oldResult);
      
      // Difference should be less than 1 TL
      expect(newResult - oldResult).toBeLessThan(1);
    });
  });
});

