import React, { createContext, useContext } from 'react';
import { useDebts } from '../hooks/useDebts';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';

const DataContext = createContext();

export function useData() {
    return useContext(DataContext);
}

export function DataProvider({ children }) {
    // Collect all data and methods from hook
    const debtState = useDebts();
    const expenseState = useExpenses();
    const incomeState = useIncome();

    const value = {
        // Debts
        debts: debtState.debts,
        debtsLoading: debtState.loading,
        debtsError: debtState.error,
        toggleDebtStatus: debtState.toggleStatus,
        bulkUpdateDebtStatus: debtState.bulkUpdateStatus,
        addDebt: debtState.addDebt,
        updateDebt: debtState.updateDebt,
        deleteDebt: debtState.deleteDebt,
        importDebts: debtState.importDebts,
        deleteAllDebts: debtState.deleteAllDebts,

        // Expenses
        expenses: expenseState.expenses,
        expensesLoading: expenseState.loading,
        expensesError: expenseState.error,
        addExpense: expenseState.addExpense,
        deleteExpense: expenseState.deleteExpense,
        updateExpense: expenseState.updateExpense,
        deleteAllExpenses: expenseState.deleteAllExpenses,

        // Incomes
        incomes: incomeState.incomes,
        incomesLoading: incomeState.loading,
        incomesError: incomeState.error,
        addIncome: incomeState.addIncome,
        updateIncome: incomeState.updateIncome,
        deleteIncome: incomeState.deleteIncome,
        deleteAllIncomes: incomeState.deleteAllIncomes,

        // Combined Loading
        globalLoading: debtState.loading || expenseState.loading || incomeState.loading
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
