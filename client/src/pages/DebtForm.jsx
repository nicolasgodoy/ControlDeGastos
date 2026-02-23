import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calculator,
    AlertCircle,
    ArrowLeft,
    Save,
    CreditCard,
    Calendar,
    DollarSign,
    PieChart
} from 'lucide-react';
import { useDebts } from '../hooks/useDebts';

function DebtForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { debts, addDebt, updateDebt } = useDebts();

    // ... (state and logic same as before)
    const [formData, setFormData] = useState({
        entity: 'BANCO',
        loanName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        installments_paid: 0,
        installments_total: 1,
        interestRate: '',
        rateType: 'TNA'
    });

    const [calculatedPayment, setCalculatedPayment] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bank-specific interest rates (same as before)
    const bankRates = {
        'GALICIA': [
            { value: '95-CFT', label: 'Préstamo Personal - 95% CFT' },
            { value: '110-CFT', label: 'Préstamo Personal Plus - 110% CFT' },
            { value: '145-TNA', label: 'Tarjeta Galicia - 145% TNA' },
            { value: '170-TNA', label: 'Tarjeta Galicia Platinum - 170% TNA' }
        ],
        'SANTANDER': [
            { value: '90-CFT', label: 'Préstamo Personal - 90% CFT' },
            { value: '120-CFT', label: 'Préstamo Express - 120% CFT' },
            { value: '140-TNA', label: 'Tarjeta Santander - 140% TNA' }
        ],
        'BBVA': [
            { value: '100-CFT', label: 'Préstamo Personal - 100% CFT' },
            { value: '130-CFT', label: 'Préstamo Rápido - 130% CFT' },
            { value: '150-TNA', label: 'Tarjeta BBVA - 150% TNA' }
        ],
        'MERCADO PAGO': [
            { value: '120-CFT', label: 'Préstamo Personal - 120% CFT' },
            { value: '140-CFT', label: 'Crédito Express - 140% CFT' },
            { value: '145-TNA', label: 'Cuotas en compras - 145% TNA' },
            { value: '30-CFT', label: 'Plan 12 cuotas - 30% CFT' }
        ],
        'UALA': [
            { value: '110-CFT', label: 'Préstamo Personal - 110% CFT' },
            { value: '135-CFT', label: 'Crédito Rápido - 135% CFT' },
            { value: '145-TNA', label: 'Cuotas Ualá - 145% TNA' }
        ],
        'NARANJA X': [
            { value: '125-CFT', label: 'Préstamo Personal - 125% CFT' },
            { value: '145-TNA', label: 'Cuotas Naranja - 145% TNA' },
            { value: '170-TNA', label: 'Plan Z - 170% TNA' }
        ],
        'BRUBANK': [
            { value: '95-CFT', label: 'Préstamo Personal - 95% CFT' },
            { value: '120-CFT', label: 'Crédito Express - 120% CFT' }
        ],
        'ICBC': [
            { value: '90-CFT', label: 'Préstamo Personal - 90% CFT' },
            { value: '115-CFT', label: 'Préstamo Exclusive - 115% CFT' },
            { value: '145-TNA', label: 'Visa ICBC - 145% TNA' }
        ],
        'BANCO NACION': [
            { value: '85-CFT', label: 'Préstamo Personal - 85% CFT' },
            { value: '105-CFT', label: 'Crédito Sueldo - 105% CFT' },
            { value: '8-TEA', label: 'Hipotecario UVA - 8% TEA' }
        ]
    };

    const getAvailableRates = () => {
        const entity = formData.entity.toUpperCase().trim();
        const baseRates = bankRates[entity] || [
            { value: '80-CFT', label: 'Tasa Baja - 80% CFT' },
            { value: '100-CFT', label: 'Tasa Media-Baja - 100% CFT' },
            { value: '120-CFT', label: 'Tasa Media - 120% CFT' },
            { value: '140-CFT', label: 'Tasa Media-Alta - 140% CFT' },
            { value: '160-CFT', label: 'Tasa Alta - 160% CFT' },
            { value: '145-TNA', label: 'Tarjeta Crédito - 145% TNA' },
            { value: '30-CFT', label: 'Plan Cuotas - 30% CFT' },
            { value: '50-CFT', label: 'Financiación - 50% CFT' }
        ];

        return [
            { value: '0-CFT', label: 'Sin Interés - 0%' },
            ...baseRates
        ];
    };

    useEffect(() => {
        if (id && debts.length > 0) {
            const existingDebt = debts.find(d => d.id === id);
            if (existingDebt) {
                setFormData({
                    entity: existingDebt.entity || 'BANCO',
                    loanName: existingDebt.loanName || '',
                    amount: existingDebt.amount,
                    date: existingDebt.date ? existingDebt.date.split('T')[0] : new Date().toISOString().split('T')[0],
                    installments_paid: existingDebt.installments_paid || 0,
                    installments_total: existingDebt.installments_total || 1,
                    interestRate: (existingDebt.interestRate !== null && existingDebt.interestRate !== undefined) ? existingDebt.interestRate.toString() : '',
                    rateType: existingDebt.rateType || 'TNA'
                });
                setShowAdvanced(existingDebt.installments_total > 1);
            }
        }
    }, [id, debts]);

    useEffect(() => {
        if (formData.interestRate !== '' && formData.amount && formData.installments_total > 1) {
            calculateMonthlyPayment();
        } else {
            setCalculatedPayment(null);
        }
    }, [formData.interestRate, formData.amount, formData.installments_total]);

    const calculateMonthlyPayment = () => {
        const principal = parseFloat(formData.amount);
        const annualRate = parseFloat(formData.interestRate);
        const months = parseInt(formData.installments_total);

        if (!principal || isNaN(annualRate) || !months || months <= 1) {
            setCalculatedPayment(null);
            return;
        }

        let payment;
        let totalToPay;
        let totalInterest;

        if (annualRate === 0) {
            payment = principal / months;
            totalToPay = principal;
            totalInterest = 0;
        } else {
            const monthlyRate = annualRate / 100 / 12;
            payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                (Math.pow(1 + monthlyRate, months) - 1);
            totalToPay = payment * months;
            totalInterest = totalToPay - principal;
        }

        setCalculatedPayment({
            monthly: Math.round(payment * 100) / 100,
            total: Math.round(totalToPay * 100) / 100,
            interest: Math.round(totalInterest * 100) / 100
        });
    };

    const handleInstallmentsChange = (value) => {
        const installments = parseInt(value) || 1;
        const updates = { installments_total: installments };

        if (installments > 1) {
            if (!showAdvanced) setShowAdvanced(true);
            // Default to 0% if no rate is selected yet
            if (formData.interestRate === '') {
                updates.interestRate = '0';
                updates.rateType = 'CFT';
            }
        }
        setFormData({ ...formData, ...updates });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');
        setIsSubmitting(true);

        const installments = parseInt(formData.installments_total) || 1;

        if (installments > 1 && !id) {
            // BURST MODE: Create N separate documents, one for each installment
            const docs = [];
            const baseDateParts = formData.date.split('-');
            const baseYear = parseInt(baseDateParts[0]);
            const baseMonth = parseInt(baseDateParts[1]) - 1; // 0-indexed
            const baseDay = parseInt(baseDateParts[2]);

            const monthlyAmount = calculatedPayment ? calculatedPayment.monthly : parseFloat(formData.amount) / installments;

            for (let i = 0; i < installments; i++) {
                // Calculate date for this installment
                const installmentDate = new Date(baseYear, baseMonth + i, baseDay);
                // Ensure if we start on 31st and next month has 30, it stays at end of month
                if (installmentDate.getDate() !== baseDay && i > 0) {
                    installmentDate.setDate(0); // Go to last day of previous month
                }

                docs.push({
                    ...formData,
                    loanName: `${formData.loanName} (${i + 1}/${installments})`,
                    amount: Math.round(monthlyAmount * 100) / 100,
                    date: installmentDate.toISOString().split('T')[0],
                    installments_paid: i + 1,
                    installments_total: installments,
                    interestRate: formData.interestRate !== '' ? parseFloat(formData.interestRate) : 0,
                    monthlyPayment: Math.round(monthlyAmount * 100) / 100,
                    totalToPay: calculatedPayment ? calculatedPayment.total : parseFloat(formData.amount)
                });
            }

            const result = await addDebt(docs);
            if (result.success) {
                navigate('/deudas');
            } else {
                setValidationError(result.error || 'Error al guardar las cuotas');
            }
        } else {
            // SINGLE DOC MODE: Legacy or Edit mode
            const amountNumber = parseFloat(formData.amount);
            const submitData = {
                ...formData,
                amount: amountNumber,
                interestRate: formData.interestRate !== '' ? parseFloat(formData.interestRate) : null,
                monthlyPayment: calculatedPayment ? calculatedPayment.monthly : null,
                totalToPay: calculatedPayment ? calculatedPayment.total : amountNumber
            };

            const result = await (id ? updateDebt(id, submitData) : addDebt(submitData));
            if (result.success) {
                navigate('/deudas');
            } else {
                setValidationError(result.error || 'Error al guardar la deuda');
            }
        }
        setIsSubmitting(false);
    };

    return (
        <div className="section fade-in">
            {/* Header Section like Ingresos */}
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/deudas')}
                        className="action-btn"
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.5rem' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                            {id ? 'Editar Deuda' : 'Nueva Deuda'}
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            {id ? 'Modificá los detalles de tu deuda o préstamo' : 'Registrá un nuevo compromiso financiero'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/deudas')}
                        className="action-btn"
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.9rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="add-btn"
                        disabled={isSubmitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {validationError && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--danger)'
                    }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '0.9rem' }}>{validationError}</span>
                    </div>
                )}

                <div className="form-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                    {/* Card 1: Main Info */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <CreditCard size={20} color="var(--primary)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Información Principal</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block', color: 'var(--text-dim)' }}>
                                    Entidad Financiera
                                </label>
                                <input
                                    list="entity-list"
                                    value={formData.entity}
                                    onChange={e => {
                                        const newEntity = e.target.value.toUpperCase();
                                        setFormData({
                                            ...formData,
                                            entity: newEntity,
                                            interestRate: '',
                                            rateType: 'TNA'
                                        });
                                    }}
                                    placeholder="SELECCIONAR..."
                                    required
                                    autoComplete="off"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        textTransform: 'uppercase'
                                    }}
                                />
                                <datalist id="entity-list">
                                    <option value="GALICIA" />
                                    <option value="SANTANDER" />
                                    <option value="BBVA" />
                                    <option value="BANCO NACION" />
                                    <option value="MERCADO PAGO" />
                                    <option value="UALA" />
                                    <option value="NARANJA X" />
                                    <option value="BRUBANK" />
                                    <option value="ICBC" />
                                </datalist>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ marginBottom: '0.5rem', display: 'block', color: 'var(--text-dim)' }}>Nombre / Concepto</label>
                                <input
                                    type="text"
                                    value={formData.loanName}
                                    onChange={e => setFormData({ ...formData, loanName: e.target.value })}
                                    placeholder="Ej: Préstamo Personal, Tarjeta..."
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ marginBottom: '0.5rem', display: 'block', color: 'var(--text-dim)' }}>Fecha de Vencimiento</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            colorScheme: 'dark'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Amounts & Installments */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <DollarSign size={20} color="var(--success)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Montos y Cuotas</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ marginBottom: '0.5rem', display: 'block', color: 'var(--text-dim)' }}>Monto Total ($)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontWeight: 'bold' }}>$</span>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                        step="0.01"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2rem',
                                            background: 'rgba(16, 185, 129, 0.05)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: '600',
                                            fontSize: '1.2rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block', color: 'var(--text-dim)' }}>Cuotas Pagadas</label>
                                    <input
                                        type="number"
                                        value={formData.installments_paid}
                                        onChange={e => setFormData({ ...formData, installments_paid: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block', color: 'var(--text-dim)' }}>Total Cuotas</label>
                                    <input
                                        type="number"
                                        value={formData.installments_total}
                                        onChange={e => handleInstallmentsChange(e.target.value)}
                                        min="1"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Interest & Settings (Full Width on Mobile, Side on Desktop) */}
                    <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <PieChart size={20} color="var(--warning)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Configuración Financiera</h3>
                            {formData.installments_total > 1 && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    color: 'var(--warning)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    marginLeft: 'auto'
                                }}>
                                    TASA REQUERIDA
                                </span>
                            )}
                        </div>

                        <div className="modal-grid-2">
                            <div>
                                <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-dim)' }}>
                                    Tasa / Financiación
                                </label>
                                <select
                                    value={formData.installments_total > 1 ? (formData.interestRate !== '' ? `${formData.interestRate}-${formData.rateType}` : '') : 'single'}
                                    onChange={e => {
                                        if (e.target.value === 'single' || e.target.value === '') {
                                            setFormData({ ...formData, interestRate: '', rateType: 'TNA' });
                                            return;
                                        }
                                        const [rate, type] = e.target.value.split('-');
                                        setFormData({
                                            ...formData,
                                            interestRate: rate,
                                            rateType: type
                                        });
                                    }}
                                    disabled={formData.installments_total <= 1}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        background: formData.installments_total > 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: formData.installments_total > 1 ? 'var(--text-main)' : 'var(--text-dim)',
                                        cursor: formData.installments_total > 1 ? 'pointer' : 'not-allowed',
                                        height: '45px'
                                    }}
                                >
                                    {formData.installments_total <= 1 ? (
                                        <option value="single">✓ Pago Único (Sin Interés)</option>
                                    ) : (
                                        <option value="">-- Seleccioná Tasa --</option>
                                    )}
                                    {formData.installments_total > 1 && getAvailableRates().map(rate => (
                                        <option key={rate.value} value={rate.value}>
                                            {rate.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {formData.installments_total <= 1 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '8px',
                                        border: '1px dashed rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>TOTAL A PAGAR</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                            ${parseFloat(formData.amount || 0).toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                ) : calculatedPayment ? (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>CUOTA ({formData.installments_total})</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)' }}>
                                                ${calculatedPayment.monthly.toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>TOTAL FINAL</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>${calculatedPayment.total.toLocaleString('es-AR')}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>INTERÉS TOTAL</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--danger)' }}>${calculatedPayment.interest.toLocaleString('es-AR')}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '1rem',
                                        color: 'var(--warning)',
                                        fontSize: '0.9rem',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        height: '100%'
                                    }}>
                                        <AlertCircle size={18} />
                                        Seleccioná una tasa para calcular
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default DebtForm;
