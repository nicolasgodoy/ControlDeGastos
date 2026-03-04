import React, { useState } from 'react';
import { Pencil, Trash2, X, PlusCircle, Filter, Calendar } from 'lucide-react';
import { getCategoryColor } from '../constants/colors';
import ConfirmationModal from '../components/ConfirmationModal';

function Gastos({ expenses, loading, onDeleteExpense, onEditExpense, onAddExpense, onDeleteAll }) {
    const [deleteAllModal, setDeleteAllModal] = useState(false);
    // --- Month selector ---
    const todayISO = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
    const [selectedMonth, setSelectedMonth] = useState(todayISO);
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Build last 12 months as options
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        monthOptions.push({ value, label });
    }

    // Get unique categories from all expenses
    const uniqueCategories = [...new Set(expenses.map(e => e.category))].sort();

    // Filter expenses
    const filteredExpenses = expenses.filter(exp => {
        const matchesMonth = exp.date?.startsWith(selectedMonth);
        const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
        return matchesMonth && matchesCategory;
    });

    const totalFiltered = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    if (loading) return <p>Cargando gastos...</p>;

    return (
        <div className="fade-in">
            <div className="top-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontWeight: '700' }}>Registro de Gastos</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {expenses.length > 0 && (
                        <button
                            className="action-btn"
                            onClick={() => setDeleteAllModal(true)}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Trash2 size={18} />
                            <span>Eliminar Todo</span>
                        </button>
                    )}
                    <button
                        className="add-btn"
                        onClick={onAddExpense}
                        style={{ margin: 0 }}
                    >
                        <PlusCircle size={18} />
                        <span>Nuevo Gasto</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: 'var(--card-bg)',
                padding: '1rem',
                borderRadius: '1rem',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    <Filter size={18} />
                    <span>Filtros:</span>
                </div>

                {/* Month selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--text-dim)" />
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
                            textTransform: 'capitalize'
                        }}
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value} style={{ background: 'var(--card-bg)', textTransform: 'capitalize' }}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.25rem' }}></div>

                {/* Category filter */}
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer',
                        maxWidth: '200px',
                        textTransform: 'capitalize'
                    }}
                >
                    <option value="all" style={{ background: 'var(--card-bg)' }}>Todas las Categorías</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat} style={{ background: 'var(--card-bg)', textTransform: 'capitalize' }}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {filteredExpenses.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No hay gastos registrados para este período.
                </div>
            ) : (
                <div className="glass-card">
                    <div className="table-container">
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><strong style={{ color: 'var(--text-main)' }}>{filteredExpenses.length}</strong> gasto{filteredExpenses.length !== 1 ? 's' : ''}</span>
                            <span>Total: <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>${totalFiltered.toLocaleString('es-AR')}</strong></span>
                        </div>
                        <div className="debts-table">
                            <div className="table-header gastos-grid" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px' }}>
                                <span>Descripción</span>
                                <span>Categoría</span>
                                <span>Fecha</span>
                                <span>Monto</span>
                                <span>Acción</span>
                            </div>
                            <div className="table-body">
                                {filteredExpenses.map(expense => {
                                    const categoryColor = getCategoryColor(expense.category);
                                    return (
                                        <div key={expense.id} className="table-row gastos-grid" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px' }}>
                                            <div style={{ fontWeight: '500', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                                                {expense.description}
                                            </div>
                                            <div className="entity-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="entity-dot" style={{ backgroundColor: categoryColor }}></div>
                                                <span className="category-tag">
                                                    {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                                                </span>
                                            </div>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                                {new Date(expense.date).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-main)' }}>
                                                ${expense.amount.toLocaleString('es-AR')}
                                            </span>
                                            <span style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => onEditExpense(expense)}
                                                    title="Editar gasto"
                                                >
                                                    <Pencil size={18} strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => onDeleteExpense(expense.id)}
                                                    title="Eliminar gasto"
                                                >
                                                    <X size={18} strokeWidth={1.5} />
                                                </button>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Confirmar Eliminar Todas */}
            <ConfirmationModal
                isOpen={deleteAllModal}
                onClose={() => setDeleteAllModal(false)}
                onConfirm={async () => {
                    await onDeleteAll();
                    setDeleteAllModal(false);
                }}
                title="¿Eliminar Todos los Gastos?"
                message="Esta acción eliminará TODOS los gastos de forma permanente. No se puede deshacer."
            />
        </div>
    );
}

export default Gastos;
