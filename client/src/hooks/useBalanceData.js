import { useMemo } from 'react';

/**
 * Custom hook for centralizing all balance logic, projections, and filtering.
 */
export function useBalanceData({ incomes, debts, expenses, selectedMonth, todayISO }) {
    
    // Helper: Formatter
    const fmt = (val) => new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(Math.abs(val || 0));

    const isFuture = selectedMonth > todayISO;
    const isCurrent = selectedMonth === todayISO;

    // ── Selected Month Calculations ───────────────────────────────────────────
    const incomeEntries = useMemo(() => 
        (incomes || []).filter(i => i.date?.startsWith(selectedMonth)), 
    [incomes, selectedMonth]);
    
    const totalIncome = useMemo(() => 
        incomeEntries.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0), 
    [incomeEntries]);

    const expenseEntries = useMemo(() => 
        (expenses || []).filter(e => e.date?.startsWith(selectedMonth)), 
    [expenses, selectedMonth]);
    
    const totalExpenses = useMemo(() => 
        expenseEntries.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0), 
    [expenseEntries]);

    const { totalPaidDebts, totalPendingDebts, totalDebts, monthlyDebts } = useMemo(() => {
        return (debts || []).reduce((acc, d) => {
            const debtMonth = d.date?.slice(0, 7) || '';
            const isSelectedMonth = debtMonth === selectedMonth;
            
            // Overdue logic: only for current month
            const isOverduePending = selectedMonth === todayISO && d.status === 'pending' && debtMonth < selectedMonth;

            if (isSelectedMonth || isOverduePending) {
                acc.monthlyDebts.push(d);
                acc.totalDebts += parseFloat(d.amount || 0);
                if (d.status === 'paid') acc.totalPaidDebts += parseFloat(d.amount || 0);
                else acc.totalPendingDebts += parseFloat(d.amount || 0);
            }
            return acc;
        }, { totalPaidDebts: 0, totalPendingDebts: 0, totalDebts: 0, monthlyDebts: [] });
    }, [debts, selectedMonth, todayISO]);

    const adelantosGlobal = useMemo(() => {
        return (debts || []).reduce((acc, d) => {
            const m = d.date?.slice(0, 7) || '';
            if (m > todayISO && d.status === 'paid') return acc + parseFloat(d.amount || 0);
            return acc;
        }, 0);
    }, [debts, todayISO]);

    // Current/Past: Income - Pending - Paid - Expenses
    // Future: Income - Pending - Expenses (already paid don't subtract)
    const balance = totalIncome 
        - (isFuture ? 0 : totalPaidDebts) 
        - totalPendingDebts 
        - totalExpenses;
    
    const balancePercentage = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    const committedPercentage = 100 - balancePercentage;

    // ── Yearly Projections Logic ──────────────────────────────────────────────
    const monthlyProjections = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthNum = now.getMonth() + 1;

        // Avg income calculation (for future months without real data)
        const recentIncomeMonths = {};
        incomes.forEach(inc => {
            const m = inc.date?.slice(0, 7) || '';
            if (m) recentIncomeMonths[m] = (recentIncomeMonths[m] || 0) + parseFloat(inc.amount || 0);
        });
        const recentVals = Object.values(recentIncomeMonths).slice(0, 3);
        const avgMonthlyIncome = recentVals.length > 0
            ? recentVals.reduce((a, b) => a + b, 0) / recentVals.length
            : 0;

        // Group debts for the loop
        const debtsByMonth = {};
        let futurePaidDebtsSumForAcumulado = 0;
        (debts || []).forEach(d => {
            const m = d.date?.slice(0, 7) || '';
            if (!m) return;
            if (!debtsByMonth[m]) debtsByMonth[m] = [];
            debtsByMonth[m].push(d);

            if (m > todayISO && d.status === 'paid') {
                futurePaidDebtsSumForAcumulado += parseFloat(d.amount || 0);
            }
        });

        const months = [];
        let cumulativeBalance = 0;

        for (let m = currentMonthNum; m <= 12; m++) {
            const yyyy = currentYear;
            const mm = String(m).padStart(2, '0');
            const key = `${yyyy}-${mm}`;
            const isCurrentMonth = key === todayISO;

            // Income (Actual vs Avg)
            const actualIncomeEntries = incomes.filter(i => i.date?.startsWith(key));
            const monthIncome = actualIncomeEntries.length > 0
                ? actualIncomeEntries.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
                : avgMonthlyIncome;

            // Expenses (Actual only)
            const monthExpenses = expenses
                .filter(e => e.date?.startsWith(key))
                .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

            // Debts (Breakdown)
            const monthDebtItems = debtsByMonth[key] || [];
            const paidDebtsTotal = monthDebtItems.filter(d => d.status === 'paid').reduce((s, d) => s + parseFloat(d.amount || 0), 0);
            const pendingDebtsTotal = monthDebtItems.filter(d => d.status === 'pending').reduce((s, d) => s + parseFloat(d.amount || 0), 0);

            // Rule: Current includes paid. Future only pending.
            const cashFlowDeductions = pendingDebtsTotal + (isCurrentMonth ? paidDebtsTotal : 0);
            const projectedBalance = monthIncome - cashFlowDeductions - monthExpenses;
            
            // Clean cumulative savings sum
            cumulativeBalance += projectedBalance;

            months.push({
                key,
                income: monthIncome,
                pendingDebts: pendingDebtsTotal,
                paidDebts: paidDebtsTotal,
                expenses: monthExpenses,
                totalDebts: monthDebtItems.reduce((s, d) => s + parseFloat(d.amount || 0), 0),
                projectedBalance,
                cumulativeBalance,
                isCurrentMonth,
                debtItems: monthDebtItems
            });
        }
        return months;
    }, [incomes, debts, expenses, todayISO]);

    return {
        fmt,
        isFuture,
        isCurrent,
        totalIncome,
        totalExpenses,
        totalPaidDebts,
        totalPendingDebts,
        totalDebts,
        monthlyDebts,
        adelantosGlobal,
        balance,
        balancePercentage,
        committedPercentage,
        monthlyProjections,
        incomeEntries,
        expenseEntries
    };
}
