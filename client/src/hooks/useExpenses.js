import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp,
    where
} from 'firebase/firestore';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setExpenses([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'expenses'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expenseData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExpenses(expenseData);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('Error fetching expenses:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addExpense = async (expenseData) => {
        if (!user) return { success: false, error: 'User not authenticated' };
        try {
            await addDoc(collection(db, 'expenses'), {
                ...expenseData,
                userId: user.uid,
                createdAt: serverTimestamp()
            });
            return { success: true };
        } catch (err) {
            console.error('Error adding expense:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteExpense = async (id) => {
        try {
            await deleteDoc(doc(db, 'expenses', id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting expense:', err);
            return { success: false, error: err.message };
        }
    };

    const updateExpense = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'expenses', id), updatedData);
            return { success: true };
        } catch (err) {
            console.error('Error updating expense:', err);
            return { success: false, error: err.message };
        }
    };

    return { expenses, loading, error, addExpense, deleteExpense, updateExpense, refreshExpenses: () => { } };
};
