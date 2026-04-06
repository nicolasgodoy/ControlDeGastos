import React, { useState } from 'react';
import { TrendingUp, TrendingDown, CreditCard, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { AnimatedNumber } from '../AnimatedNumber';

/**
 * Individual month card used in the yearly projection list.
 */
export const MonthProjectionCard = ({ month, fmt }) => {
    const [expanded, setExpanded] = useState(false);
    
    const balanceColor = month.projectedBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    const cumulativeColor = month.cumulativeBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    
    const [year, monthNum] = month.key.split('-');
    const monthLabel = new Date(year, monthNum - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const monthLabelDisplay = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    // Progress bar calculations
    const totalAllocated = month.pendingDebts + month.paidDebts + month.expenses;
    const progressPending = month.income > 0 ? (month.pendingDebts / month.income) * 100 : 0;
    const progressPaid = month.income > 0 ? (month.paidDebts / month.income) * 100 : 0;
    const progressExpenses = month.income > 0 ? (month.expenses / month.income) * 100 : 0;

    return (
        <div key={month.key} className="glass-card" style={{ 
            padding: '1.25rem', 
            background: month.isCurrentMonth ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-bg)',
            border: month.isCurrentMonth ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {month.isCurrentMonth && (
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#f97316', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Hoy
                </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: month.isCurrentMonth ? '1.5rem' : '0' }}>{monthLabelDisplay}</h3>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <TrendingUp size={14} color="var(--success)" /> <AnimatedNumber value={month.income} prefix="$ " />
                        </span>
                        {month.paidDebts > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CreditCard size={14} color="var(--success)" /> <AnimatedNumber value={month.paidDebts} prefix="$ " /> <span style={{fontSize: '0.75rem'}}>pagado</span>
                            </span>
                        )}
                        {month.pendingDebts > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <TrendingDown size={14} color="var(--warning)" /> <AnimatedNumber value={month.pendingDebts} prefix="$ " /> <span style={{fontSize: '0.75rem'}}>pendientes</span>
                            </span>
                        )}
                        {month.expenses > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Wallet size={14} color="var(--text-dim)" /> <AnimatedNumber value={month.expenses} prefix="$ " /> <span style={{fontSize: '0.75rem'}}>gastos</span>
                            </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '0.75rem' }}>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Resto Deuda:</span> <strong>{fmt(month.totalDebts)}</strong>
                        </span>
                    </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {month.isCurrentMonth ? 'Saldo Libre (Real)' : 'Saldo Libre del mes'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: balanceColor, lineHeight: 1.1 }}>
                        {month.projectedBalance >= 0 ? '+' : ''}{fmt(month.projectedBalance)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acumulado</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: cumulativeColor }}>
                        {month.cumulativeBalance >= 0 ? '+' : ''}{fmt(month.cumulativeBalance)}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginTop: '0.5rem' }}>
                <div style={{ height: '100%', width: `${progressPaid}%`, background: 'var(--success)' }} title="Pagado" />
                <div style={{ height: '100%', width: `${progressPending}%`, background: 'var(--warning)' }} title="Pendiente" />
                <div style={{ height: '100%', width: `${progressExpenses}%`, background: 'var(--text-dim)' }} title="Gastos" />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '-0.2rem' }}>
                {month.paidDebts > 0 && progressPaid > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: '600' }}>
                        ■ Pagado+Adelantos {progressPaid.toFixed(0)}%
                    </span>
                )}
                {month.pendingDebts > 0 && progressPending > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--warning)', fontWeight: '600' }}>
                        ■ Pendientes {progressPending.toFixed(0)}%
                    </span>
                )}
                {month.expenses > 0 && progressExpenses > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                        ■ Gastos {progressExpenses.toFixed(0)}%
                    </span>
                )}
            </div>

            {/* Info for future months with adelantos */}
            {!month.isCurrentMonth && month.totalDebts > 0 && month.pendingDebts < month.totalDebts && (
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontStyle: 'italic' }}>
                    <span>✓ {fmt(month.totalDebts - month.pendingDebts)} ya adelantadas (no afectan este saldo)</span>
                </div>
            )}

            <button 
                onClick={() => setExpanded(!expanded)}
                style={{ 
                    background: 'transparent', border: 'none', color: 'var(--text-dim)', 
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', 
                    padding: '0.4rem 0', cursor: 'pointer', outline: 'none' 
                }}
            >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded ? 'Ocultar detalles' : `Ver ${month.debtItems.length} cuota${month.debtItems.length !== 1 ? 's' : ''} del mes`}
            </button>

            {expanded && (
                <div style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem'
                }}>
                    {month.debtItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ 
                                    width: '8px', height: '8px', borderRadius: '50%', 
                                    background: item.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                    boxShadow: item.status === 'paid' ? '0 0 5px var(--success)' : '0 0 5px var(--warning)'
                                }} />
                                <span style={{ color: 'var(--text-dim)' }}>{item.entity}</span>
                                <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>({item.loanName || 'Préstamo'})</span>
                            </div>
                            <span style={{ fontWeight: '700', color: item.status === 'paid' ? 'var(--success)' : 'var(--text-main)' }}>
                                {fmt(item.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
