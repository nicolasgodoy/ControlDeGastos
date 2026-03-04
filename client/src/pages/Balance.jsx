import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Calendar, Sparkles, AlertOctagon } from 'lucide-react';
import { useIncome } from '../hooks/useIncome';
import { useDebts } from '../hooks/useDebts';
import { useExpenses } from '../hooks/useExpenses';
import AnimatedNumber from '../components/AnimatedNumber';

const Balance = () => {
    const { incomes } = useIncome();
    const { debts } = useDebts();
    const { expenses } = useExpenses();

    // --- Month selector ---
    const todayISO = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
    const [selectedMonth, setSelectedMonth] = useState(todayISO);

    // Build last 12 months as options
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        monthOptions.push({ value, label });
    }

    const selectedMonthName = monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth;

    // --- Filter by selectedMonth ---
    const monthlyIncomes = incomes.filter(income => income.date?.startsWith(selectedMonth));
    const totalIncome = monthlyIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

    const monthlyExpenses = expenses.filter(exp => exp.date?.startsWith(selectedMonth));
    const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    // Helper: parse YYYY-MM-DD as local date string prefix for comparison
    const getLocalMonthPrefix = (isoDateStr) => {
        if (!isoDateStr) return '';
        // isoDateStr could be "2026-04-12" or a full ISO timestamp
        return isoDateStr.slice(0, 7);
    };

    // Monthly debts: due in selected month
    // Exclude debts imported via Excel as 'paid' with no paidAt (historical records).
    const monthlyDebts = debts.filter(d => {
        if (d.status === 'paid' && !d.paidAt) return false;
        const debtMonth = getLocalMonthPrefix(d.date);
        const isSelectedMonth = debtMonth === selectedMonth;
        // Overdue pending only for current month view
        const isOverduePending = selectedMonth === todayISO && d.status === 'pending' && debtMonth < selectedMonth;
        return isSelectedMonth || isOverduePending;
    });

    // "Pagadas este mes": debts the user manually marked paid AND paidAt is in selectedMonth
    const paidMonthlyDebts = monthlyDebts.filter(d =>
        d.status === 'paid' &&
        d.paidAt &&
        d.paidAt.startsWith(selectedMonth)
    );
    const totalPaidDebts = paidMonthlyDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    // "Pendientes del mes": debts due this month not yet paid
    const pendingMonthlyDebts = monthlyDebts.filter(d => d.status === 'pending');
    const totalPendingDebts = pendingMonthlyDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    // totalDebts for formula display = paid + pending of the month
    const totalDebts = monthlyDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

    // Also track ALL pending debts for reference
    const allPendingDebts = debts.filter(d => d.status === 'pending');
    const totalAllPendingDebts = allPendingDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

    // REAL balance: only what was actually spent (paid debts + expenses)
    // Pending debts are NOT subtracted — they haven't left the account yet
    const realBalance = totalIncome - totalPaidDebts - totalExpenses;

    // PROJECTED balance: if all pending debts are also paid
    const projectedBalance = realBalance - totalPendingDebts;



    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="section">
            <div className="top-actions" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                        Balance de {selectedMonthName}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                        Resumen completo de tu situación financiera del mes
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="var(--text-dim)" />
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.75rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value} style={{ background: 'var(--card-bg)', textTransform: 'capitalize' }}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Balance Card */}
            <div className="glass-card" style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: realBalance >= 0 ?
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)' :
                    'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.03) 100%)',
                border: realBalance >= 0 ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                        Balance Real (Efectivo Disponible)
                    </p>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        margin: 0,
                        color: realBalance >= 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                        <AnimatedNumber value={realBalance} prefix="$" decimals={2} duration={1000} />
                    </h1>
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: realBalance >= 0 ? 'var(--success)' : 'var(--danger)',
                        background: realBalance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        width: 'fit-content',
                        margin: '0.75rem auto'
                    }}>
                        {realBalance >= 0 ? (
                            <>
                                <Sparkles size={16} />
                                <span>Superávit</span>
                            </>
                        ) : (
                            <>
                                <AlertOctagon size={16} />
                                <span>Déficit Financiero</span>
                            </>
                        )}
                    </div>

                    {/* Projected balance if all pending debts are paid */}
                    {totalPendingDebts > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-dim)',
                            marginTop: '0.25rem'
                        }}>
                            <span>Balance proyectado (si pagás todas las deudas pendientes):</span>
                            <span style={{ fontWeight: '700', color: projectedBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                ${projectedBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Financial Formula */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    padding: '1.25rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <TrendingUp size={18} color="var(--success)" />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>INGRESOS</span>
                        </div>
                        <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)', margin: 0 }}>
                            <AnimatedNumber value={totalIncome} prefix="$" decimals={2} />
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'var(--text-dim)' }}>
                        −
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <CreditCard size={18} color="var(--success)" />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>DEUDAS PAGADAS</span>
                        </div>
                        <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)', margin: 0 }}>
                            <AnimatedNumber value={totalPaidDebts} prefix="$" decimals={2} />
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'var(--text-dim)' }}>
                        −
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Wallet size={18} color="var(--primary)" />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>GASTOS</span>
                        </div>
                        <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                            <AnimatedNumber value={totalExpenses} prefix="$" decimals={2} />
                        </p>
                    </div>
                </div>

                {/* Pending debts warning */}
                {totalPendingDebts > 0 && (
                    <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(245, 158, 11, 0.08)',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>
                            ⚠️ Compromisos pendientes del mes ({pendingMonthlyDebts.length}):
                        </span>
                        <span style={{ fontWeight: '700', color: 'var(--warning)', fontSize: '0.95rem' }}>
                            ${totalPendingDebts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

                {/* Progress Bar */}
                {totalIncome > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                Ingresos comprometidos (real)
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                {totalIncome > 0 ? (100 - (realBalance / totalIncome * 100)).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100 - (realBalance / totalIncome * 100), 100)}%`,
                                background: (realBalance / totalIncome) > 0.3 ?
                                    'var(--success)' :
                                    (realBalance / totalIncome) > 0.1 ?
                                        'var(--warning)' :
                                        'var(--danger)',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Incomes Detail */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <TrendingUp size={20} color="var(--success)" />
                        Ingresos del Mes
                    </h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success)', marginBottom: '1rem' }}>
                        {formatCurrency(totalIncome)}
                    </p>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                        <p style={{ margin: '0.5rem 0' }}>
                            <strong>{monthlyIncomes.length}</strong> fuente{monthlyIncomes.length !== 1 ? 's' : ''} de ingreso
                        </p>
                        {monthlyIncomes.slice(0, 3).map(income => (
                            <div key={income.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                                <span>{income.source}</span>
                                <span style={{ color: 'var(--success)' }}>{formatCurrency(income.amount)}</span>
                            </div>
                        ))}
                        {monthlyIncomes.length > 3 && (
                            <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                                +{monthlyIncomes.length - 3} más...
                            </p>
                        )}
                    </div>
                </div>

                {/* Debts Detail */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <CreditCard size={20} color="var(--warning)" />
                        Deudas del Mes
                    </h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
                        {formatCurrency(totalPaidDebts)}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>ya pagadas este mes</p>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                        <p style={{ margin: '0.5rem 0' }}>
                            <strong>{monthlyDebts.length}</strong> compromisos en este periodo
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span>✓ Pagadas ({paidMonthlyDebts.length}):</span>
                            <span>{formatCurrency(totalPaidDebts)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                            <span>⏳ Pendientes ({pendingMonthlyDebts.length}):</span>
                            <span>{formatCurrency(totalPendingDebts)}</span>
                        </div>
                        {allPendingDebts.length > pendingMonthlyDebts.length && (
                            <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>Total pendiente global: </span>
                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                                    {formatCurrency(totalAllPendingDebts)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expenses Detail */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Wallet size={20} color="var(--primary)" />
                        Gastos del Mes
                    </h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '1rem' }}>
                        {formatCurrency(totalExpenses)}
                    </p>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                        <p style={{ margin: '0.5rem 0' }}>
                            <strong>{monthlyExpenses.length}</strong> gasto{monthlyExpenses.length !== 1 ? 's' : ''} variable{monthlyExpenses.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Balance;
