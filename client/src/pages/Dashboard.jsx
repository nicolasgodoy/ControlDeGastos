import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Check, Wallet, TrendingDown, Clock, CalendarClock, ShoppingCart, Zap, Home, Film, Heart, BookOpen, Utensils, Landmark, Smartphone, CreditCard, Building, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS, ENTITY_COLORS } from '../constants/colors';
import AnimatedNumber from '../components/AnimatedNumber';

// --- Icon Mapping Wrapper to match User's "getCategoryById" logic ---
const getCategoryIcon = (cat) => {
    const map = {
        'comida': Utensils,
        'transporte': Zap, // Placeholder
        'hogar': Home,
        'entretenimiento': Film,
        'salud': Heart,
        'compras': ShoppingCart,
        'educacion': BookOpen,
        'otros': Wallet,
        'supermercado': ShoppingCart,
        'gym': Heart
    };
    return map[cat.toLowerCase()] || Wallet;
};

// --- Entity Icon Helper ---
const getEntityIcon = (entityName, category) => {
    const name = entityName.toLowerCase();

    // Banks
    if (name.includes('santander') || name.includes('galicia') || name.includes('bbva') || name.includes('banco') || name.includes('hipotecario')) {
        return Landmark;
    }

    // Wallets / Fintech
    if (name.includes('mercado') || name.includes('mp') || name.includes('uala') || name.includes('lemon') || name.includes('billetera')) {
        return Smartphone;
    }

    // Cards
    if (name.includes('visa') || name.includes('master') || name.includes('amex') || name.includes('tarjeta')) {
        return CreditCard;
    }

    // Services/Other fallback based on category
    if (category === 'hogar' || category === 'servicios') return Home;

    return Building; // Generic default
};

// --- Colors imported from ../constants/colors ---

