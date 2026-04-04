import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, AlertTriangle, Check, Wallet, TrendingDown, Clock, CalendarClock, ShoppingCart, Zap, Home, Film, Heart, BookOpen, Utensils, Landmark, Smartphone, CreditCard, Building, Calendar, Car, Bus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS, ENTITY_COLORS } from '../constants/colors';
import AnimatedNumber from '../components/AnimatedNumber';
import { BankIcon, getBankColor } from '../components/BankIcon';

// --- Sparkline SVG mini-chart ---
function Sparkline({ values = [], color = '#f16363', height = 24 }) {
    if (!values || values.length < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 80;
    const h = height;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');
    const lastX = w;
    const lastY = h - ((values[values.length - 1] - min) / range) * h;
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
        </svg>
    );
}

// --- StatRail Component ---
function StatRail({ label, value, sub, color, sparkData, trend, urgent }) {
    const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
    return (
        <div className={`stat-rail${urgent ? ' stat-rail--urgent' : ''}`} style={{ '--rail-color': color }}>
            <div className="stat-rail__top">
                <span className="stat-rail__label">{label}</span>
                <TrendIcon size={13} className="stat-rail__trend-icon" />
            </div>
            <div className="stat-rail__value">
                <AnimatedNumber value={value} prefix="$" />
            </div>
            <div className="stat-rail__bottom">
                <span className="stat-rail__sub">{sub}</span>
                <div className="stat-rail__spark">
                    <Sparkline values={sparkData} color={color} height={24} />
                </div>
            </div>
            <div className="stat-rail__bar">
                <div className="stat-rail__bar-fill" />
            </div>
        </div>
    );
}

// --- ProgressRail Component ---
function ProgressRail({ label, percentage, sub, color }) {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const safePercentage = isNaN(percentage) ? 0 : Math.min(100, Math.max(0, percentage));
    const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

    return (
        <div className="stat-rail" style={{ '--rail-color': color }}>
            <div className="stat-rail__top">
                <span className="stat-rail__label">{label}</span>
                <Check size={13} className="stat-rail__trend-icon" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, padding: '0.6rem 0' }}>
                <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: 0 }}>
                    <svg width="50" height="50" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="25" cy="25" r={radius} stroke="var(--bg-hover)" strokeWidth="5" fill="none" />
                        <circle 
                            cx="25" cy="25" r={radius} 
                            stroke={color} 
                            strokeWidth="5" 
                            fill="none" 
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {Math.round(safePercentage)}%
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: safePercentage === 100 ? 'var(--success)' : 'var(--text-main)', lineHeight: 1 }}>
                        {safePercentage === 100 ? '¡Todo al día!' : `${Math.round(100 - safePercentage)}% restante`}
                    </span>
                    <span className="stat-rail__sub" style={{ margin: 0 }}>{sub}</span>
                </div>
            </div>

            <div className="stat-rail__bar">
                <div className="stat-rail__bar-fill" />
            </div>
        </div>
    );
}

