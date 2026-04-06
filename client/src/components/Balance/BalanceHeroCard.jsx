import React from 'react';
import { DollarSign, CreditCard, Wallet, Info } from 'lucide-react';
import { AnimatedNumber } from '../AnimatedNumber';

/**
 * Main KPI card for the Balance page. Shows the total available balance,
 * the formula grid (Income - Debts - Expenses), and a visual progress bar.
 */
export const BalanceHeroCard = ({ 
    fmt, 
    balance, 
    balancePercentage, 
    committedPercentage,
    totalIncome,
    totalPaidDebts,
    totalPendingDebts,
    totalExpenses,
    isFuture,
    isCurrent,
    adelantosGlobal
}) => {
    return (
        <div className="glass-card main-balance-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Balance Disponible</p>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-1.5px', color: balance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0, lineHeight: 1 }}>
                        <AnimatedNumber value={balance} prefix="$" decimals={0} />
                    </h1>
                </div>

                {/* Formula Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', flex: '2', minWidth: '400px', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <DollarSign size={16} color="var(--success)" />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>INGRESOS</span>
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--success)', margin: 0 }}>
                            <AnimatedNumber value={totalIncome} prefix="$" decimals={0} />
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <CreditCard size={16} color={totalPaidDebts > 0 ? "var(--success)" : "var(--warning)"} />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                                {isFuture ? 'YA ADELANTADAS' : 'DEUDAS PAGADAS'}
                            </span>
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: '700', color: totalPaidDebts > 0 ? 'var(--success)' : 'var(--text-dim)', margin: 0 }}>
                            <AnimatedNumber value={totalPaidDebts} prefix="$" decimals={0} />
                        </p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--warning)', margin: '2px 0 0' }}>
                            +{fmt(totalPendingDebts)} pendiente{totalPendingDebts !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Wallet size={16} color="var(--danger)" />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>GASTOS</span>
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--danger)', margin: 0 }}>
                            <AnimatedNumber value={totalExpenses} prefix="$" decimals={0} />
                        </p>
                    </div>

                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Info size={16} color="var(--primary)" />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>RESTO LIBRE</span>
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: '900', color: balance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
                            {Math.round(balancePercentage)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Budget Progress Bar */}
            <div style={{ position: 'relative' }}>
                <div style={{ height: '12px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (totalPaidDebts / totalIncome) * 100)}%`, background: 'var(--success)', transition: 'width 0.5s ease' }} title="Pagado" />
                    <div style={{ height: '100%', width: `${Math.min(100, (totalPendingDebts / totalIncome) * 100)}%`, background: 'var(--warning)', transition: 'width 0.5s ease' }} title="Pendiente" />
                    <div style={{ height: '100%', width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%`, background: 'var(--danger)', transition: 'width 0.5s ease' }} title="Gastos" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>Comprometido: {Math.round(committedPercentage)}%</span>
                    <span>Libre: {Math.round(balancePercentage)}%</span>
                </div>
            </div>
        </div>
    );
};
