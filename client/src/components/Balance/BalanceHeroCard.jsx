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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="glass-card main-balance-card" style={{ 
            padding: isMobile ? '1.5rem' : '2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? '1.5rem' : '2.5rem', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)', 
            border: '1px solid rgba(99, 102, 241, 0.2)' 
        }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                flexWrap: 'wrap', 
                gap: isMobile ? '1.5rem' : '2rem' 
            }}>
                <div style={{ flex: '1', width: '100%', minWidth: isMobile ? '200px' : '300px' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: isMobile ? '0.75rem' : '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Balance Disponible</p>
                    <h1 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: '900', letterSpacing: '-1.5px', color: balance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0, lineHeight: 1 }}>
                        <AnimatedNumber value={balance} prefix="$" decimals={0} />
                    </h1>
                </div>

                {/* Formula Grid - Forced Flex Fix */}
                <div className="formula-grid-force-flex">
                    <div className="formula-grid-item">
                        <div className="formula-icon-label">
                            <DollarSign size={16} color="var(--success)" />
                            <span>INGRESOS</span>
                        </div>
                        <p className="formula-value success">
                            <AnimatedNumber value={totalIncome} prefix="$" decimals={0} />
                        </p>
                    </div>

                    <div className="formula-grid-item">
                        <div className="formula-icon-label">
                            <CreditCard size={16} color={totalPaidDebts > 0 ? "var(--success)" : "var(--warning)"} />
                            <span>{isFuture ? 'ADELANTOS' : 'PAGADO'}</span>
                        </div>
                        <p className={`formula-value ${totalPaidDebts > 0 ? 'success' : 'dim'}`}>
                            <AnimatedNumber value={totalPaidDebts} prefix="$" decimals={0} />
                        </p>
                        <p className="formula-sub warning">
                            +{fmt(totalPendingDebts)} pend.
                        </p>
                    </div>

                    <div className="formula-grid-item">
                        <div className="formula-icon-label">
                            <Wallet size={16} color="var(--danger)" />
                            <span>GASTOS</span>
                        </div>
                        <p className="formula-value danger">
                            <AnimatedNumber value={totalExpenses} prefix="$" decimals={0} />
                        </p>
                    </div>

                    <div className="formula-grid-item border-left">
                        <div className="formula-icon-label">
                            <Info size={16} color="var(--primary)" />
                            <span>RESTO LIBRE</span>
                        </div>
                        <p className="formula-value accent">
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
