import { useState, useEffect } from 'react';
import axios from 'axios';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    writeBatch,
    serverTimestamp,
    where
} from 'firebase/firestore';

export const useDebts = () => {
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setDebts([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'debts'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const debtsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort: Pending first, then by date
            debtsData.sort((a, b) => {
                if (a.status === b.status) {
                    return new Date(a.date) - new Date(b.date);
                }
                return a.status === 'pending' ? -1 : 1;
            });

            setDebts(debtsData);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('Error fetching debts:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addDebt = async (debtData) => {
        if (!user) return { success: false, error: 'User not authenticated' };
        try {
            if (Array.isArray(debtData)) {
                const batch = writeBatch(db);
                debtData.forEach(d => {
                    const newDocRef = doc(collection(db, 'debts'));
                    batch.set(newDocRef, { ...d, userId: user.uid, createdAt: serverTimestamp() });
                });
                await batch.commit();
            } else {
                await addDoc(collection(db, 'debts'), {
                    ...debtData,
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
            }
            return { success: true };
        } catch (err) {
            console.error('Error adding debt:', err);
            return { success: false, error: err.message };
        }
    };

    const updateDebt = async (id, data) => {
        try {
            await updateDoc(doc(db, 'debts', id), data);
            return { success: true };
        } catch (err) {
            console.error('Error updating debt:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteDebt = async (id) => {
        try {
            await deleteDoc(doc(db, 'debts', id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting debt:', err);
            return { success: false, error: err.message };
        }
    };

    const toggleStatus = async (debtId) => {
        try {
            const debt = debts.find(d => d.id === debtId);
            if (!debt) return;

            const newStatus = debt.status === 'paid' ? 'pending' : 'paid';
            await updateDoc(doc(db, 'debts', debtId), { status: newStatus });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const importDebts = async (file, mode = 'append') => {
        if (!user) return { success: false, error: 'User not authenticated' };
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`/api/debts/import?mode=${mode}&userId=${user.uid}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const importedDebts = response.data.debts;

            // Save imported debts to Firestore using batch to ensure user isolation
            const batch = writeBatch(db);
            importedDebts.forEach(d => {
                const newDocRef = doc(collection(db, 'debts'));
                // Use data from server but force current userId
                const { id, ...data } = d;
                batch.set(newDocRef, {
                    ...data,
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
            });

            await batch.commit();

            return { success: true, count: response.data.count };
        } catch (err) {
            console.error('Error importing debts:', err);
            return { success: false, error: err.response?.data?.message || err.message };
        }
    };

    return { debts, loading, error, toggleStatus, addDebt, updateDebt, deleteDebt, importDebts, refreshDebts: () => { } };
};
