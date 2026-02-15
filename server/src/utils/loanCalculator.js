/**
 * Loan Calculator Utility
 * Handles loan calculations using French amortization system
 * Supports Argentine interest rate types: TNA, CFT, TEA
 */

/**
 * Calculate monthly payment using French amortization system
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (percentage, e.g., 145 for 145%)
 * @param {number} months - Number of installments
 * @returns {number} Monthly payment amount
 */
export const calculateMonthlyPayment = (principal, annualRate, months) => {
    if (months <= 0 || principal <= 0) return 0;
    if (annualRate === 0) return principal / months;

    const monthlyRate = annualRate / 100 / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
    
    return Math.round(payment * 100) / 100; // Round to 2 decimals
};

/**
 * Generate complete amortization schedule
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {number} months - Number of installments
 * @returns {Array} Array of payment objects with installment number, capital, interest, and remaining balance
 */
export const generateAmortizationSchedule = (principal, annualRate, months) => {
    const schedule = [];
    let remainingBalance = principal;
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, months);
    const monthlyRate = annualRate / 100 / 12;

    for (let i = 1; i <= months; i++) {
        const interest = remainingBalance * monthlyRate;
        const capital = monthlyPayment - interest;
        remainingBalance -= capital;

        // Fix potential floating point errors on last payment
        if (i === months) {
            remainingBalance = 0;
        }

        schedule.push({
            installment: i,
            payment: Math.round(monthlyPayment * 100) / 100,
            capital: Math.round(capital * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            remainingBalance: Math.round(Math.max(0, remainingBalance) * 100) / 100
        });
    }

    return schedule;
};

/**
 * Convert between different interest rate types
 * @param {number} rate - Interest rate value
 * @param {string} fromType - Source rate type ('TNA', 'TEA', 'CFT')
 * @param {string} toType - Target rate type ('TNA', 'TEA', 'CFT')
 * @returns {number} Converted rate
 */
export const convertRate = (rate, fromType, toType) => {
    if (fromType === toType) return rate;

    // Convert everything to TNA first, then to target type
    let tna = rate;
    
    if (fromType === 'TEA') {
        // TEA to TNA: TNA = ((1 + TEA)^(1/12) - 1) * 12 * 100
        tna = (Math.pow(1 + rate / 100, 1/12) - 1) * 12 * 100;
    } else if (fromType === 'CFT') {
        // CFT includes additional costs, for simplicity we approximate it as TEA
        // In reality, CFT = TEA + additional costs
        // For now, treat CFT ≈ TEA as a conservative estimate
        tna = (Math.pow(1 + rate / 100, 1/12) - 1) * 12 * 100;
    }

    // Convert from TNA to target type
    if (toType === 'TNA') {
        return Math.round(tna * 100) / 100;
    } else if (toType === 'TEA') {
        // TNA to TEA: TEA = ((1 + TNA/12)^12 - 1) * 100
        const tea = (Math.pow(1 + tna / 100 / 12, 12) - 1) * 100;
        return Math.round(tea * 100) / 100;
    } else if (toType === 'CFT') {
        // For simplification, return TEA equivalent
        const tea = (Math.pow(1 + tna / 100 / 12, 12) - 1) * 100;
        return Math.round(tea * 100) / 100;
    }

    return tna;
};

/**
 * Calculate the real interest rate when you only know the amount and monthly payment
 * Uses iterative approximation (Newton-Raphson method)
 * @param {number} amount - Total loan amount
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} installments - Number of installments
 * @returns {number} Estimated annual interest rate (TNA)
 */
export const calculateRealInterest = (amount, monthlyPayment, installments) => {
    if (installments <= 0 || amount <= 0 || monthlyPayment <= 0) return 0;

    // Initial guess: 10% annual rate
    let rate = 0.10;
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
        const monthlyRate = rate / 12;
        const calculatedPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                                  (Math.pow(1 + monthlyRate, installments) - 1);
        
        const difference = calculatedPayment - monthlyPayment;
        
        if (Math.abs(difference) < tolerance) {
            return Math.round(rate * 100 * 100) / 100; // Return as percentage
        }

        // Adjust rate based on difference
        const derivative = amount * installments * Math.pow(1 + monthlyRate, installments - 1) / 
                          Math.pow(Math.pow(1 + monthlyRate, installments) - 1, 2);
        
        rate = rate - difference / derivative / 12;
        
        // Prevent negative rates
        if (rate < 0) rate = 0.01;
    }

    return Math.round(rate * 100 * 100) / 100; // Return as percentage
};

/**
 * Calculate total interest to be paid over the life of the loan
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {number} months - Number of installments
 * @returns {number} Total interest amount
 */
export const calculateTotalInterest = (principal, annualRate, months) => {
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, months);
    const totalPaid = monthlyPayment * months;
    return Math.round((totalPaid - principal) * 100) / 100;
};
