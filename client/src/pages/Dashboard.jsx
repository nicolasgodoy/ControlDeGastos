import React from 'react';
import { AlertCircle, Check, Wallet, TrendingDown, Clock, CalendarClock, ShoppingCart, Zap, Home, Film, Heart, BookOpen, Utensils, Landmark, Smartphone, CreditCard, Building } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

// --- Colors from User Snippet ---
const categoryColors = {
    food: "#f59e0b", // Amber
    transport: "#0ea5e9", // Sky
    home: "#22c55e", // Green
    entertainment: "#a855f7", // Purple
    health: "#ef4444", // Red
    shopping: "#ec4899", // Pink
    education: "#8b5cf6", // Violet
    other: "#71717a", // Zinc

    // Specific Mappings with DISTINCT colors
    'comida': "#f59e0b",      // Amber (Orange)
    'supermercado': "#ec4899", // Pink
    'kiosko': "#8b5cf6",      // Violet
    'transporte': "#0ea5e9",  // Sky Blue
    'hogar': "#22c55e",       // Green
    'servicios': "#10b981",   // Emerald
    'entretenimiento': "#a855f7", // Purple
    'salud': "#ef4444",       // Red
    'farmacia': "#f43f5e",    // Rose
    'compras': "#db2777",     // Pink-700
    'ropa': "#d946ef",        // Fuchsia
    'educacion': "#6366f1",   // Indigo
    'cursos': "#4f46e5",      // Indigo-600
    'otros': "#64748b",       // Slate-500
    'varios': "#94a3b8",      // Slate-400
    'juntadas': "#f97316",    // Orange
    'gym': "#ef4444",         // Red
    'deporte': "#ef4444",     // Red
    'suplementos': "#f43f5e", // Rose
    'regalos': "#f472b6",     // Pink-400
    'taxis': "#0284c7"        // Sky-600
};

const ENTITY_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#22c55e"];

function Dashboard({ debts, expenses, loading, error, onToggleStatus }) {
    const totalDebt = debts.reduce((acc, debt) => acc + debt.amount, 0);
    const pendingAmount = debts.filter(d => d.status === 'pending').reduce((a, b) => a + b.amount, 0);
    const paidAmount = debts.filter(d => d.status === 'paid').reduce((a, b) => a + b.amount, 0);
    const totalExpenses = expenses ? expenses.reduce((acc, curr) => acc + curr.amount, 0) : 0;

    const pendingDebts = debts
        .filter(d => d.status === 'pending')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Data for Horizontal Bar Chart
    const categoryDataMap = {};
    if (expenses) {
        expenses.forEach(exp => {
            const catKey = exp.category.toLowerCase();
            categoryDataMap[catKey] = (categoryDataMap[catKey] || 0) + exp.amount;
        });
    }
    const categoryData = Object.keys(categoryDataMap).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: categoryDataMap[key],
        category: key // for color mapping
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
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getDaysBadge = (diffDays) => {
        if (diffDays < 0) return { text: 'A Pagar', class: 'urgent' };
        if (diffDays === 0) return { text: 'Hoy', class: 'warning' };
        if (diffDays === 1) return { text: 'Mañana', class: 'warning' };
        return { text: `${diffDays} días`, class: 'normal' };
    };

    return (
        <>
            {error && (
                <div className="glass-card error-alert">
                    <AlertCircle color="var(--danger)" />
                    <span>Error cargando datos: {error}</span>
                </div>
            )}

            <section className="dashboard-grid">
                {/* Metric Cards */}
                <div className="top-cards">
                    {/* Expense Card */}
                    <div className="metric-card expense">
                        <div className="metric-content">
                            <div className="metric-info">
                                <h4>Total Gastos</h4>
                                <p className="value">${totalExpenses.toLocaleString('es-AR')}</p>
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
                                <p className="value">${paidAmount.toLocaleString('es-AR')}</p>
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
                                <p className="value">${totalDebt.toLocaleString('es-AR')}</p>
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
                                <p className="value">${pendingAmount.toLocaleString('es-AR')}</p>
                                <p className="subtitle">Próximos vencimientos</p>
                            </div>
                            <div className="icon-box">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="charts-row">
                    {/* Category Chart (Adapted) */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Gastos Personales del dia a dia</h3>
                        </div>
                        <div style={{ height: '250px', width: '100%' }}>
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
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32} animationDuration={1000}>
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={categoryColors[entry.category] || categoryColors.other}
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
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Gastos Fijos (Prestamos, Servicios, Tarjetas, etc.)</h3>
                        </div>
                        <div style={{ height: '250px', width: '100%' }}>
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
                                            layout="vertical"
                                            align="right"
                                            verticalAlign="middle"
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => (
                                                <span style={{ color: "var(--text-main)", fontSize: "12px" }}>
                                                    {value}
                                                </span>
                                            )}
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
                            const iconColor = categoryColors[debt.category?.toLowerCase()] || categoryColors.other;

                            return (
                                <div key={debt.id} className="payment-item">
                                    <div className="payment-left">
                                        <div className="category-icon" style={{ backgroundColor: iconColor }}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="payment-details">
                                            <p className="title">{debt.entity}</p>
                                            <p className="date">
                                                {new Date(debt.date).toLocaleDateString("es-ES", {
                                                    day: "numeric",
                                                    month: "short",
                                                })} - {debt.loanName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="payment-right">
                                        <span className="payment-amount">
                                            ${debt.amount.toLocaleString('es-AR')}
                                        </span>
                                        <div className={`status-badge ${badge.class}`}>
                                            {badge.text}
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