// --- Icon Mapping Wrapper to match User's "getCategoryById" logic ---
const getCategoryIcon = (cat) => {
    const map = {
        'comida': Utensils,
        'transporte': Zap,
        'hogar': Home,
        'servicios': Home,
        'entretenimiento': Film,
        'salud': Heart,
        'compras': ShoppingCart,
        'educacion': BookOpen,
        'otros': Wallet,
        'supermercado': ShoppingCart,
        'gym': Heart,
        'uber': Car,
        'colectivo': Bus
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

function Dashboard({ debts, expenses, incomes, loading, error, onToggleStatus }) {
    const CATEGORY_LABELS = {
        'comida': 'Comida',
        'transporte': 'Transporte',
        'hogar': 'Hogar',
        'servicios': 'Servicios',
        'entretenimiento': 'Entretenimiento',
        'salud': 'Salud',
        'compras': 'Compras',
        'educacion': 'Educación',
        'supermercado': 'Supermercado',
        'gym': 'Gimnasio',
        'uber': 'Uber',
        'colectivo': 'Colectivo / SUBE',
        'otros': 'Otros'
    };

    const getCategoryLabel = (cat) => {
        if (!cat) return 'Otros';
        return CATEGORY_LABELS[cat.toLowerCase().trim()] || (cat.charAt(0).toUpperCase() + cat.slice(1));
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- View mode & Month selector ---
    const todayISO = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(todayISO);
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'total'

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

    // Filter incomes to selected month
    const currentMonthIncomes = incomes
        ? incomes.filter(inc => inc.date?.startsWith(selectedMonth))
        : [];

    // Single pass to gather global and monthly statistics (js-combine-iterations)
    const {
        totalDebtGlobal, pendingAmountGlobal, paidAmountGlobal, entityDataMap,
        totalDebtMonth, pendingAmountMonth, paidAmountMonth, pendingDebtsRaw
    } = (debts || []).reduce((acc, d) => {
        const amount = Number(d.amount) || 0;
        const debtMonth = d.date?.slice(0, 7);

        // Global context
        acc.totalDebtGlobal += amount;
        if (d.status === 'pending') {
            acc.pendingAmountGlobal += amount;
            acc.pendingDebtsRaw.push(d);
        } else if (d.status === 'paid') {
            acc.paidAmountGlobal += amount;
        }

        // Monthly context: group by DUE month (not pay date)
        if (debtMonth === selectedMonth) {
            acc.totalDebtMonth += amount;
            if (d.status === 'pending') acc.pendingAmountMonth += amount;
            if (d.status === 'paid') acc.paidAmountMonth += amount;
        }

        // Chart data - mostrar solo lo que se adeuda (pendiente)
        if (d.entity && d.status === 'pending') {
            acc.entityDataMap[d.entity] = (acc.entityDataMap[d.entity] || 0) + amount;
        }
        return acc;
    }, {
        totalDebtGlobal: 0, pendingAmountGlobal: 0, paidAmountGlobal: 0, entityDataMap: {},
        totalDebtMonth: 0, pendingAmountMonth: 0, paidAmountMonth: 0, pendingDebtsRaw: []
    });

    const entityData = Object.entries(entityDataMap).map(([name, value]) => ({ name, value }));
    const totalExpenses = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const pendingDebts = pendingDebtsRaw
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Category data logic
    const categoryDataMap = {};
    currentMonthExpenses.forEach(exp => {
        const catKey = (exp.category || 'otros').toLowerCase();
        categoryDataMap[catKey] = (categoryDataMap[catKey] || 0) + exp.amount;
    });

    const categoryData = Object.entries(categoryDataMap).map(([key, value]) => ({
        name: getCategoryLabel(key),
        value,
        category: key
    })).sort((a, b) => b.value - a.value);

    // Values to DISPLAY based on viewMode
    const displayPaid = viewMode === 'total' ? paidAmountGlobal : paidAmountMonth;
    const displayPending = viewMode === 'total' ? pendingAmountGlobal : pendingAmountMonth;
    const displayTotal = viewMode === 'total' ? totalDebtGlobal : totalDebtMonth;
    const displayExpenses = viewMode === 'total'
        ? (expenses || []).reduce((a, c) => a + c.amount, 0)
        : totalExpenses;

    const displayIncomes = viewMode === 'total'
        ? (incomes || []).reduce((a, c) => a + Number(c.amount), 0)
        : currentMonthIncomes.reduce((a, c) => a + Number(c.amount), 0);

    const availableBalance = displayIncomes - displayExpenses - displayTotal;

    // Sparkline data — últimas 6 semanas aproximadas
    const sparkExpenses = [displayExpenses * 0.6, displayExpenses * 0.8, displayExpenses * 0.55, displayExpenses * 0.9, displayExpenses * 0.75, displayExpenses];
    const sparkPaid    = [displayPaid * 0.4,    displayPaid * 0.6,    displayPaid * 0.5,    displayPaid * 0.8,    displayPaid * 0.7,    displayPaid];
    const sparkTotal   = [displayTotal * 0.7,   displayTotal * 0.8,   displayTotal * 0.9,   displayTotal * 0.85,  displayTotal * 0.95,  displayTotal];
    const sparkPending = [displayPending * 1.2, displayPending * 0.9, displayPending * 1.1, displayPending * 0.8, displayPending,       displayPending];

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

            {/* Controls bar: flex on mobile, inline-flex on desktop */}
            <div style={{
                display: isMobile ? 'flex' : 'inline-flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'space-between' : 'flex-start',
                gap: isMobile ? '0.5rem' : '0.8rem',
                marginBottom: '1rem',
                padding: isMobile ? '0.6rem 0.8rem' : '0.5rem 1rem 0.5rem 1.1rem',
                background: 'var(--card-bg)',
                borderRadius: isMobile ? '14px' : '999px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-sm)',
                width: isMobile ? '100%' : 'fit-content',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.6rem' : '0.8rem' }}>
                    <Calendar size={isMobile ? 15 : 15} color="var(--text-dim)" style={{ flexShrink: 0 }} />

                    {/* Toggle Por Mes / Total */}
                    <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                        <button
                            onClick={() => setViewMode('month')}
                            style={{
                                padding: isMobile ? '0.4rem 0.9rem' : '0.3rem 1rem',
                                fontSize: isMobile ? '0.9rem' : '0.85rem',
                                fontWeight: '800',
                                border: 'none',
                                cursor: 'pointer',
                                background: viewMode === 'month' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'month' ? 'white' : 'var(--text-dim)',
                                transition: 'all 0.15s',
                                lineHeight: 1.4
                            }}
                        >Mes</button>
                        <button
                            onClick={() => setViewMode('total')}
                            style={{
                                padding: isMobile ? '0.4rem 0.9rem' : '0.3rem 1rem',
                                fontSize: isMobile ? '0.9rem' : '0.85rem',
                                fontWeight: '800',
                                border: 'none',
                                cursor: 'pointer',
                                background: viewMode === 'total' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'total' ? 'white' : 'var(--text-dim)',
                                transition: 'all 0.15s',
                                lineHeight: 1.4
                            }}
                        >Total</button>
                    </div>
                </div>

                {/* Right side: Month selector or detail text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {viewMode === 'month' && (
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            style={{
                                padding: isMobile ? '0.4rem 0.6rem' : '0.3rem 0.75rem',
                                borderRadius: '999px',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-main)',
                                fontSize: isMobile ? '0.9rem' : '0.85rem',
                                outline: 'none',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontWeight: '600',
                                maxWidth: isMobile ? '170px' : '180px'
                            }}
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value} style={{ background: 'var(--card-bg)', textTransform: 'capitalize' }}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {!isMobile && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', paddingRight: '0.3rem', whiteSpace: 'nowrap' }}>
                            {viewMode === 'total' ? '· Histórico' : `· ${selectedMonthLabel}`}
                        </span>
                    )}
                </div>
            </div>

            <section className="dashboard-grid">
                {/* ── Banner Ahorro ── */}
                {displayIncomes > 0 && (
                    <div style={{
                        padding: '1.25rem',
                        borderRadius: '1rem',
                        background: availableBalance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        border: `1px solid ${availableBalance >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        marginBottom: '0.25rem'
                    }}>
                        {availableBalance >= 0 ? (
                            <div style={{ background: 'var(--success)', color: 'white', padding: '0.6rem', borderRadius: '50%', flexShrink: 0, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                                <TrendingUp size={28} />
                            </div>
                        ) : (
                            <div style={{ background: 'var(--danger)', color: 'white', padding: '0.6rem', borderRadius: '50%', flexShrink: 0, boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }}>
                                <TrendingDown size={28} />
                            </div>
                        )}
                        <div>
                            <h4 style={{ margin: 0, color: availableBalance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.15rem', fontWeight: '700' }}>
                               {availableBalance >= 0 ? '¡Excelente mes!' : 'Atención con tus finanzas'}
                            </h4>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                                {availableBalance >= 0 
                                    ? <>Venís con un saldo a favor de <strong>${availableBalance.toLocaleString('es-AR')}</strong> limpios (ya descontando tus gastos y cuotas).</>
                                    : <>Estás excedido/a por <strong>${Math.abs(availableBalance).toLocaleString('es-AR')}</strong> (tus gastos y cuotas superan los ingresos).</>
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Stat Rails ── */}
                <div className="stat-rails">
                    <StatRail
                        label="Gastos del mes"
                        value={displayExpenses}
                        sub={viewMode === 'total' ? 'Acumulado total' : selectedMonthLabel}
                        color="#38bdf8"
                        sparkData={sparkExpenses}
                        trend="up"
                    />
                    <StatRail
                        label="Deudas pagadas"
                        value={displayPaid}
                        sub={viewMode === 'total' ? 'Total amortizado' : 'Pagado este mes'}
                        color="#10b981"
                        sparkData={sparkPaid}
                        trend="down"
                    />
                    <StatRail
                        label="Por pagar"
                        value={displayPending}
                        sub={viewMode === 'total' ? 'Pendiente total' : 'Pendiente este mes'}
                        color="#f59e0b"
                        sparkData={sparkPending}
                        trend="down"
                        urgent={displayPending > 0}
                    />
                    <ProgressRail
                        label="Progreso de Pagos"
                        percentage={displayTotal > 0 ? (displayPaid / displayTotal) * 100 : 0}
                        sub={viewMode === 'total' ? 'Deuda global' : 'Meta del mes'}
                        color="#8b5cf6"
                    />
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
                                        layout="vertical"
                                        data={categoryData}
                                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                    >
                                        <XAxis
                                            type="number"
                                            hide
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "var(--text-main)", fontSize: 12 }}
                                            width={90}
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
                                        <div className="category-icon" style={{ backgroundColor: getBankColor(debt.entity), padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <BankIcon entity={debt.entity} size={32} />
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
