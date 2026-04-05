import React, { useState, useMemo } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard,
    Calendar, Sparkles, AlertOctagon, ChevronDown, ChevronUp,
    ArrowRight, Target, BarChart3, Clock
} from 'lucide-react';
import { useData } from '../context/DataContext';
import AnimatedNumber from '../components/AnimatedNumber';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);

const monthLabel = (yyyy, mm) => {
    const d = new Date(Number(yyyy), Number(mm) - 1, 1);
    return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};

// ─── MonthProjectionCard component ─────────────────────────────────────────
const MonthProjectionCard = ({ month, isCurrentMonth, isCurrent }) => {
    const [expanded, setExpanded] = useState(false);

    const balanceColor = month.projectedBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    const cumulativeColor = month.cumulativeBalance >= 0 ? 'var(--success)' : 'var(--danger)';

    return (
        <div
            style={{
                background: isCurrentMonth
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)'
                    : 'var(--card-bg)',
                border: isCurrentMonth
                    ? '1px solid rgba(99,102,241,0.35)'
                    : month.projectedBalance < 0
                        ? '1px solid rgba(239,68,68,0.2)'
                        : '1px solid var(--glass-border)',
                borderRadius: '1rem',
                padding: '1rem 1.25rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Top glow line for current month */}
            {isCurrentMonth && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                {/* Left: month name + badge */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            color: isCurrentMonth ? 'var(--primary)' : 'var(--text-main)',
                            textTransform: 'capitalize',
                        }}>
                            {month.label}
                        </span>
                        {isCurrentMonth && (
                            <span style={{
                                fontSize: '0.6rem', fontWeight: '700',
                                background: 'var(--primary)', color: '#fff',
                                padding: '2px 6px', borderRadius: '20px',
                            }}>HOY</span>
                        )}
                    </div>

                    {/* Mini stats row */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>
                            <span style={{ color: 'var(--success)' }}>↑</span> <strong style={{ color: 'var(--text-main)' }}>{fmt(month.income)}</strong>
                        </span>
                        {month.pendingDebts > 0 && (
                            <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--warning)' }}>↓</span> <strong style={{ color: 'var(--text-main)' }}>{fmt(month.pendingDebts)}</strong> pendientes
                            </span>
                        )}
                        {month.paidDebts > 0 && isCurrentMonth && (
                            <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> <strong style={{ color: 'var(--text-main)' }}>{fmt(month.paidDebts)}</strong> pagado
                            </span>
                        )}
                        {month.expenses > 0 && (
                            <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--primary)' }}>↓</span> <strong style={{ color: 'var(--text-main)' }}>{fmt(month.expenses)}</strong> gastos
                            </span>
                        )}
                        <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)', borderLeft: '1px solid var(--glass-border)', paddingLeft: '0.75rem' }}>
                            Resto Deuda: <strong style={{ color: 'var(--text-main)' }}>{fmt(month.remainingDebtAfterMonth)}</strong>
                        </span>
                    </div>
                </div>

                {/* Right: balance del mes + acumulado */}
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isCurrentMonth ? 'Saldo Libre (Real)' : 'Saldo Libre del mes'}
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

            {/* Debt bar */}
            {(month.barPendingDebts > 0 || month.barPaidDebts > 0 || month.barExpenses > 0) && month.income > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{
                        height: '5px', background: 'var(--bg-subtle)',
                        borderRadius: '10px', overflow: 'hidden',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                    }}>
                        {/* Paid Debts bar */}
                        <div style={{
                            height: '100%',
                            width: `${Math.min((month.barPaidDebts / month.income) * 100, 100)}%`,
                            background: 'var(--success)',
                            transition: 'width 0.5s ease',
                        }} />
                        {/* Pending Debts bar */}
                        <div style={{
                            height: '100%',
                            width: `${Math.min((month.barPendingDebts / month.income) * 100, 100 - (month.barPaidDebts / month.income) * 100)}%`,
                            background: 'var(--warning)',
                            transition: 'width 0.5s ease',
                        }} />
                        {/* Expenses bar */}
                        <div style={{
                            height: '100%',
                            width: `${Math.min((month.barExpenses / month.income) * 100, 100 - ((month.barPaidDebts + month.barPendingDebts) / month.income) * 100)}%`,
                            background: 'var(--primary)',
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        {month.barPendingDebts > 0 && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--warning)' }}>
                                ■ Pendientes {((month.barPendingDebts / month.income) * 100).toFixed(0)}%
                            </span>
                        )}
                        {month.barPaidDebts > 0 && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>
                                ■ {isCurrentMonth ? 'Pagado+Adelantos' : 'Pagadas'} {((month.barPaidDebts / month.income) * 100).toFixed(0)}%
                            </span>
                        )}
                        {month.barExpenses > 0 && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>
                                ■ Gastos {((month.barExpenses / month.income) * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* If there are prepayments, show a little note for future months */}
            {!isCurrentMonth && month.paidDebts > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: '600' }}>
                    ✓ {fmt(month.paidDebts)} ya adelantadas (no afectan este saldo)
                </div>
            )}

            {/* Expand detail toggle */}
            {month.debtItems.length > 0 && (
                <>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        style={{
                            marginTop: '0.6rem',
                            background: 'none', border: 'none',
                            color: 'var(--text-dim)', cursor: 'pointer',
                            fontSize: '0.72rem', display: 'flex',
                            alignItems: 'center', gap: '0.3rem',
                            padding: '0', transition: 'color 0.2s',
                        }}
                    >
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {expanded ? 'Ocultar' : `Ver ${month.debtItems.length} cuota${month.debtItems.length !== 1 ? 's' : ''} del mes`}
                    </button>

                    {expanded && (
                        <div style={{
                            marginTop: '0.6rem',
                            padding: '0.6rem',
                            background: 'var(--bg-subtle)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', flexDirection: 'column', gap: '0.35rem',
                        }}>
                            {month.debtItems.map((di, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', fontSize: '0.75rem',
                                }}>
                                    <span style={{ color: 'var(--text-dim)' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '6px', height: '6px',
                                            borderRadius: '50%',
                                            background: di.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                            marginRight: '5px', verticalAlign: 'middle',
                                        }} />
                                        {di.entity} · {di.loanName}
                                    </span>
                                    <span style={{
                                        fontWeight: '600',
                                        color: di.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                    }}>
                                        {fmt(di.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─── Main Balance component ──────────────────────────────────────────────────
const Balance = () => {
    const { incomes, debts, expenses } = useData();

    const todayISO = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(todayISO);

    // Build last 12 months for the selector
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

    // ── Current month detail ────────────────────────────────────────────────
    const monthlyIncomes = incomes.filter(i => i.date?.startsWith(selectedMonth));
    const totalIncome = monthlyIncomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0);

    const monthlyExpenses = expenses.filter(e => e.date?.startsWith(selectedMonth));
    const totalExpenses = monthlyExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    const { totalPaidDebts, totalPendingDebts, totalDebts, monthlyDebts } = (debts || []).reduce((acc, d) => {
        const debtMonth = d.date?.slice(0, 7) || '';
        const isSelectedMonth = debtMonth === selectedMonth;
        const isOverduePending = selectedMonth === todayISO && d.status === 'pending' && debtMonth < selectedMonth;
        if (isSelectedMonth || isOverduePending) {
            acc.monthlyDebts.push(d);
            acc.totalDebts += parseFloat(d.amount || 0);
            if (d.status === 'paid') acc.totalPaidDebts += parseFloat(d.amount || 0);
            else acc.totalPendingDebts += parseFloat(d.amount || 0);
        }
        return acc;
    }, { totalPaidDebts: 0, totalPendingDebts: 0, totalDebts: 0, monthlyDebts: [] });

    const paidMonthlyDebts = monthlyDebts.filter(d => d.status === 'paid');
    const pendingMonthlyDebts = monthlyDebts.filter(d => d.status === 'pending');
    const allPendingDebts = (debts || []).filter(d => d.status === 'pending');
    const totalAllPendingDebts = allPendingDebts.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

    // Sum of all debts that are due in the FUTURE but already paid (adelantos)
    const adelantosGlobal = useMemo(() => {
        return (debts || []).reduce((acc, d) => {
            const m = d.date?.slice(0, 7) || '';
            if (m > todayISO && d.status === 'paid') return acc + parseFloat(d.amount || 0);
            return acc;
        }, 0);
    }, [debts, todayISO]);

    const isFuture = selectedMonth > todayISO;
    const isCurrent = selectedMonth === todayISO;

    // Balance calculation:
    // Future: Income - Pending - Expenses (already paid debts don't affect future income)
    // Current/Past: Income - Pending - Paid - Expenses (Money that left the pocket in that month)
    // Note: Adelantos for FUTURE months are NOT subtracted here to keep the monthly "Saldo Libre" clean,
    // they are instead subtracted from the cumulative balance below.
    const balance = totalIncome 
        - (isFuture ? 0 : totalPaidDebts) 
        - totalPendingDebts 
        - totalExpenses;
    
    const balancePercentage = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    const committedPercentage = 100 - balancePercentage;

    // ── Monthly projection: today → Dec of current year ──────────────────────
    const monthlyProjections = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthNum = now.getMonth() + 1; // 1-based

        // Estimate a "base monthly income" from the most recent month with income data
        // We look at the last 3 months with income and average them
        const recentIncomeMonths = {};
        incomes.forEach(inc => {
            const m = inc.date?.slice(0, 7) || '';
            if (m) recentIncomeMonths[m] = (recentIncomeMonths[m] || 0) + parseFloat(inc.amount || 0);
        });
        const recentVals = Object.values(recentIncomeMonths).slice(0, 3);
        const avgMonthlyIncome = recentVals.length > 0
            ? recentVals.reduce((a, b) => a + b, 0) / recentVals.length
            : 0;

        // monthly expense averaging logic removed per user request (not used in projection)

        // Group all debts by YYYY-MM
        const debtsByMonth = {};
        let futurePaidDebtsSum = 0;
        (debts || []).forEach(d => {
            const m = d.date?.slice(0, 7) || '';
            if (!m) return;
            if (!debtsByMonth[m]) debtsByMonth[m] = [];
            debtsByMonth[m].push(d);

            // Collect debts that are due in the FUTURE but are already marked PAID
            if (m > todayISO && d.status === 'paid') {
                futurePaidDebtsSum += parseFloat(d.amount || 0);
            }
        });

        const months = [];
        let cumulativeBalance = 0;

        for (let m = currentMonthNum; m <= 12; m++) {
            const yyyy = currentYear;
            const mm = String(m).padStart(2, '0');
            const key = `${yyyy}-${mm}`;
            const isCurrentMonth = key === todayISO;

            // Income: use actual data if available, else avgMonthlyIncome
            const actualIncomeEntries = incomes.filter(i => i.date?.startsWith(key));
            const monthIncome = actualIncomeEntries.length > 0
                ? actualIncomeEntries.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
                : avgMonthlyIncome;

            // Expenses: use actual data only (no fallback to avg for future months)
            const actualExpenseEntries = expenses.filter(e => e.date?.startsWith(key));
            const monthExpenses = actualExpenseEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

            // Debts: all debts that fall in this month
            const monthDebtItems = debtsByMonth[key] || [];
            const monthDebtsTotal = monthDebtItems.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
            const paidDebtsTotal = monthDebtItems
                .filter(d => d.status === 'paid')
                .reduce((s, d) => s + parseFloat(d.amount || 0), 0);
            const pendingDebtsTotal = monthDebtItems
                .filter(d => d.status === 'pending')
                .reduce((s, d) => s + parseFloat(d.amount || 0), 0);

            // Cash flow logic for the month:
            // - For any month: deduct what's still pending and what was paid IN that month
            // - For future months: if it's already paid, it doesn't take from that month's income
            let cashFlowDeductions = pendingDebtsTotal + (isCurrentMonth ? paidDebtsTotal : 0);
            
            // Bar visualization: match the balance logic
            let barPaidDebts = isCurrentMonth ? paidDebtsTotal : 0;
            let barPendingDebts = pendingDebtsTotal;
            let barExpenses = monthExpenses;

            const projectedBalance = monthIncome - cashFlowDeductions - monthExpenses;
            cumulativeBalance += projectedBalance;

            months.push({
                key,
                label: monthLabel(yyyy, mm),
                income: monthIncome,
                debts: monthDebtsTotal,
                paidDebts: paidDebtsTotal,
                pendingDebts: pendingDebtsTotal,
                futurePaidDebtsSum: isCurrentMonth ? futurePaidDebtsSum : 0,
                expenses: monthExpenses,
                projectedBalance,
                cumulativeBalance,
                debtItems: monthDebtItems,
                barPendingDebts,
                barPaidDebts,
                barExpenses,
                hasActualIncome: actualIncomeEntries.length > 0,
                hasActualExpenses: actualExpenseEntries.length > 0,
                remainingDebtAfterMonth: (debts || [])
                    .filter(d => d.status === 'pending' && (d.date && d.date.substring(0, 7) > key))
                    .reduce((s, d) => s + parseFloat(d.amount || 0), 0)
            });
        }
        return months;
    }, [debts, incomes, expenses, todayISO]);

    // Summary stats for projection
    const totalPendingByEOY = (debts || []).filter(d => {
        const m = d.date?.slice(0, 7) || '';
        return d.status === 'pending' && m >= todayISO && m <= `${new Date().getFullYear()}-12`;
    }).reduce((s, d) => s + parseFloat(d.amount || 0), 0);

    const worstMonth = monthlyProjections.length > 0
        ? monthlyProjections.reduce((a, b) => b.projectedBalance < a.projectedBalance ? b : a)
        : null;

    return (
        <div className="section">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="top-actions" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
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

            {/* ── Main Balance Card ───────────────────────────────────────── */}
            <div className="glass-card" style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                background: balance >= 0
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.03) 100%)',
                border: balance >= 0 ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)',
                boxShadow: 'var(--shadow-md)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                        Balance Disponible
                    </p>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: '800', margin: 0,
                        color: balance >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                        <AnimatedNumber value={balance} prefix="$" decimals={2} duration={1000} />
                    </h1>
                    <div style={{
                        marginTop: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        fontSize: '0.9rem', fontWeight: '600',
                        color: balance >= 0 ? 'var(--success)' : 'var(--danger)',
                        background: balance >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        padding: '0.4rem 1rem', borderRadius: '20px',
                        width: 'fit-content', margin: '0.75rem auto',
                    }}>
                        {balance >= 0 ? <><Sparkles size={16} /><span>Superávit</span></> : <><AlertOctagon size={16} /><span>Déficit Financiero</span></>}
                    </div>
                    {totalPendingDebts > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.4rem',
                            background: 'rgba(245,158,11,0.08)', padding: '0.4rem 1rem',
                            borderRadius: '20px', width: 'fit-content', margin: '0.4rem auto 0',
                        }}>
                            <span>⚠️ Pendientes este mes: <strong>{fmt(totalPendingDebts)}</strong></span>
                        </div>
                    )}
                </div>

                {/* Formula grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <TrendingUp size={16} color="var(--success)" />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>INGRESOS</span>
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--success)', margin: 0 }}>
                            <AnimatedNumber value={totalIncome} prefix="$" decimals={0} />
                        </p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                            {monthlyIncomes.length} fuente{monthlyIncomes.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'var(--text-dim)' }}>−</div>

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
                            +{fmt(totalPendingDebts)} pendiente{pendingMonthlyDebts.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'var(--text-dim)' }}>−</div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Wallet size={16} color="var(--primary)" />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>GASTOS</span>
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                            <AnimatedNumber value={totalExpenses} prefix="$" decimals={0} />
                        </p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                            {monthlyExpenses.length} gasto{monthlyExpenses.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                {totalIncome > 0 && (
                    <div style={{ marginTop: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Ingresos comprometidos</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                {Math.min(committedPercentage, 100).toFixed(1)}%
                            </span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min((totalPaidDebts / totalIncome) * 100, 100)}%`,
                                background: 'var(--warning)',
                                transition: 'width 0.5s ease',
                            }} />
                            <div style={{
                                height: '100%',
                                width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%`,
                                background: 'var(--primary)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            <span style={{ color: 'var(--warning)' }}>■ Deudas</span>
                            <span style={{ color: 'var(--primary)' }}>■ Gastos</span>
                            <span style={{ color: 'var(--success)' }}>■ Libre</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detailed breakdown row ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* Incomes */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        <TrendingUp size={18} color="var(--success)" /> Ingresos del Mes
                    </h3>
                    <p style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.75rem' }}>
                        {fmt(totalIncome)}
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {monthlyIncomes.slice(0, 4).map(inc => (
                            <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{inc.source}</span>
                                <span style={{ color: 'var(--success)', fontWeight: '600' }}>{fmt(inc.amount)}</span>
                            </div>
                        ))}
                        {monthlyIncomes.length > 4 && (
                            <span style={{ fontStyle: 'italic' }}>+{monthlyIncomes.length - 4} más…</span>
                        )}
                        {monthlyIncomes.length === 0 && (
                            <span style={{ fontStyle: 'italic' }}>Sin ingresos registrados este mes</span>
                        )}
                    </div>
                </div>

                {/* Debts */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        <CreditCard size={18} color="var(--warning)" /> Deudas del Mes
                    </h3>
                    <p style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
                        {fmt(totalPaidDebts)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>ya pagadas</p>
                    <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                            <span>✓ Pagadas ({paidMonthlyDebts.length})</span>
                            <span>{fmt(totalPaidDebts)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                            <span>⏳ Pendientes ({pendingMonthlyDebts.length})</span>
                            <span>{fmt(totalPendingDebts)}</span>
                        </div>
                        {allPendingDebts.length > pendingMonthlyDebts.length && (
                            <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(99,102,241,0.06)', borderRadius: '6px', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>Total pendiente global: </span>
                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{fmt(totalAllPendingDebts)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expenses */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        <Wallet size={18} color="var(--primary)" /> Gastos del Mes
                    </h3>
                    <p style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                        {fmt(totalExpenses)}
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {monthlyExpenses.slice(0, 4).map(exp => (
                            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{exp.description || exp.category}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{fmt(exp.amount)}</span>
                            </div>
                        ))}
                        {monthlyExpenses.length > 4 && (
                            <span style={{ fontStyle: 'italic' }}>+{monthlyExpenses.length - 4} más…</span>
                        )}
                        {monthlyExpenses.length === 0 && (
                            <span style={{ fontStyle: 'italic' }}>Sin gastos registrados este mes</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Yearly Projection Section ───────────────────────────────── */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart3 size={20} color="var(--primary)" />
                            Proyección hasta fin de año
                        </h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
                            Impacto mes a mes de deudas del Excel + gastos sobre tu balance
                        </p>
                    </div>

                    {/* Summary pills */}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {totalPendingByEOY > 0 && (
                            <div style={{
                                padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.75rem',
                                background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                                border: '1px solid rgba(245,158,11,0.2)', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                            }}>
                                <Clock size={13} />
                                {fmt(totalPendingByEOY)} pendiente hasta dic
                            </div>
                        )}
                        {worstMonth && (
                            <div style={{
                                padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.75rem',
                                background: 'rgba(239,68,68,0.08)', color: 'var(--danger)',
                                border: '1px solid rgba(239,68,68,0.15)', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                textTransform: 'capitalize',
                            }}>
                                <AlertOctagon size={13} />
                                Mes más pesado: {worstMonth.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex', gap: '1rem', flexWrap: 'wrap',
                    padding: '0.75rem 1rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    marginBottom: '1rem',
                    fontSize: '0.78rem', color: 'var(--text-main)',
                    lineHeight: '1.4',
                }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>💡 Nota sobre Proyecciones:</span>
                            El "Saldo Libre" es dinámico y disminuirá a medida que cargues tus gastos personales reales en cada mes.
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                            · Los meses futuros sin datos reales de ingresos usan tu promedio histórico.
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
                        <span style={{ color: 'var(--warning)', fontWeight: '600' }}>■ Naranja: Pendiente</span>
                        <span style={{ color: 'var(--success)', fontWeight: '600' }}>■ Verde: Pagado</span>
                    </div>
                </div>

                {/* Month cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {monthlyProjections.map((month, idx) => (
                        <MonthProjectionCard
                            key={month.key}
                            month={month}
                            isCurrentMonth={month.key === todayISO}
                            isCurrent={idx === 0}
                        />
                    ))}
                </div>

                {/* End of year summary */}
                {monthlyProjections.length > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem 1.25rem',
                        background: monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 100%)'
                            : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 100%)',
                        border: monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0
                            ? '1px solid rgba(16,185,129,0.2)'
                            : '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '0.75rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Target size={20} color={monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0 ? 'var(--success)' : 'var(--danger)'} />
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                Balance proyectado a fin de año
                            </span>
                        </div>
                        <div style={{
                            fontSize: '1.6rem', fontWeight: '800',
                            color: monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}>
                            {monthlyProjections[monthlyProjections.length - 1].cumulativeBalance >= 0 ? '+' : ''}
                            {fmt(monthlyProjections[monthlyProjections.length - 1].cumulativeBalance)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Balance;
