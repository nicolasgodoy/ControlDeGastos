import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';

export const useIncome = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        const incomesRef = collection(db, 'users', auth.currentUser.uid, 'incomes');
        const q = query(incomesRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const incomesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setIncomes(incomesData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching incomes:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [auth.currentUser]);

    const addIncome = async (incomeData) => {
        try {
            if (!auth.currentUser) throw new Error('User not authenticated');

            const incomesRef = collection(db, 'users', auth.currentUser.uid, 'incomes');
            await addDoc(incomesRef, {
                ...incomeData,
                amount: parseFloat(incomeData.amount),
                createdAt: new Date().toISOString()
            });

            return { success: true };
        } catch (err) {
            console.error('Error adding income:', err);
            return { success: false, error: err.message };
        }
    };

    const updateIncome = async (id, updates) => {
        try {
            if (!auth.currentUser) throw new Error('User not authenticated');

            const incomeRef = doc(db, 'users', auth.currentUser.uid, 'incomes', id);
            await updateDoc(incomeRef, {
                ...updates,
                amount: parseFloat(updates.amount)
            });

            return { success: true };
        } catch (err) {
            console.error('Error updating income:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteIncome = async (id) => {
        try {
            if (!auth.currentUser) throw new Error('User not authenticated');

            const incomeRef = doc(db, 'users', auth.currentUser.uid, 'incomes', id);
            await deleteDoc(incomeRef);

            return { success: true };
        } catch (err) {
            console.error('Error deleting income:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteAllIncomes = async () => {
        if (!auth.currentUser || incomes.length === 0) return { success: false, error: 'No incomes to delete' };
        try {
            const batch = writeBatch(db);
            incomes.forEach(i => {
                batch.delete(doc(db, 'users', auth.currentUser.uid, 'incomes', i.id));
            });
            await batch.commit();
            return { success: true };
        } catch (err) {
            console.error('Error deleting all incomes:', err);
            return { success: false, error: err.message };
        }
    };

    return { incomes, loading, error, addIncome, updateIncome, deleteIncome, deleteAllIncomes };
};
