import { useState, useEffect } from 'react';
import axios from 'axios';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExpenses = async () => {
        try {
            const response = await axios.get('/api/expenses');
            setExpenses(response.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const addExpense = async (expenseData) => {
        try {
            const response = await axios.post('/api/expenses', expenseData);
            setExpenses(prev => [response.data, ...prev]); // Add to top
            return { success: true };
        } catch (err) {
            console.error('Error adding expense:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteExpense = async (id) => {
        try {
            await axios.delete(`/api/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting expense:', err);
            return { success: false, error: err.message };
        }
    };

    return { expenses, loading, error, addExpense, deleteExpense, refreshExpenses: fetchExpenses };
};
