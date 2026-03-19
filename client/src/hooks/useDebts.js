import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
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

            // Sort: Oldest dates first (Ascending)
            debtsData.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
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
                    batch.set(newDocRef, { ...d, status: 'pending', userId: user.uid, createdAt: serverTimestamp() });
                });
                await batch.commit();
            } else {
                await addDoc(collection(db, 'debts'), {
                    ...debtData,
                    status: 'pending',
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
            const updateData = { status: newStatus };

            // Save the date when debt is marked as paid (for monthly dashboard filtering)
            if (newStatus === 'paid') {
                updateData.paidAt = new Date().toISOString();
            } else {
                updateData.paidAt = null; // Clear it when reverting to pending
            }

            await updateDoc(doc(db, 'debts', debtId), updateData);
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const bulkUpdateStatus = async (ids, status) => {
        if (!user) return { success: false, error: 'User not authenticated' };
        try {
            const batch = writeBatch(db);
            const now = new Date().toISOString();

            ids.forEach(id => {
                const debtRef = doc(db, 'debts', id);
                batch.update(debtRef, {
                    status,
                    paidAt: status === 'paid' ? now : null
                });
            });

            await batch.commit();
            return { success: true };
        } catch (err) {
            console.error('Error in bulk update:', err);
            return { success: false, error: err.message };
        }
    };

    const importDebts = async (file, mode = 'append') => {
        if (!user) return { success: false, error: 'Usuario no autenticado' };

        try {
            const workbook = new ExcelJS.Workbook();
            const buffer = await file.arrayBuffer();
            await workbook.xlsx.load(buffer);

            const allDebts = [];
            let debtCounter = 1;

            workbook.eachSheet((worksheet) => {
                const sheetName = worksheet.name.toUpperCase();
                let currentBank = 'General';
                let loanNames = [];
                let inDataSection = false;

                // Iterate through rows to find data
                for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
                    const row = worksheet.getRow(rowNum);
                    const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();

                    // 1. Detect Bank header
                    if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC'].includes(firstCellVal)) {
                        currentBank = firstCellVal;
                        inDataSection = false;
                        continue;
                    }

                    // 2. Detect Loan Names and Fecha/Cuotas headers
                    let isHeaderRow = false;
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        const val = String(cell.value || '').toUpperCase();
                        if (val === 'FECHA') isHeaderRow = true;
                    });

                    if (isHeaderRow) {
                        inDataSection = true;
                        loanNames = [];
                        // Look at the row above to get loan names
                        const prevRow = worksheet.getRow(rowNum - 1);
                        // Header pattern: Fecha | Monto, Fecha | Monto...
                        for (let c = 1; c <= worksheet.columnCount; c += 2) {
                            const loanTitle = String(prevRow.getCell(c).value || prevRow.getCell(c + 1).value || 'Préstamo').trim();
                            loanNames.push(loanTitle);
                        }
                        continue;
                    }

                    // 3. Process data rows
                    if (inDataSection) {
                        for (let i = 0; i < loanNames.length; i++) {
                            const colNum = (i * 2) + 1;
                            const fechaCell = row.getCell(colNum);
                            const cuotasCell = row.getCell(colNum + 1);

                            let dateVal = fechaCell.value;
                            let amountVal = cuotasCell.value;

                            // Support formulas
                            if (amountVal && typeof amountVal === 'object' && amountVal.result !== undefined) {
                                amountVal = amountVal.result;
                            }
                            if (dateVal && typeof dateVal === 'object' && dateVal.result !== undefined) {
                                dateVal = dateVal.result;
                            }

                            if (dateVal && amountVal) {
                                // Parse amount
                                let amount = 0;
                                if (typeof amountVal === 'number') {
                                    amount = amountVal;
                                } else {
                                    const numStr = String(amountVal)
                                        .replace(/\./g, '')
                                        .replace(',', '.')
                                        .replace(/[^0-9.-]/g, '');
                                    amount = parseFloat(numStr) || 0;
                                }

                                if (amount <= 0) continue;

                                // Parse date
                                let formattedDate = '';
                                if (dateVal instanceof Date) {
                                    const year = dateVal.getUTCFullYear();
                                    const month = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
                                    const day = String(dateVal.getUTCDate()).padStart(2, '0');
                                    formattedDate = `${year}-${month}-${day}`;
                                } else {
                                    const dateStr = String(dateVal);
                                    if (dateStr.includes('/')) {
                                        const parts = dateStr.split('/');
                                        if (parts.length === 3) {
                                            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                        } else {
                                            formattedDate = dateStr;
                                        }
                                    } else {
                                        if (dateStr.length < 5) continue;
                                        formattedDate = dateStr;
                                    }
                                }

                                // Check status by color (matches server logic)
                                let status = 'pending';
                                const fill = cuotasCell.fill;
                                if (fill && (fill.fgColor || fill.bgColor)) {
                                    const argb = (fill.fgColor?.argb || fill.bgColor?.argb || '').toUpperCase();
                                    // FF6AA84F, FF34A853 are green (paid)
                                    if (argb.includes('6AA84F') || argb.includes('34A853') ||
                                        argb.includes('00B050') || argb.includes('92D050') || argb.includes('00FF00')) {
                                        status = 'paid';
                                    }
                                }

                                allDebts.push({
                                    entity: currentBank,
                                    loanName: loanNames[i],
                                    date: formattedDate,
                                    amount: amount,
                                    status: status
                                });
                            }
                        }
                    }
                }
            });

            // Filter out internal keywords
            const filteredDebts = allDebts.filter(debt =>
                !debt.loanName.toUpperCase().includes('PAGOANTICIPADO') &&
                !String(debt.date).toUpperCase().includes('PAGOANTICIPADO')
            );

            // Save to Firestore using batch
            const batch = writeBatch(db);

            // If mode is 'replace', delete current ones first
            if (mode === 'replace') {
                debts.forEach(d => {
                    batch.delete(doc(db, 'debts', d.id));
                });
            }

            filteredDebts.forEach(d => {
                const newDocRef = doc(collection(db, 'debts'));
                batch.set(newDocRef, {
                    ...d,
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
            });

            await batch.commit();

            return { success: true, count: filteredDebts.length };
        } catch (err) {
            console.error('Error importing debts:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteAllDebts = async () => {
        if (!user || debts.length === 0) return { success: false, error: 'No debts to delete' };
        try {
            const batch = writeBatch(db);
            debts.forEach(d => {
                batch.delete(doc(db, 'debts', d.id));
            });
            await batch.commit();
            return { success: true };
        } catch (err) {
            console.error('Error deleting all debts:', err);
            return { success: false, error: err.message };
        }
    };

    return { debts, loading, error, toggleStatus, bulkUpdateStatus, addDebt, updateDebt, deleteDebt, importDebts, deleteAllDebts, refreshDebts: () => { } };
};
