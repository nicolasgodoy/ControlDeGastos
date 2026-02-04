import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './App.css';
import { LayoutDashboard, Wallet, CreditCard, PieChart as ChartIcon, PlusCircle, AlertCircle, X, Check, Clock } from 'lucide-react';
import { useDebts } from './hooks/useDebts';
import { useExpenses } from './hooks/useExpenses';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ConfirmationModal from './components/ConfirmationModal';

// Dashboard Component
function Dashboard({ debts, expenses, loading, error, onToggleStatus }) {
    const totalDebt = debts.reduce((acc, debt) => acc + debt.amount, 0);
    const pendingAmount = debts.filter(d => d.status === 'pending').reduce((a, b) => a + b.amount, 0);
    const paidAmount = debts.filter(d => d.status === 'paid').reduce((a, b) => a + b.amount, 0);

    // Expenses Calculation
    const totalExpenses = expenses ? expenses.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    const totalCombined = totalDebt + totalExpenses;

    // Get only pending debts for upcoming payments
    const pendingDebts = debts.filter(d => d.status === 'pending');

    const chartData = debts.reduce((acc, debt) => {
        const existing = acc.find(item => item.name === debt.entity);
        if (existing) {
            existing.value += debt.amount;
        } else {
            acc.push({ name: debt.entity, value: debt.amount, type: 'debt' });
        }
        return acc;
    }, []);

    // Add Expenses to Chart
    if (expenses && expenses.length > 0) {
        expenses.forEach(exp => {
            const catName = exp.category.charAt(0).toUpperCase() + exp.category.slice(1);
            const existing = chartData.find(item => item.name === catName);
            if (existing) {
                existing.value += exp.amount;
            } else {
                chartData.push({ name: catName, value: exp.amount, type: 'expense' });
            }
        });
    }

    // Color Palettes
    const DEBT_COLORS = ['#ec4899', '#f43f5e', '#a855f7', '#d946ef']; // Pinks/Purples
    const EXPENSE_COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#22d3ee', '#67e8f9']; // Cyans/Blues

    const getEntryColor = (entry, index) => {
        if (entry.type === 'expense') {
            return EXPENSE_COLORS[index % EXPENSE_COLORS.length];
        }
        return DEBT_COLORS[index % DEBT_COLORS.length];
    };

    return (
        <>
            {error && (
                <div className="glass-card error-alert">
                    <AlertCircle color="var(--danger)" />
                    <span>Error cargando datos: {error}</span>
                </div>
            )}

            <section className="stats-grid">
                <div className="glass-card stat-item">
                    <p className="label">Total Real (Mes)</p>
                    <p className="value danger">
                        {loading ? '...' : `$${totalCombined.toLocaleString('es-AR')}`}
                    </p>
                </div>
                <div className="glass-card stat-item">
                    <p className="label">Gastos Variables</p>
                    <p className="value variable">
                        {loading ? '...' : `$${totalExpenses.toLocaleString('es-AR')}`}
                    </p>
                </div>
                <div className="glass-card stat-item">
                    <p className="label">Deudas Fijas</p>
                    <p className="value" style={{ color: 'var(--text-main)' }}>
                        {loading ? '...' : `$${totalDebt.toLocaleString('es-AR')}`}
                    </p>
                </div>
                <div className="glass-card stat-item">
                    <p className="label">Pendiente (Deudas)</p>
                    <p className="value warning">
                        {loading ? '...' : `$${pendingAmount.toLocaleString('es-AR')}`}
                    </p>
                </div>
                <div className="glass-card stat-item">
                    <p className="label">Pagado (Deudas)</p>
                    <p className="value success">
                        {loading ? '...' : `$${paidAmount.toLocaleString('es-AR')}`}
                    </p>
                </div>
            </section>

            <section className="dashboard-main">
                <div className="glass-card main-chart">
                    <h3>Distribución por Entidad</h3>
                    <div className="chart-container">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getEntryColor(entry, index)} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="no-data">Sin datos disponibles</p>
                        )}
                    </div>
                </div>

                <div className="glass-card recent-activity">
                    <h3>Próximos Vencimientos ({pendingDebts.length})</h3>
                    <div className="activity-list scrollable">
                        {loading ? <p>Cargando...</p> : pendingDebts.length === 0 ? (
                            <p className="no-data">No hay deudas pendientes 🎉</p>
                        ) : pendingDebts.map(debt => (
                            <div key={debt.id} className="activity-item">
                                <div className="item-info">
                                    <span className="entity">{debt.entity}</span>
                                    <span className="type">{debt.loanName} - {debt.date}</span>
                                </div>
                                <div className="item-actions">
                                    <span className="amount">
                                        ${debt.amount.toLocaleString('es-AR')}
                                    </span>
                                    <button
                                        className="toggle-btn"
                                        onClick={() => onToggleStatus(debt.id)}
                                        title="Marcar como pagado"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

// Gastos Component
function Gastos({ expenses, loading, onDeleteExpense }) {
    if (loading) return <p>Cargando gastos...</p>;

    return (
        <div className="glass-card page-content">
            <div className="page-header">
                <h2>Registro de Gastos</h2>
                <div className="filter-tabs">
                    <span style={{ color: 'var(--text-dim)' }}>Total: {expenses.length}</span>
                </div>
            </div>

            {expenses.length === 0 ? (
                <div className="coming-soon">
                    <Wallet size={64} strokeWidth={1} />
                    <p>No hay gastos registrados aún.</p>
                </div>
            ) : (
                <div className="debts-table">
                    <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px' }}>
                        <span>Descripción</span>
                        <span>Categoría</span>
                        <span>Fecha</span>
                        <span>Monto</span>
                        <span>Acción</span>
                    </div>
                    <div className="table-body">
                        {expenses.map(expense => (
                            <div key={expense.id} className="table-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px' }}>
                                <span>{expense.description}</span>
                                <span style={{ textTransform: 'capitalize' }}>{expense.category}</span>
                                <span>{expense.date}</span>
                                <span>${expense.amount.toLocaleString('es-AR')}</span>
                                <span>
                                    <button
                                        className="action-btn"
                                        style={{ color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.1)' }}
                                        onClick={() => onDeleteExpense(expense.id)}
                                        title="Eliminar gasto"
                                    >
                                        <X size={16} />
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Deudas Component
function Deudas({ debts, loading, onToggleStatus }) {
    const [filter, setFilter] = useState('all');

    const filteredDebts = filter === 'all'
        ? debts
        : debts.filter(d => d.status === filter);

    // Sort by Entity (Bank) then by Date
    const sortedDebts = [...filteredDebts].sort((a, b) => {
        // Primary sort: Entity
        if (a.entity < b.entity) return -1;
        if (a.entity > b.entity) return 1;
        // Secondary sort: Date
        return new Date(a.date) - new Date(b.date);
    });

    return (
        <div className="glass-card page-content">
            <div className="page-header">
                <h2>Mis Deudas</h2>
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Todas ({debts.length})
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pendientes ({debts.filter(d => d.status === 'pending').length})
                    </button>
                    <button
                        className={filter === 'paid' ? 'active' : ''}
                        onClick={() => setFilter('paid')}
                    >
                        Pagadas ({debts.filter(d => d.status === 'paid').length})
                    </button>
                </div>
            </div>
            <div className="debts-table">
                <div className="table-header">
                    <span>Entidad</span>
                    <span>Préstamo</span>
                    <span>Fecha</span>
                    <span>Monto</span>
                    <span>Estado</span>
                    <span>Acción</span>
                </div>
                <div className="table-body">
                    {loading ? (
                        <p>Cargando...</p>
                    ) : sortedDebts.map(debt => (
                        <div key={debt.id} className={`table-row ${debt.status}`}>
                            <span>{debt.entity}</span>
                            <span>{debt.loanName}</span>
                            <span>{debt.date}</span>
                            <span>${debt.amount.toLocaleString('es-AR')}</span>
                            <span className={`status ${debt.status}`}>
                                {debt.status === 'paid' ? 'Pagado' : 'Pendiente'}
                            </span>
                            <span>
                                <button
                                    className={`action-btn ${debt.status}`}
                                    onClick={() => onToggleStatus(debt.id, debt.status)}
                                    title={debt.status === 'paid' ? 'Pagado (Bloqueado)' : 'Marcar como pagado'}
                                    disabled={debt.status === 'paid'}
                                    style={debt.status === 'paid' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                    {debt.status === 'paid' ? <Check size={16} /> : <Check size={16} />}
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Toast Component
const Toast = ({ show, message, onClose }) => {
    if (!show) return null;

    // Auto close after 3s
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-container">
            <div className="toast">
                <div className="toast-icon">
                    <Check size={20} />
                </div>
                <div className="toast-content">
                    <span className="toast-title">¡Pago Registrado!</span>
                    <span className="toast-message">{message}</span>
                </div>
            </div>
        </div>
    );
};

// Reportes Component
function Reportes() {
    return (
        <div className="glass-card page-content">
            <h2>Reportes</h2>
            <p className="subtitle">Visualiza estadísticas y tendencias de tus finanzas.</p>
            <div className="coming-soon">
                <ChartIcon size={64} strokeWidth={1} />
                <p>En desarrollo</p>
            </div>
        </div>
    );
}

// Expense Modal Component
function ExpenseModal({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'comida',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        { value: 'comida', label: 'Comida' },
        { value: 'juntadas', label: 'Juntadas' },
        { value: 'kiosko', label: 'Kiosko' },
        { value: 'supermercado', label: 'Supermercado' },
        { value: 'gym', label: 'Gimnasio' },
        { value: 'suplementos', label: 'Suplementos' },
        { value: 'otros', label: 'Otros' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(formData);
        setFormData({
            description: '',
            amount: '',
            category: 'comida',
            date: new Date().toISOString().split('T')[0]
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Nuevo Gasto</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Descripción</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: Almuerzo en el trabajo"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Monto ($)</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Categoría</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="submit-btn">Guardar Gasto</button>
                </form>
            </div>
        </div>
    );
}

// Main App Component
function AppContent() {
    const { debts, loading, error, toggleStatus } = useDebts();
    const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses();

    const [modalOpen, setModalOpen] = useState(false);

    // State for Payment Confirmation
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, debtId: null });

    // State for Expense Deletion Confirmation
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expenseId: null });

    const [toast, setToast] = useState({ show: false, message: '' });
    const location = useLocation();

    // --- Handlers for Debts ---
    const requestPayment = (debtId) => {
        const debt = debts.find(d => d.id === debtId);
        if (!debt || debt.status === 'paid') return;
        setConfirmModal({ isOpen: true, debtId });
    };

    const handleConfirmPayment = async () => {
        if (confirmModal.debtId) {
            await toggleStatus(confirmModal.debtId);
            setConfirmModal({ isOpen: false, debtId: null });
            setToast({ show: true, message: 'La cuota se ha marcado como pagada exitosamente.' });
        }
    };

    // --- Handlers for Expenses ---
    const handleAddExpense = async (data) => {
        const result = await addExpense(data);
        if (result.success) {
            setToast({ show: true, message: 'Gasto registrado correctamente.' });
            setModalOpen(false);
        } else {
            console.error(result.error);
        }
    };

    const requestDeleteExpense = (id) => {
        setDeleteModal({ isOpen: true, expenseId: id });
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.expenseId) {
            const result = await deleteExpense(deleteModal.expenseId);
            if (result.success) {
                setToast({ show: true, message: 'Gasto eliminado.' });
            }
            setDeleteModal({ isOpen: false, expenseId: null });
        }
    };


    const getPageTitle = () => {
        switch (location.pathname) {
            case '/gastos': return 'Gastos del Mes';
            case '/deudas': return 'Mis Deudas';
            case '/reportes': return 'Reportes';
            default: return 'Resumen Mensual';
        }
    };

    return (
        <div className="app-container">
            <nav className="sidebar glass-card">
                <div className="logo">
                    <h2>MoneyFlow</h2>
                </div>
                <ul className="nav-links">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><LayoutDashboard size={20} /> Dashboard</li>
                    </NavLink>
                    <NavLink to="/gastos" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><Wallet size={20} /> Gastos</li>
                    </NavLink>
                    <NavLink to="/deudas" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><CreditCard size={20} /> Deudas</li>
                    </NavLink>
                    <NavLink to="/reportes" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><ChartIcon size={20} /> Reportes</li>
                    </NavLink>
                </ul>
                <button className="add-btn" onClick={() => setModalOpen(true)}>
                    <PlusCircle size={20} /> Nuevo Gasto
                </button>
            </nav>

            <main className="content">
                <header>
                    <h1>{getPageTitle()}</h1>
                    <div className="user-profile">
                        <span>Hola, Usuario</span>
                    </div>
                </header>

                <Routes>
                    <Route path="/" element={<Dashboard debts={debts} expenses={expenses} loading={loading} error={error} onToggleStatus={requestPayment} />} />
                    <Route path="/gastos" element={<Gastos expenses={expenses} loading={expensesLoading} onDeleteExpense={requestDeleteExpense} />} />
                    <Route path="/deudas" element={<Deudas debts={debts} loading={loading} onToggleStatus={requestPayment} />} />
                    <Route path="/reportes" element={<Reportes />} />
                </Routes>
            </main>

            <ExpenseModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleAddExpense}
            />

            {/* Modal Confirmar Pago Deuda */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, debtId: null })}
                onConfirm={handleConfirmPayment}
                title="¿Confirmar Pago?"
                message="Vas a marcar esta cuota como PAGADA. Esta acción no se puede deshacer desde aquí."
            />

            {/* Modal Confirmar Eliminar Gasto */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, expenseId: null })}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar Gasto?"
                message="Esta acción eliminará el gasto permanentemente."
            />

            <Toast
                show={toast.show}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
