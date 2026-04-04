// utils/priceCalculator.js  ← put it here instead of directly in the controller
const calculateFinalPrice = (basePrice, selectedDefects, selectedQuestions, selectedAccessories) => {
  const totalDeductionPercent = 
    selectedDefects.reduce((sum, d) => sum + (d.deduction || 0), 0) +
    selectedQuestions.reduce((sum, q) => sum + (q.deductionOnNo || 0), 0);

  const cappedDeduction    = Math.min(totalDeductionPercent, 100);
  const totalAdditionPercent = selectedAccessories.reduce((sum, a) => sum + (a.addition || 0), 0);

  const afterDeduction = basePrice * (1 - cappedDeduction / 100);
  const finalPrice     = afterDeduction * (1 + totalAdditionPercent / 100);

  return {
    basePrice,
    totalDeductionPercent,   // raw (can exceed 100, useful for UI warning)
    cappedDeduction,         // what was actually applied
    totalAdditionPercent,
    finalPrice: Math.max(0, Math.round(finalPrice)),
  };
};

module.exports = { calculateFinalPrice };