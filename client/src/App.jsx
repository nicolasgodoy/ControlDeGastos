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
    LogOut
} from 'lucide-react';
import { useDebts } from './hooks/useDebts';
import { useExpenses } from './hooks/useExpenses';

// Auth
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Dashboard from './pages/Dashboard';
import Gastos from './pages/Gastos';
import Deudas from './pages/Deudas';
import Reportes from './pages/Reportes';
import Juntadas from './pages/Juntadas';
import Login from './pages/Login';
import ExpenseModal from './components/ExpenseModal';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';

// Main App Component
function AppContent() {
    const { user, logout } = useAuth();
    const { debts, loading, error, toggleStatus, addDebt, updateDebt, deleteDebt } = useDebts();

    // --- Handlers for Expenses ---
    const [editingExpense, setEditingExpense] = useState(null);
    const { expenses, loading: expensesLoading, addExpense, deleteExpense, updateExpense } = useExpenses();

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

    if (!user) {
        return <Login />;
    }

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
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
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
                    <NavLink to="/reportes" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><ChartIcon size={20} /> Reportes</li>
                    </NavLink>
                    <NavLink to="/juntadas" className={({ isActive }) => isActive ? 'active' : ''}>
                        <li><Users size={20} /> Juntadas</li>
                    </NavLink>
                </ul>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="add-btn" onClick={() => { setEditingExpense(null); setModalOpen(true); }} style={{ boxShadow: 'none' }}>
                        <PlusCircle size={20} /> Nuevo Gasto
                    </button>
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
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}
                            title={theme === 'dark' ? "Activar Modo Claro" : "Activar Modo Oscuro"}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <span>Hola, {user.displayName || user.email?.split('@')[0]}</span>
                    </div>
                </header>

                <Routes>
                    <Route path="/" element={<Dashboard debts={debts} expenses={expenses} loading={loading} error={error} onToggleStatus={requestPayment} />} />
                    <Route path="/gastos" element={<Gastos expenses={expenses} loading={expensesLoading} onDeleteExpense={requestDeleteExpense} onEditExpense={requestEditExpense} />} />
                    <Route path="/deudas" element={<Deudas debts={debts} loading={loading} onToggleStatus={requestPayment} onAddDebt={addDebt} onUpdateDebt={updateDebt} onDeleteDebt={deleteDebt} />} />
                    <Route path="/reportes" element={<Reportes expenses={expenses} debts={debts} loading={loading || expensesLoading} />} />
                    <Route path="/juntadas" element={<Juntadas />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
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
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
