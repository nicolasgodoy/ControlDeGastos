import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    PieChart as ChartIcon,
    PlusCircle,
    Sun,
    Moon,
    Users,
    LogOut,
    TrendingUp,
    DollarSign
} from 'lucide-react';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';

import ExpenseModal from './components/ExpenseModal';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';

// Lazy load pages for bundle optimization (bundle-dynamic-imports)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Gastos = React.lazy(() => import('./pages/Gastos'));
const Deudas = React.lazy(() => import('./pages/Deudas'));
const DebtForm = React.lazy(() => import('./pages/DebtForm'));
const Reportes = React.lazy(() => import('./pages/Reportes'));
const Juntadas = React.lazy(() => import('./pages/Juntadas'));
const Ingresos = React.lazy(() => import('./pages/Ingresos'));
const Balance = React.lazy(() => import('./pages/Balance'));
const Login = React.lazy(() => import('./pages/Login'));

// Loading component for Suspense
const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
        Cargando página...
    </div>
);

// Main App Component
function AppContent() {
    const { user, logout } = useAuth();
    const {
        debts,
        debtsLoading: loading,
        debtsError: error,
        toggleDebtStatus: toggleStatus,
        bulkUpdateDebtStatus: bulkUpdateStatus,
        addDebt,
        updateDebt,
        deleteDebt,
        importDebts,
        deleteAllDebts,
        expenses,
        expensesLoading,
        addExpense,
        deleteExpense,
        updateExpense,
        deleteAllExpenses,
        incomes,
        incomesLoading,
        globalLoading
    } = useData();

    // --- Handlers for Expenses ---
    const [editingExpense, setEditingExpense] = useState(null);

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

    const handleSaveExpense = async (data) => {
        let result;
        if (editingExpense) {
            result = await updateExpense(editingExpense.id, data);
        } else {
            result = await addExpense(data);
        }

        if (result.success) {
            setToast({ show: true, message: editingExpense ? 'Gasto actualizado.' : 'Gasto registrado correctamente.' });
            setModalOpen(false);
            setEditingExpense(null); // Reset
        } else {
            console.error(result.error);
        }
    };

    const requestDeleteExpense = (id) => {
        setDeleteModal({ isOpen: true, expenseId: id });
    };

    const requestEditExpense = (expense) => {
        setEditingExpense(expense);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingExpense(null);
    }

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
            case '/ingresos': return 'Mis Ingresos';
            case '/balance': return 'Balance Financiero';
            case '/reportes': return 'Reportes';
            case '/juntadas': return 'Dividir Gastos';
            default: return 'Resumen Mensual';
        }
    };

    // --- Theme Logic ---
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="app-container">
            <nav className="sidebar glass-card">
                <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f16363 0%, #e9700c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '1.5rem',
                        flexShrink: 0
                    }}>
                        M
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: 'var(--text-main)' }}>MoneyFlow</h2>
                        <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-dim)' }}>Control de Gastos</p>
                    </div>
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
                    <NavLink to="/ingresos" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><TrendingUp size={20} /> Ingresos</li>
                    </NavLink>
                    <NavLink to="/balance" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><DollarSign size={20} /> Balance</li>
                    </NavLink>
                    <NavLink to="/reportes" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><ChartIcon size={20} /> Reportes</li>
                    </NavLink>
                    <NavLink to="/juntadas" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><Users size={20} /> Juntadas</li>
                    </NavLink>
                </ul>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="action-btn" onClick={logout} style={{ border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </div>
            </nav>

            <main className="content">
                <header>
                    <h1>{getPageTitle()}</h1>
                    <div className="user-profile">
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle"
                            title={theme === 'dark' ? "Activar Modo Claro" : "Activar Modo Oscuro"}
                        >
                            {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                        </button>
                        <span>Hola, {user.displayName || user.email?.split('@')[0]}</span>
                    </div>
                </header>

                <React.Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Dashboard debts={debts} expenses={expenses} incomes={incomes} loading={loading} error={error} onToggleStatus={requestPayment} />} />
                        <Route path="/gastos" element={<Gastos expenses={expenses} loading={expensesLoading} onDeleteExpense={requestDeleteExpense} onEditExpense={requestEditExpense} onAddExpense={() => { setEditingExpense(null); setModalOpen(true); }} onDeleteAll={deleteAllExpenses} />} />
                        <Route path="/deudas" element={<Deudas debts={debts} loading={loading} onToggleStatus={requestPayment} onBulkStatus={bulkUpdateStatus} onDeleteDebt={deleteDebt} importDebts={importDebts} onDeleteAll={deleteAllDebts} />} />
                        <Route path="/deudas/nueva" element={<DebtForm />} />
                        <Route path="/deudas/editar/:id" element={<DebtForm />} />
                        <Route path="/ingresos" element={<Ingresos />} />
                        <Route path="/balance" element={<Balance />} />
                        <Route path="/reportes" element={<Reportes expenses={expenses} debts={debts} loading={loading || expensesLoading} />} />
                        <Route path="/juntadas" element={<Juntadas />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </React.Suspense>
            </main>

            <ExpenseModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveExpense}
                initialData={editingExpense}
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

            {/* Bottom Mobile Navigation */}
            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                    <LayoutDashboard size={24} />
                </NavLink>
                <NavLink to="/gastos" className={({ isActive }) => isActive ? 'active' : ''}>
                    <Wallet size={24} />
                </NavLink>
                <NavLink to="/deudas" className={({ isActive }) => isActive ? 'active' : ''}>
                    <CreditCard size={24} />
                </NavLink>
                <NavLink to="/ingresos" className={({ isActive }) => isActive ? 'active' : ''}>
                    <TrendingUp size={24} />
                </NavLink>
                <NavLink to="/balance" className={({ isActive }) => isActive ? 'active' : ''}>
                    <DollarSign size={24} />
                </NavLink>

                {/* Nuevo Gasto button removed from bottom nav */}
                <NavLink to="/reportes" className={({ isActive }) => isActive ? 'active' : ''}>
                    <ChartIcon size={24} />
                </NavLink>
                <NavLink to="/juntadas" className={({ isActive }) => isActive ? 'active' : ''}>
                    <Users size={24} />
                </NavLink>
                <button onClick={logout} className="mobile-logout-btn">
                    <LogOut size={24} />
                </button>
            </nav>

            <Toast
                show={toast.show}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
}

// AuthGate: only mounts DataProvider when user is authenticated
// This prevents the Firebase hooks inside DataProvider from running without a user
function AuthGate() {
    const { user, loading } = useAuth();

    if (loading) return null; // wait for auth to resolve

    if (!user) {
        return (
            <React.Suspense fallback={null}>
                <Login />
            </React.Suspense>
        );
    }

    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AuthGate />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
