import React, { useState, useMemo } from 'react';
import { Calendar, BarChart3, Clock, AlertOctagon, Target } from 'lucide-react';
import { useData } from '../context/DataContext';

// Modular Components
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useBalanceData } from '../hooks/useBalanceData';
import { BalanceHeroCard } from '../components/Balance/BalanceHeroCard';
import { MonthlyBreakdown } from '../components/Balance/MonthlyBreakdown';
import { MonthProjectionCard } from '../components/Balance/MonthProjectionCard';

/**
 * Main Balance Page.
 * Orchestrates the modular components and provides the data via useBalanceData hook.
 */
const Balance = () => {
    const { incomes, debts, expenses } = useData();
    const todayISO = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(todayISO);

    // Build month selection options (last 12 months)
    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            const value = d.toISOString().slice(0, 7);
            const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    }, []);

    const selectedMonthName = monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth;

    // Data Hook - Centralizes all complex math and filtering
    const {
        fmt,
        isFuture,
        isCurrent,
        totalIncome,
        totalExpenses,
        totalPaidDebts,
        totalPendingDebts,
        totalDebts,
        monthlyDebts,
        adelantosGlobal,
        balance,
        balancePercentage,
        committedPercentage,
        monthlyProjections,
        incomeEntries,
        expenseEntries
    } = useBalanceData({ incomes, debts, expenses, selectedMonth, todayISO });

    // Summary stats for the projection section
    const totalPendingByEOY = useMemo(() => {
        return (debts || []).filter(d => {
            const m = d.date?.slice(0, 7) || '';
            return d.status === 'pending' && m >= todayISO && m <= `${new Date().getFullYear()}-12`;
        }).reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    }, [debts, todayISO]);

    const worstMonth = useMemo(() => {
        return monthlyProjections.length > 0
            ? monthlyProjections.reduce((a, b) => b.projectedBalance < a.projectedBalance ? b : a)
            : null;
    }, [monthlyProjections]);

    return (
        <div className="section">
            {/* Header and Month Selector */}
            <div className="top-actions" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                        Balance de {selectedMonthName}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                        Resumen financiero del mes + proyección hasta dic {new Date().getFullYear()}
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
                            textTransform: 'capitalize',
                        }}
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}
                                style={{ background: 'var(--card-bg)', textTransform: 'capitalize' }}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Balance Hero Card (The one with the formula) */}
            <BalanceHeroCard 
                fmt={fmt}
                balance={balance}
                balancePercentage={balancePercentage}
                committedPercentage={committedPercentage}
                totalIncome={totalIncome}
                totalPaidDebts={totalPaidDebts}
                totalPendingDebts={totalPendingDebts}
                totalExpenses={totalExpenses}
                isFuture={isFuture}
                isCurrent={isCurrent}
                adelantosGlobal={adelantosGlobal}
            />

            <div style={{ height: '2rem' }} />

            {/* Detailed Cards Grid */}
            <MonthlyBreakdown 
                totalIncome={totalIncome}
                incomeEntries={incomeEntries}
                totalDebts={totalDebts}
                totalPaidDebts={totalPaidDebts}
                totalPendingDebts={totalPendingDebts}
                monthlyDebts={monthlyDebts}
                totalExpenses={totalExpenses}
                expenseEntries={expenseEntries}
                fmt={fmt}
                isFuture={isFuture}
                isCurrent={isCurrent}
                adelantosGlobal={adelantosGlobal}
            />

            <div style={{ height: '3rem' }} />

            {/* Yearly Projection Section */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                            <BarChart3 size={24} color="var(--primary)" />
                            Evolución de Ahorro Proyectado
                        </h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                            Impacto acumulado de tus deudas y gastos sobre tu capacidad de ahorro
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {totalPendingByEOY > 0 && (
                            <div style={{
                                padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.75rem',
                                background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                                border: '1px solid rgba(245,158,11,0.2)', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                <Clock size={14} />
                                Pendiente EOY: {fmt(totalPendingByEOY)}
                            </div>
                        )}
                        {worstMonth && (
                            <div style={{
                                padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.75rem',
                                background: 'rgba(239,68,68,0.08)', color: 'var(--danger)',
                                border: '1px solid rgba(239,68,68,0.15)', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                textTransform: 'capitalize',
                            }}>
                                <AlertOctagon size={14} />
                                Mes Crítico: {worstMonth.key.split('-')[1]}/{worstMonth.key.split('-')[0]}
                            </div>
                        )}
                    </div>
                </div>

                {/* Projection Legend / Warning */}
                <div style={{
                    display: 'flex', gap: '1rem', flexWrap: 'wrap',
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem', color: 'var(--text-main)',
                    lineHeight: '1.5',
                }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>💡 NOTA:</span>
                            El "Saldo Libre" es dinámico y disminuirá a medida que cargues nuevos gastos reales.
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            · Meses futuros sin datos reales de ingresos estiman tu promedio histórico.
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.25rem' }}>
                        <span style={{ color: 'var(--warning)', fontWeight: '700' }}>■ Naranja: Deuda</span>
                        <span style={{ color: 'var(--success)', fontWeight: '700' }}>■ Verde: Pagado</span>
                    </div>
                </div>

                {/* Timeline of monthly cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {monthlyProjections.map((month) => (
                        <MonthProjectionCard
                            key={month.key}
                            month={month}
                            fmt={fmt}
                        />
                    ))}
                </div>

                {/* Yearly Goal Summary */}
                {monthlyProjections.length > 0 && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1.5rem',
                        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '1.25rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '1rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Target size={24} color="var(--primary)" />
                            <div>
                                <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', display: 'block' }}>
                                    Capacidad de Ahorro Acumulada
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Proyectado a diciembre de {new Date().getFullYear()}</span>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '2.5rem', fontWeight: '900',
                            color: monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}>
                            {monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0 ? '+' : ''}
                            <AnimatedNumber 
                                value={monthlyProjections[monthlyProjections.length - 1].cumulativeBalance} 
                                prefix="$" 
                                decimals={0} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Balance;
