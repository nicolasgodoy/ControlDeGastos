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
            const formatDate = (val) => {
                if (!val) return null;
                if (val instanceof Date || (val.getMonth && typeof val.getMonth === 'function')) {
                    const d = new Date(val);
                    return d.toISOString().split('T')[0];
                }
                if (typeof val === 'number' && val > 30000 && val < 60000) {
                    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                    return date.toISOString().split('T')[0];
                }
                const s = String(val).trim().toLowerCase();
                const m1 = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
                if (m1) {
                    let y = m1[3];
                    if (y.length === 2) y = '20' + y;
                    return `${y}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
                }
                return null;
            };

            const parseAmountStr = (val) => {
                if (val === null || val === undefined || val === '') return 0;
                if (typeof val === 'number') return val;
                if (typeof val === 'object' && val.result !== undefined) return parseAmountStr(val.result);
                let cleaned = String(val).replace(/\$/g, '').replace(/\s/g, '');
                if (cleaned.includes(',') && cleaned.includes('.')) {
                    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                } else if (cleaned.includes(',')) {
                    cleaned = cleaned.replace(',', '.');
                }
                return parseFloat(cleaned) || 0;
            };

            console.log('--- Iniciando Importación Final ---');
            workbook.eachSheet((worksheet) => {
                const bankHeaders = ['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA', 'NARANJA X'];
                
                for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
                    const row = worksheet.getRow(rowNum);
                    const cell1 = String(row.getCell(1).value || '').trim().toUpperCase();

                    if (bankHeaders.includes(cell1)) {
                        const currentBank = cell1;
                        let loanCols = [];
                        
                        // Escanear columnas reales
                        const limit = Math.min(rowNum + 50, worksheet.rowCount);
                        for (let r = rowNum + 1; r <= limit; r++) {
                            const scanRow = worksheet.getRow(r);
                            const checkV = String(scanRow.getCell(1).value || '').toUpperCase();
                            if (bankHeaders.includes(checkV) && r > rowNum + 1) break;

                            for (let c = 1; c <= 30; c++) {
                                if (loanCols.find(x => x.col === c)) continue;
                                let v1 = scanRow.getCell(c).value;
                                let v2 = scanRow.getCell(c+1).value;
                                if (v1 && typeof v1 === 'object' && v1.result !== undefined) v1 = v1.result;
                                if (v2 && typeof v2 === 'object' && v2.result !== undefined) v2 = v2.result;

                                const fDate = formatDate(v1);
                                const fAmt = parseAmountStr(v2);

                                if (fDate && fAmt > 0) {
                                    // Buscar nombre arriba
                                    let loanName = '';
                                    for (let off = -5; off <= 2; off++) {
                                        const nr = worksheet.getRow(r + off);
                                        if (!nr) continue;
                                        const nv = String(nr.getCell(c).value || '').trim();
                                        if (nv && !formatDate(nv) && isNaN(parseFloat(nv.replace(',','.')))) {
                                            loanName = nv; break;
                                        }
                                    }
                                    loanCols.push({ col: c, name: loanName || `P ${loanCols.length + 1}` });
                                }
                            }
                        }

                        console.log(`Buscando datos para ${currentBank}...`);

                        for (let pr = rowNum + 1; pr <= worksheet.rowCount; pr++) {
                            const dataRow = worksheet.getRow(pr);
                            const checkV = String(dataRow.getCell(1).value || '').toUpperCase();
                            if (bankHeaders.includes(checkV) && pr > rowNum + 1) break;
                            if (checkV.includes('TOTAL')) break;

                            for (const loan of loanCols) {
                                let dVal = dataRow.getCell(loan.col).value;
                                let aVal = dataRow.getCell(loan.col + 1).value;
                                if (dVal && typeof dVal === 'object' && dVal.result !== undefined) dVal = dVal.result;
                                if (aVal && typeof aVal === 'object' && aVal.result !== undefined) aVal = aVal.result;

                                const fDate = formatDate(dVal);
                                const amount = parseAmountStr(aVal);

                                if (fDate && amount > 0) {
                                    let status = 'pending';
                                    const fill = dataRow.getCell(loan.col + 1).fill;
                                    if (fill && (fill.fgColor || fill.bgColor)) {
                                        const argb = (fill.fgColor?.argb || fill.bgColor?.argb || '').toUpperCase();
                                        if (argb.includes('93C47D') || argb.includes('B6D7A8') || argb.includes('D9EAD3') || argb.includes('6AA84F')) status = 'paid';
                                    }
                                    allDebts.push({ entity: currentBank, loanName: loan.name, date: fDate, amount, status });
                                }
                            }
                        }
                    }
                }
            });
            console.log('Importación completada. Total:', allDebts.length);


            const batch = writeBatch(db);
            if (mode === 'replace') {
                debts.forEach(d => batch.delete(doc(db, 'debts', d.id)));
            }

            allDebts.forEach(d => {
                const newDocRef = doc(collection(db, 'debts'));
                batch.set(newDocRef, { ...d, userId: user.uid, createdAt: serverTimestamp() });
            });

            await batch.commit();
            return { success: true, count: allDebts.length };
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