function Dashboard({ debts, expenses, loading, error, onToggleStatus }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Month selector ---
    const todayISO = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(todayISO);

    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        monthOptions.push({
            value: d.toISOString().slice(0, 7),
            label: d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
        });
    }
    const selectedMonthLabel = monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth;

    // Filter expenses to selected month
    const currentMonthExpenses = expenses
        ? expenses.filter(exp => exp.date?.startsWith(selectedMonth))
        : [];

    const totalDebt = debts.reduce((acc, debt) => acc + debt.amount, 0);
    const pendingAmount = debts.filter(d => d.status === 'pending').reduce((a, b) => a + b.amount, 0);
    const paidAmount = debts.filter(d => d.status === 'paid').reduce((a, b) => a + b.amount, 0);
    const totalExpenses = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const pendingDebts = debts
        .filter(d => d.status === 'pending')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Data for Horizontal Bar Chart (selected month only)
    const categoryDataMap = {};
    currentMonthExpenses.forEach(exp => {
        const catKey = exp.category.toLowerCase();
        categoryDataMap[catKey] = (categoryDataMap[catKey] || 0) + exp.amount;
    });
    const categoryData = Object.keys(categoryDataMap).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: categoryDataMap[key],
        category: key
    })).sort((a, b) => b.value - a.value);

    // Data for Donut Chart
    const entityData = debts.reduce((acc, debt) => {
        const existing = acc.find(item => item.name === debt.entity);
        if (existing) {
            existing.value += debt.amount;
        } else {
            acc.push({ name: debt.entity, value: debt.amount });
        }
        return acc;
    }, []);

    // Helper for badges
    const getDaysRemaining = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Parse YYYY-MM-DD as local date to avoid UTC shift (e.g. GMT-3 showing day before)
        const [y, m, d] = dateString.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        target.setHours(0, 0, 0, 0);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getDaysBadge = (diffDays) => {
        if (diffDays < 0) return { text: 'Vencido', class: 'urgent' };
        if (diffDays === 0) return { text: 'Hoy', class: 'urgent' };
        if (diffDays === 1) return { text: 'Mañana', class: 'urgent' };
        if (diffDays <= 3) return { text: `${diffDays} días`, class: 'urgent-soft' };
        if (diffDays <= 5) return { text: `${diffDays} días`, class: 'warning' };
        if (diffDays <= 10) return { text: `${diffDays} días`, class: 'attention' };
        if (diffDays <= 20) return { text: `${diffDays} días`, class: 'normal' };
        return { text: `${diffDays} días`, class: 'safe' };
    };

    return (
        <>
            {error && (
                <div className="glass-card error-alert">
                    <AlertCircle color="var(--danger)" />
                    <span>Error cargando datos: {error}</span>
                </div>
            )}

            {/* Month selector bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--card-bg)',
                borderRadius: '1rem',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-sm)',
                width: 'fit-content'
            }}>
                <Calendar size={16} color="var(--text-dim)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Viendo:</span>
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '0.6rem',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: '600'
                    }}
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ background: 'var(--card-bg)', textTransform: 'capitalize' }}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <section className="dashboard-grid">
                {/* Metric Cards */}
                <div className="top-cards">
                    {/* Expense Card */}
                    <div className="metric-card expense">
                        <div className="metric-content">
                            <div className="metric-info">
                                <h4>Total Gastos</h4>
                                <p className="value">
                                    <AnimatedNumber value={totalExpenses} prefix="$" />
                                </p>
                                <p className="subtitle">Este mes</p>
                            </div>
                            <div className="icon-box">
                                <Wallet size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Paid Debts Card */}
                    <div className="metric-card paid">
                        <div className="metric-content">
                            <div className="metric-info">
                                <h4>Deudas Pagadas</h4>
                                <p className="value">
                                    <AnimatedNumber value={paidAmount} prefix="$" />
                                </p>
                                <p className="subtitle">Total amortizado</p>
                            </div>
                            <div className="icon-box">
                                <Check size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Debt Card */}
                    <div className="metric-card debt">
                        <div className="metric-content">
                            <div className="metric-info">
                                <h4>Total Deudas</h4>
                                <p className="value">
                                    <AnimatedNumber value={totalDebt} prefix="$" />
                                </p>
                                <p className="subtitle">Global (Pagado + Pendiente)</p>
                            </div>
                            <div className="icon-box">
                                <TrendingDown size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Pending Card */}
                    <div className="metric-card pending">
                        <div className="metric-content">
                            <div className="metric-info">
                                <h4>Por Pagar</h4>
                                <p className="value">
                                    <AnimatedNumber value={pendingAmount} prefix="$" />
                                </p>
                                <p className="subtitle">Próximos vencimientos</p>
                            </div>
                            <div className="icon-box">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="charts-row" style={{ minWidth: 0 }}>
                    {/* Category Chart (Adapted) */}
                    <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div className="chart-header" style={{ flexShrink: 0 }}>
                            <h3>Gastos Personales del dia a dia</h3>
                        </div>
                        <div style={{ height: '250px', width: '100%', flexGrow: 1, position: 'relative', minHeight: 0 }}>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={categoryData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                    >
                                        <XAxis
                                            type="number"
                                            tickFormatter={(value) => `$${value}`}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "var(--text-dim)", fontSize: 12 }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "var(--text-main)", fontSize: 12 }}
                                            width={70}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`$${value.toLocaleString('es-AR')}`, "Gasto"]}
                                            contentStyle={{
                                                backgroundColor: "var(--card-bg)",
                                                border: "1px solid var(--glass-border)",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                color: "var(--text-main)"
                                            }}
                                            itemStyle={{ color: "var(--text-main)" }}
                                            labelStyle={{ color: "var(--text-main)", fontWeight: 'bold' }}
                                            cursor={{ fill: 'var(--bg-subtle)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32} animationDuration={1000}>
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.default}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                                    <Wallet size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No hay gastos registrados</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Entity Donut Chart (Adapted) */}
                    <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div className="chart-header" style={{ flexShrink: 0 }}>
                            <h3>Gastos Fijos (Prestamos, Servicios, Tarjetas, etc.)</h3>
                        </div>
                        <div style={{ height: '250px', width: '100%', flexGrow: 1, position: 'relative', minHeight: 0 }}>
                            {entityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={entityData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            animationDuration={1000}
                                        >
                                            {entityData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={ENTITY_COLORS[index % ENTITY_COLORS.length]}
                                                    stroke="transparent"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`$${value.toLocaleString('es-AR')}`, "Gasto"]}
                                            contentStyle={{
                                                backgroundColor: "var(--card-bg)",
                                                border: "1px solid var(--glass-border)",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                            }}
                                            itemStyle={{ color: "var(--text-main)" }}
                                        />
                                        <Legend
                                            layout={isMobile ? "horizontal" : "vertical"}
                                            align={isMobile ? "center" : "right"}
                                            verticalAlign={isMobile ? "bottom" : "middle"}
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => (
                                                <span style={{ color: "var(--text-main)", fontSize: isMobile ? "11px" : "12px", marginRight: isMobile ? '10px' : '0' }}>
                                                    {value}
                                                </span>
                                            )}
                                            wrapperStyle={isMobile ? { paddingTop: '15px' } : { paddingLeft: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                                    <TrendingDown size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No hay deudas registradas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Payments (Adapted) */}
                <div className="payments-card">
                    <div className="chart-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarClock className="h-5 w-5 text-primary" size={20} color="var(--primary)" />
                            Próximos Vencimientos
                        </h3>
                    </div>
                    <div className="payments-list">
                        {loading ? <p>Cargando...</p> : pendingDebts.length === 0 ? (
                            <p className="no-data">No hay deudas pendientes</p>
                        ) : pendingDebts.map(debt => {
                            const days = getDaysRemaining(debt.date);
                            const badge = getDaysBadge(days);

                            // Use Entity Icon logic preferentially
                            const Icon = getEntityIcon(debt.entity, debt.category);

                            // Color logic for icon bg (simplified)
                            const iconColor = CATEGORY_COLORS[debt.category?.toLowerCase()] || CATEGORY_COLORS.default;

                            return (
                                <div key={debt.id} className="payment-item">
                                    <div className="payment-left">
                                        <div className="category-icon" style={{ backgroundColor: iconColor }}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="payment-details">
                                            <p className="title">{debt.entity}</p>
                                            <p className="date">
                                                {debt.date
                                                    ? (() => {
                                                        const [y, m, d] = debt.date.split('-').map(Number);
                                                        return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                                    })()
                                                    : '-'} - {debt.loanName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="payment-right">
                                        <span className="payment-amount">
                                            ${debt.amount.toLocaleString('es-AR')}
                                        </span>
                                        <div className={`status-badge ${badge.class}`}>
                                            {badge.text.includes(' ') ? (
                                                <>
                                                    <span className="badge-val">{badge.text.split(' ')[0]}</span>
                                                    <span className="badge-lbl">DÍAS</span>
                                                </>
                                            ) : (
                                                <span className="badge-val" style={{ fontSize: '0.7rem' }}>{badge.text}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}

export default Dashboard;
