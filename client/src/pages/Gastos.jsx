import React from 'react';
import { Pencil, Trash2, X, PlusCircle } from 'lucide-react';
import { getCategoryColor } from '../constants/colors';

// Colors refactored to use centralized getCategoryColor helper

function Gastos({ expenses, loading, onDeleteExpense, onEditExpense, onAddExpense }) {

    if (loading) return <p>Cargando gastos...</p>;

    return (
        <div className="fade-in">
            <div className="top-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontWeight: '700' }}>Registro de Gastos</h2>
                <button
                    className="add-btn"
                    onClick={onAddExpense}
                    style={{ margin: 0 }}
                >
                    <PlusCircle size={18} />
                    <span>Nuevo Gasto</span>
                </button>
            </div>

            {expenses.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No hay gastos registrados.
                </div>
            ) : (
                <div className="glass-card">
                    <div className="table-container">
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                            Total: {expenses.length}
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
                                {expenses.map(expense => {
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
        </div>
    );
}

export default Gastos;
