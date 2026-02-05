import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function DebtModal({ isOpen, onClose, onSave, initialData }) {
    const [formData, setFormData] = useState({
        entity: 'BANCO',
        loanName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        installments_paid: 0,
        installments_total: 1
    });

    const [showCalculator, setShowCalculator] = useState(false);
    const [calculator, setCalculator] = useState({
        cashAmount: '',
        interestRate: ''
    });

    const [pendingSplitConfirm, setPendingSplitConfirm] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                entity: initialData.entity || 'BANCO',
                loanName: initialData.loanName || '',
                amount: initialData.amount,
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
                installments_paid: initialData.installments_paid || 0,
                installments_total: initialData.installments_total || 1
            });
            // Reset calculator when editing
            setCalculator({ cashAmount: '', interestRate: '' });
            setShowCalculator(false);
        } else {
            setFormData({
                entity: 'BANCO',
                loanName: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                installments_paid: 0,
                installments_total: 1
            });
            setShowCalculator(false);
            setCalculator({ cashAmount: '', interestRate: '' });
        }
    }, [initialData, isOpen]);

    // Calculator Effect
    useEffect(() => {
        if (showCalculator && calculator.cashAmount) {
            const cash = parseFloat(calculator.cashAmount) || 0;
            const rate = parseFloat(calculator.interestRate) || 0;
            const total = cash * (1 + rate / 100);

            // Update the main amount field
            setFormData(prev => ({
                ...prev,
                amount: Math.round(total)
            }));
        }
    }, [calculator, showCalculator]);

    const entities = [
        'SANTANDER', 'GALICIA', 'BBVA', 'MACRO', 'NACION',
        'MERCADO PAGO', 'UALA', 'LEMON', 'MODO',
        'VISA', 'MASTERCARD', 'AMEX',
        'PERSONAL', 'CLARO', 'MOVISTAR', 'FIBERTEL',
        'OTRO'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Split Installments Logic
        if (!initialData && formData.installments_total > 1 && !pendingSplitConfirm) {
            setPendingSplitConfirm(true);
            return;
        }

        await onSave(formData);
        onClose();
    };

    const confirmSplit = async () => {
        const baseAmount = Math.floor(formData.amount / formData.installments_total);
        const remainder = formData.amount % formData.installments_total;
        const baseDate = new Date(formData.date);

        const debtsToCreate = [];
        for (let i = 0; i < formData.installments_total; i++) {
            // Update date for each month
            const currentDueDate = new Date(baseDate);
            currentDueDate.setMonth(baseDate.getMonth() + i);

            // Add remainder to last installment to ensure exact total
            const amount = i === formData.installments_total - 1 ? baseAmount + remainder : baseAmount;

            debtsToCreate.push({
                ...formData,
                loanName: `${formData.loanName} (${i + 1}/${formData.installments_total})`,
                amount: amount,
                date: currentDueDate.toISOString().split('T')[0],
                installments_total: 1, // Each one is a single debt now
                installments_paid: 0
            });
        }

        await onSave(debtsToCreate);
        onClose();
    };

    if (!isOpen) return null;

    const installmentValue = formData.amount && formData.installments_total > 0
        ? formData.amount / formData.installments_total
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3>{initialData ? 'Editar Deuda' : 'Nueva Deuda'}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>

                    {/* Calculator Toggle */}
                    {!initialData && (
                        <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--primary)', fontWeight: '500' }}
                                onClick={() => setShowCalculator(!showCalculator)}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>{showCalculator ? '−' : '+'}</span>
                                    Calculadora de Interés
                                </span>
                                {showCalculator && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ocultar</span>}
                            </div>

                            {showCalculator && (
                                <div className="fade-in" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Monto Contado</label>
                                        <div className="input-with-icon">
                                            <span style={{ color: 'var(--text-dim)' }}>$</span>
                                            <input
                                                type="number"
                                                value={calculator.cashAmount}
                                                onChange={e => setCalculator({ ...calculator, cashAmount: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Interés %</label>
                                        <div className="input-with-icon">
                                            <input
                                                type="number"
                                                value={calculator.interestRate}
                                                onChange={e => setCalculator({ ...calculator, interestRate: e.target.value })}
                                                placeholder="0"
                                            />
                                            <span style={{ color: 'var(--text-dim)' }}>%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Entidad</label>
                        <input
                            list="entity-list"
                            value={formData.entity}
                            onChange={e => setFormData({ ...formData, entity: e.target.value.toUpperCase() })}
                            placeholder="Seleccione o escriba..."
                            required
                        />
                        <datalist id="entity-list">
                            {entities.map(ent => (
                                <option key={ent} value={ent} />
                            ))}
                        </datalist>
                    </div>

                    <div className="form-group">
                        <label>Nombre / Concepto</label>
                        <input
                            type="text"
                            value={formData.loanName}
                            onChange={e => setFormData({ ...formData, loanName: e.target.value })}
                            placeholder="Ej: Préstamo Personal, Tarjeta..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Monto Total Deuda ($)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0"
                                required
                                style={{
                                    fontWeight: '600',
                                    color: showCalculator ? 'var(--primary)' : 'inherit',
                                    paddingRight: showCalculator ? '60px' : '1rem'
                                }}
                                readOnly={showCalculator}
                            />
                            {showCalculator && (
                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500' }}>
                                    CALC.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Primera Cuota Vence</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Cuotas Pagadas</label>
                            <input
                                type="number"
                                value={formData.installments_paid}
                                onChange={e => setFormData({ ...formData, installments_paid: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label>Total Cuotas</label>
                            <input
                                type="number"
                                value={formData.installments_total}
                                onChange={e => setFormData({ ...formData, installments_total: parseInt(e.target.value) || 1 })}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Installment Info */}
                    {formData.amount > 0 && formData.installments_total > 0 && (
                        <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>Valor Aprox. por Cuota</span>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.25rem' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    ${installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>x {formData.installments_total}</span>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="submit-btn" style={{ marginTop: '0.5rem' }}>
                        {initialData ? 'Guardar Cambios' : 'Registrar Deuda'}
                    </button>
                </form>

            </div>

            {/* Split Confirmation Overlay */}
            {
                pendingSplitConfirm && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '16px'
                    }}>
                        <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main)' }}>¿Dividir en cuotas?</h4>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Se crearán <strong>{formData.installments_total}</strong> deudas individuales de
                                <strong style={{ color: 'var(--primary)' }}> ${Math.round(formData.amount / formData.installments_total).toLocaleString('es-AR')}</strong> cada una,
                                con vencimientos mensuales consecutivos.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={confirmSplit}
                                    style={{
                                        background: 'var(--primary)', color: 'white', border: 'none',
                                        padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                                    }}
                                >
                                    Confirmar (Dividir)
                                </button>
                                <button
                                    onClick={() => { setPendingSplitConfirm(false); onSave(formData); onClose(); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)', color: 'var(--text-dim)', border: 'none',
                                        padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                                    }}
                                >
                                    Cancelar (Guardar 1 sola)
                                </button>
                            </div>
                            <button
                                onClick={() => setPendingSplitConfirm(false)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-dim)',
                                    marginTop: '1rem', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline'
                                }}
                            >
                                Volver atrás
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default DebtModal;
