import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDebts = () => {
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDebts = async () => {
            try {
                const response = await axios.get('/api/debts');
                setDebts(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDebts();
    }, []);

    // Toggle debt status via API
    const toggleStatus = async (debtId) => {
        // Optimistic update
        setDebts(prevDebts =>
            prevDebts.map(debt =>
                debt.id === debtId
                    ? { ...debt, status: debt.status === 'paid' ? 'pending' : 'paid' }
                    : debt
            )
        );

        try {
            const debt = debts.find(d => d.id === debtId);
            if (!debt) return;

            const newStatus = debt.status === 'paid' ? 'pending' : 'paid';
            await axios.post(`/api/debts/${debtId}/status`, { status: newStatus });
        } catch (err) {
            console.error('Failed to update status:', err);
            // Revert on error
            setDebts(prevDebts =>
                prevDebts.map(debt =>
                    debt.id === debtId
                        ? { ...debt, status: debt.status === 'paid' ? 'pending' : 'paid' } // Revert flip
                        : debt
                )
            );
        }
    };

    return { debts, loading, error, toggleStatus };
};
