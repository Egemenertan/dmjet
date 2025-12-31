/**
 * Price Calculator Utility
 * Handles price calculations with profit margin
 */

/**
 * Calculate final price with profit margin
 * @param sellPrice - Stock sell price from database
 * @param profitMargin - Profit margin percentage (0-100)
 * @returns Final price with profit margin applied, rounded up to nearest whole number
 */
export const calculateFinalPrice = (
  sellPrice: number,
  profitMargin: number = 10
): number => {
  if (!sellPrice || sellPrice <= 0) {
    return 0;
  }
  
  // Kar marjını ekle: sellPrice * (1 + profitMargin / 100)
  const finalPrice = sellPrice * (1 + profitMargin / 100);
  
  // Tam sayıya yuvarla (yukarı yuvarla - 90.01 -> 91, 90.99 -> 91)
  return Math.ceil(finalPrice);
};

/**
 * Calculate profit amount
 * @param sellPrice - Stock sell price
 * @param finalPrice - Final price shown to customer
 * @returns Profit amount
 */
export const calculateProfit = (
  sellPrice: number,
  finalPrice: number
): number => {
  return Math.round((finalPrice - sellPrice) * 100) / 100;
};

/**
 * Calculate profit margin percentage from prices
 * @param sellPrice - Stock sell price
 * @param finalPrice - Final price shown to customer
 * @returns Profit margin percentage
 */
export const calculateProfitMarginFromPrices = (
  sellPrice: number,
  finalPrice: number
): number => {
  if (!sellPrice || sellPrice <= 0) {
    return 0;
  }
  
  const profitMargin = ((finalPrice - sellPrice) / sellPrice) * 100;
  return Math.round(profitMargin * 100) / 100;
};





