import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingDown, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, BarChart2, PieChart as PieChartIcon, Activity } from 'lucide-react';

function Reportes({ expenses, debts, loading }) {
    // Colors
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

    // Process Data for Charts
    const { categoryData, monthlyData, summaryStats } = useMemo(() => {
        if (!expenses || expenses.length === 0) return {
            categoryData: [],
            monthlyData: [],
            summaryStats: { avgMonthly: 0, currentMonth: 0, trend: 0 }
        };

        // 1. Category Distribution
        const catMap = {};
        expenses.forEach(exp => {
            const cat = exp.category.charAt(0).toUpperCase() + exp.category.slice(1);
            catMap[cat] = (catMap[cat] || 0) + exp.amount;
        });
        const categoryData = Object.keys(catMap).map((name, index) => ({
            name,
            value: catMap[name],
            color: COLORS[index % COLORS.length]
        }));

        // 2. Monthly Evolution
        const monthMap = {};
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = date.toLocaleString('default', { month: 'short' }); // e.g., "Jan"
            // Simple sorting hack: use 'YYYY-MM' for sorting key
            const sortKey = exp.date.substring(0, 7);

            if (!monthMap[sortKey]) {
                monthMap[sortKey] = {
                    name: monthKey,
                    rawDate: sortKey,
                    spending: 0,
                    debt: 0
                };
            }
            monthMap[sortKey].spending += exp.amount;
        });

        // Add Debts to monthly data (based on their date)
        debts.forEach(debt => {
            const sortKey = debt.date.substring(0, 7);
            const date = new Date(debt.date);
            const monthKey = date.toLocaleString('default', { month: 'short' });

            if (!monthMap[sortKey]) {
                monthMap[sortKey] = {
                    name: monthKey,
                    rawDate: sortKey,
                    spending: 0,
                    debt: 0
                };
            }
            monthMap[sortKey].debt += debt.amount;
        });

        const monthlyData = Object.values(monthMap)
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
            .slice(-6); // Last 6 months

        // 3. Summary Stats
        const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
        const avgMonthly = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;

        // Calculate Trend (This month vs Last month)
        const currentMonthKey = new Date().toISOString().substring(0, 7);
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonthKey = lastMonthDate.toISOString().substring(0, 7);

        const currentMonth = Number(monthMap[currentMonthKey]?.spending) || 0;
        const lastMonth = Number(monthMap[lastMonthKey]?.spending) || 0;

        let trend = 0;
        if (lastMonth > 0) {
            trend = ((currentMonth - lastMonth) / lastMonth) * 100;
        } else if (currentMonth > 0) {
            trend = 100;
        }

        return {
            categoryData,
            monthlyData,
            summaryStats: {
                avgMonthly,
                trend: isFinite(trend) ? trend : 0,
                currentMonth
            }
        };

    }, [expenses, debts]);

    if (loading) return <p>Cargando reportes...</p>;

    return (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-header">
                <h2>Analisis Financiero</h2>
                <p style={{ color: 'var(--text-dim)' }}>Resumen detallado de tus finanzas</p>
            </div>

            {/* KPI Cards Grid */}
            <section className="stats-grid">
                <div className="glass-card stat-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="label">Promedio Mensual</p>
                            <p className="value">${(summaryStats.avgMonthly || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <Calendar size={20} color="#6366f1" />
                        </div>
                    </div>
                </div>

                <div className="glass-card stat-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="label">Gasto Este Mes</p>
                            <p className="value">${(summaryStats.currentMonth || 0).toLocaleString('es-AR')}</p>
                        </div>
                        <div className="icon-box" style={{ background: 'rgba(244, 63, 94, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <TrendingDown size={20} color="#f43f5e" />
                        </div>
                    </div>
                </div>

                <div className="glass-card stat-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="label">Tendencia Mensual</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <span className={`value ${summaryStats.trend > 0 ? 'danger' : 'success'}`} style={{ fontSize: '1.5rem' }}>
                                    {Math.abs(summaryStats.trend || 0).toFixed(1)}%
                                </span>
                                {summaryStats.trend > 0 ? (
                                    <ArrowUpRight size={20} color="var(--danger)" />
                                ) : (
                                    <ArrowDownRight size={20} color="var(--success)" />
                                )}
                            </div>
                        </div>
                        <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <DollarSign size={20} color="#10b981" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Chart Section */}
            <div className="glass-card" style={{ height: '400px' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Evolución de Gastos</h3>
                {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="var(--text-dim)" />
                            <YAxis stroke="var(--text-dim)" />
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="spending" name="Gastos" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpending)" />
                            <Area type="monotone" dataKey="debt" name="Deudas" stroke="#ec4899" fillOpacity={1} fill="url(#colorDebt)" />
                            <Legend />
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
                    <h3 style={{ marginBottom: '1rem' }}>Distribución por Categoría</h3>
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
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                            <PieChartIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No hay gastos por categoría</p>
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Comparativa Mensual</h3>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-dim)" />
                                <YAxis stroke="var(--text-dim)" />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="spending" name="Gastos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="debt" name="Deudas" fill="#ec4899" radius={[4, 4, 0, 0]} />
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
