import React from 'react';
import { Pencil, Trash2, X } from 'lucide-react';

function Gastos({ expenses, loading, onDeleteExpense, onEditExpense }) {

    if (loading) return <p>Cargando gastos...</p>;

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Registro de Gastos</h2>

            {expenses.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No hay gastos registrados.
                </div>
            ) : (
                <div className="glass-card">
                    <div className="table-container">
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                            Total: {expenses.length}
                        </div>
                        <div className="debts-table"> {/* Reusing logic for consistency */}
                            <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px' }}>
                                <span>Descripción</span>
                                <span>Categoría</span>
                                <span>Fecha</span>
                                <span>Monto</span>
                                <span>Acción</span>
                            </div>
                            <div className="table-body">
                                {expenses.map(expense => (
                                    <div key={expense.id} className="table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px' }}>
                                        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{expense.description}</span>
                                        <span>
                                            <span className="category-tag">
                                                {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                                            </span>
                                        </span>
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
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Gastos;
