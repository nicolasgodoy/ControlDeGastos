import React from 'react';
import { DollarSign, CreditCard, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AnimatedNumber } from '../AnimatedNumber';

/**
 * Breakdown row of the Balance page. Shows three detailed cards for 
 * Incomes, Debts, and Expenses for the selected month.
 */
export const MonthlyBreakdown = ({ 
    totalIncome, 
    incomeEntries,
    totalDebts,
    totalPaidDebts,
    totalPendingDebts,
    monthlyDebts,
    totalExpenses,
    expenseEntries,
    fmt,
    isFuture,
    isCurrent,
    adelantosGlobal
}) => {
    return (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Income breakdown */}
            <div className="glass-card stat-item" style={{ borderLeft: '4px solid var(--success)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p className="label" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Ingresos del Mes</p>
                        <p className="value" style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            <AnimatedNumber value={totalIncome} prefix="$" decimals={0} />
                        </p>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '1rem' }}>
                        <TrendingUp size={24} color="var(--success)" />
                    </div>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        <span>Movimientos</span>
                        <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{incomeEntries.length} items</span>
                    </div>
                </div>
            </div>

            {/* Debt breakdown */}
            <div className="glass-card stat-item" style={{ borderLeft: '4px solid var(--warning)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p className="label" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Compromisos (Deudas)</p>
                        <p className="value" style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            <AnimatedNumber value={totalDebts} prefix="$" decimals={0} />
                        </p>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '1rem' }}>
                        <CreditCard size={24} color="var(--warning)" />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>PAGADO</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--success)' }}>{fmt(totalPaidDebts)}</p>
                    </div>
                    <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>PENDIENTE</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--warning)' }}>{fmt(totalPendingDebts)}</p>
                    </div>
                </div>
            </div>

            {/* Expenses breakdown */}
            <div className="glass-card stat-item" style={{ borderLeft: '4px solid var(--danger)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p className="label" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Gastos Personales</p>
                        <p className="value" style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            <AnimatedNumber value={totalExpenses} prefix="$" decimals={0} />
                        </p>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '1rem' }}>
                        <Wallet size={24} color="var(--danger)" />
                    </div>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        <span>Gastos registrados</span>
                        <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{expenseEntries.length} movimientos</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
