import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingDown, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, BarChart2, PieChart as PieChartIcon, Activity, Filter } from 'lucide-react';
import { CATEGORY_COLORS, getCategoryColor } from '../constants/colors';

function Reportes({ expenses, debts, loading }) {
    // State for filtering
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Available periods for the filter
    const availablePeriods = useMemo(() => {
        const periods = new Set();
        [...(expenses || []), ...(debts || [])].forEach(item => {
            if (item.date) {
                periods.add(item.date.substring(0, 7));
            }
        });

        // Ensure current month is always an option even if no data
        const now = new Date();
        periods.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

        return Array.from(periods).sort().reverse();
    }, [expenses, debts]);

    // Process Data based on selectedPeriod
    const { categoryData, monthlyData, filteredStats, currentMonthData } = useMemo(() => {
        const defaultData = {
            categoryData: [],
            monthlyData: [],
            currentMonthData: { spending: 0, debt: 0 },
            filteredStats: { avgMonthly: 0, trend: 0, currentMonth: 0 }
        };

        // If both are empty, return default
        if ((!expenses || expenses.length === 0) && (!debts || debts.length === 0)) return defaultData;

        // 1. Total Monthly Evolution (Center around selectedPeriod)
        const monthMap = {};
        [...(expenses || []), ...(debts || [])].forEach(item => {
            if (!item.date) return;
            const sortKey = item.date.substring(0, 7);
            const date = new Date(item.date);
            const monthName = date.toLocaleString('es-ES', { month: 'short' });

            if (!monthMap[sortKey]) {
                monthMap[sortKey] = { name: monthName, rawDate: sortKey, spending: 0, debt: 0 };
            }

            // Robust check: Expenses have category AND NO entity. Debts have entity.
            const isExpense = 'category' in item && !('entity' in item);

            if (isExpense) {
                monthMap[sortKey].spending += Number(item.amount) || 0;
            } else if ('entity' in item) {
                monthMap[sortKey].debt += Number(item.amount) || 0;
            }
        });

        const sortedMonths = Object.keys(monthMap).sort();
        const selectedIdx = sortedMonths.indexOf(selectedPeriod);

        let displayMonths = [];
        if (selectedIdx !== -1) {
            // Show 4 months before and up to 2 months after selected for context
            displayMonths = sortedMonths.slice(Math.max(0, selectedIdx - 4), selectedIdx + 2);
        } else {
            // Fallback to months around today
            const todayKey = new Date().toISOString().substring(0, 7);
            const todayIdx = sortedMonths.findIndex(k => k >= todayKey);
            const start = todayIdx !== -1 ? Math.max(0, todayIdx - 3) : Math.max(0, sortedMonths.length - 6);
            displayMonths = sortedMonths.slice(start, start + 6);
        }

        const monthlyData = displayMonths.map(key => monthMap[key]);

        // 2. Filtered Data for selectedPeriod
        const filteredExpenses = (expenses || []).filter(exp => exp.date.startsWith(selectedPeriod));
        const filteredDebts = (debts || []).filter(debt => debt.date.startsWith(selectedPeriod));

        // Category Distribution for selectedPeriod
        const catMap = {};
        filteredExpenses.forEach(exp => {
            const cat = exp.category.toLowerCase();
            catMap[cat] = (catMap[cat] || 0) + exp.amount;
        });

        const categoryData = Object.keys(catMap).map(catName => ({
            name: catName.charAt(0).toUpperCase() + catName.slice(1),
            value: catMap[catName],
            color: getCategoryColor(catName)
        }));

        // Summary Stats for selectedPeriod
        const totalSpentAllTime = (expenses || []).reduce((sum, item) => sum + item.amount, 0);
        const distinctMonths = new Set((expenses || []).map(e => e.date.substring(0, 7))).size || 1;
        const avgMonthly = totalSpentAllTime / distinctMonths;

        const currentMonthSpending = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
        const currentMonthDebt = filteredDebts.reduce((sum, item) => sum + item.amount, 0);

        // Calculate Trend (selected vs previous)
        const [year, month] = selectedPeriod.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1);
        const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        const prevMonthSpending = monthMap[prevPeriod]?.spending || 0;

        let trend = 0;
        if (prevMonthSpending > 0) {
            trend = ((currentMonthSpending - prevMonthSpending) / prevMonthSpending) * 100;
        } else if (currentMonthSpending > 0) {
            trend = 100;
        }

        return {
            categoryData,
            monthlyData,
            currentMonthData: { spending: currentMonthSpending, debt: currentMonthDebt },
            filteredStats: {
                avgMonthly,
                trend: isFinite(trend) ? trend : 0,
                currentMonth: currentMonthSpending
            }
        };

    }, [expenses, debts, selectedPeriod]);

    if (loading) return <p>Cargando reportes...</p>;

    return (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2>Analisis Financiero</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Resumen detallado de tus finanzas</p>
                </div>

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                    <Filter size={18} color="var(--text-dim)" />
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                    >
                        {availablePeriods.map(p => {
                            const [y, m] = p.split('-');
                            const d = new Date(y, m - 1);
                            return (
                                <option key={p} value={p}>
                                    {d.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <section className="stats-grid">
                <div className="glass-card stat-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="label">Promedio de Gastos</p>
                            <p className="value">${(filteredStats.avgMonthly || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                            <p className="subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Histórico mensual</p>
                        </div>
                        <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <Calendar size={20} color="#6366f1" />
                        </div>
                    </div>
                </div>

                <div className="glass-card stat-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="label">Gasto del Periodo</p>
                            <p className="value">${(filteredStats.currentMonth || 0).toLocaleString('es-AR')}</p>
                            <p className="subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Seleccionado</p>
                        </div>
                        <div className="icon-box" style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <TrendingDown size={20} color="#38bdf8" />
                        </div>
                    </div>
                </div>

                <div className="glass-card stat-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="label">vs. Mes Anterior</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <span className={`value ${filteredStats.trend > 0 ? 'danger' : 'success'}`} style={{ fontSize: '1.5rem' }}>
                                    {Math.abs(filteredStats.trend || 0).toFixed(1)}%
                                </span>
                                {filteredStats.trend > 0 ? (
                                    <ArrowUpRight size={20} color="var(--danger)" />
                                ) : (
                                    <ArrowDownRight size={20} color="var(--success)" />
                                )}
                            </div>
                        </div>
                        <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <Activity size={20} color="#10b981" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Chart Section */}
            <div className="glass-card" style={{ height: '400px' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Evolución de Gastos vs Deudas</h3>
                {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                            <YAxis stroke="var(--text-dim)" fontSize={12} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--text-main)' }}
                            />
                            <Area type="monotone" dataKey="spending" name="Gastos" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSpending)" />
                            <Area type="monotone" dataKey="debt" name="Deudas" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorDebt)" />
                            <Legend verticalAlign="top" height={36} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                        <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No hay movimientos registrados</p>
                    </div>
                )}
            </div>

            {/* Secondary Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Gastos por Categoría</h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationDuration={1000}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(val) => [`$${val.toLocaleString()}`, "Monto"]}
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                            <PieChartIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No hay gastos para este periodo</p>
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Comparativa Mensual</h3>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                                <YAxis stroke="var(--text-dim)" fontSize={12} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(128,128,128,0.05)' }}
                                    formatter={(val) => [`$${val.toLocaleString()}`, "Monto"]}
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar dataKey="spending" name="Gastos" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="debt" name="Deudas" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                            <BarChart2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Insuficientes datos mensuales</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Reportes;
