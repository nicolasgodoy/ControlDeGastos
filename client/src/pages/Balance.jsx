import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Calendar } from 'lucide-react';
import { useIncome } from '../hooks/useIncome';
import { useDebts } from '../hooks/useDebts';
import { useExpenses } from '../hooks/useExpenses';

const Balance = () => {
    const { incomes } = useIncome();
    const { debts } = useDebts();
    const { expenses } = useExpenses();

    // Get current month for filtering
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthName = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // Calculate totals
    const monthlyIncomes = incomes.filter(income => income.date?.startsWith(currentMonth));
    const totalIncome = monthlyIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

    const monthlyExpenses = expenses.filter(exp => exp.date?.startsWith(currentMonth));
    const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    // Monthly debts: All due THIS MONTH (paid/pending) + Overdue Pending ones
    const monthlyDebts = debts.filter(d => {
        const isThisMonth = d.date?.startsWith(currentMonth);
        const isOverduePending = d.status === 'pending' && d.date < currentMonth;
        return isThisMonth || isOverduePending;
    });
    const totalDebts = monthlyDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

    const paidMonthlyDebts = monthlyDebts.filter(d => d.status === 'paid');
    const pendingMonthlyDebts = monthlyDebts.filter(d => d.status === 'pending');

    // Also track ALL pending debts for reference
    const allPendingDebts = debts.filter(d => d.status === 'pending');
    const totalAllPendingDebts = allPendingDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

    // Calculate interest paid (for debts with interest data)
    const totalInterestPaid = monthlyDebts.reduce((sum, debt) => {
        if (debt.monthlyPayment && debt.amount) {
            // Interest = monthly payment - (total amount / installments)
            const capitalPortion = debt.amount / (debt.installments_total || 1);
            const interestPortion = debt.monthlyPayment - capitalPortion;
            return sum + Math.max(0, interestPortion);
        }
        return sum;
    }, 0);

    // Calculate balance (ONLY with debts due this month)
    const balance = totalIncome - totalDebts - totalExpenses;
    const balancePercentage = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    const committedPercentage = 100 - balancePercentage;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="section">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                    Balance de {currentMonthName}
                </h2>
                <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                    Resumen completo de tu situación financiera del mes
                </p>
            </div>

            {/* Main Balance Card */}
            <div className="glass-card" style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: balance >= 0 ?
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' :
                    'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: balance >= 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                        Balance Disponible
                    </p>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        margin: 0,
                        color: balance >= 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                        {formatCurrency(balance)}
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        {balance >= 0 ? '🎉 Superávit' : '⚠️ Déficit'}
                    </p>
                </div>

                {/* Financial Formula */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '12px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <TrendingUp size={20} color="var(--success)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>INGRESOS</span>
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', margin: 0 }}>
                            {formatCurrency(totalIncome)}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-dim)' }}>
                        −
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <CreditCard size={20} color="var(--warning)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>DEUDAS</span>
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', margin: 0 }}>
                            {formatCurrency(totalDebts)}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-dim)' }}>
                        −
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Wallet size={20} color="var(--primary)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>GASTOS</span>
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                            {formatCurrency(totalExpenses)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                {totalIncome > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                Ingresos comprometidos
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                {committedPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <div style={{ height: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(committedPercentage, 100)}%`,
                                background: balancePercentage > 30 ?
                                    'linear-gradient(90deg, var(--success), var(--success))' :
                                    balancePercentage > 10 ?
                                        'linear-gradient(90deg, var(--warning), var(--warning))' :
                                        'linear-gradient(90deg, var(--danger), var(--danger))',
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
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '1rem' }}>
                        {formatCurrency(totalDebts)}
                    </p>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                        <p style={{ margin: '0.5rem 0' }}>
                            <strong>{monthlyDebts.length}</strong> compromisos para este periodo
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span>Pagadas ({paidMonthlyDebts.length}):</span>
                            <span>{formatCurrency(paidMonthlyDebts.reduce((s, d) => s + d.amount, 0))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                            <span>Pendientes ({pendingMonthlyDebts.length}):</span>
                            <span>{formatCurrency(pendingMonthlyDebts.reduce((s, d) => s + d.amount, 0))}</span>
                        </div>

                        {totalInterestPaid > 0 && (
                            <div style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px' }}>
                                <span>Intereses pagados: </span>
                                <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                                    {formatCurrency(totalInterestPaid)}
                                </span>
                            </div>
                        )}
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
