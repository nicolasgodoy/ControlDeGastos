import React, { useState } from 'react';
import { PlusCircle, Edit2, Trash2, TrendingUp, Calendar, DollarSign, Filter } from 'lucide-react';
import { useIncome } from '../hooks/useIncome';
import IncomeModal from '../components/IncomeModal';
import ConfirmationModal from '../components/ConfirmationModal';

const Ingresos = () => {
    const { incomes, loading, addIncome, updateIncome, deleteIncome } = useIncome();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, incomeId: null });
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const handleSaveIncome = async (data) => {
        let result;
        if (editingIncome) {
            result = await updateIncome(editingIncome.id, data);
        } else {
            result = await addIncome(data);
        }

        if (result.success) {
            setModalOpen(false);
            setEditingIncome(null);
        } else {
            console.error(result.error);
            alert('Error al guardar el ingreso');
        }
    };

    const handleEdit = (income) => {
        setEditingIncome(income);
        setModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteModal.incomeId) {
            const result = await deleteIncome(deleteModal.incomeId);
            if (!result.success) {
                alert('Error al eliminar el ingreso');
            }
            setDeleteModal({ isOpen: false, incomeId: null });
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingIncome(null);
    };

    // Filter incomes by selected month
    const filteredIncomes = incomes.filter(income => {
        if (!filterMonth) return true;
        return income.date.startsWith(filterMonth);
    });

    const totalIncome = filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Sueldo': '#10b981',
            'Freelance': '#3b82f6',
            'Inversión': '#8b5cf6',
            'Alquiler': '#f59e0b',
            'Venta': '#ec4899',
            'Otro': '#6b7280'
        };
        return colors[category] || colors['Otro'];
    };

    if (loading) {
        return <div className="loading">Cargando ingresos...</div>;
    }

    return (
        <div className="section">
            <div className="section-header">
                <div>
                    <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Mis Ingresos</h2>
                    <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                        Total del mes: <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{formatCurrency(totalIncome)}</strong>
                    </p>
                </div>
                <button
                    className="add-btn"
                    onClick={() => { setEditingIncome(null); setModalOpen(true); }}
                >
                    <PlusCircle size={20} /> Agregar Ingreso
                </button>
            </div>

            <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} />
                    <span>Filtrar por mes:</span>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)'
                        }}
                    />
                </label>
            </div>

            {filteredIncomes.length === 0 ? (
                <div className="empty-state glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <TrendingUp size={64} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem' }} />
                    <h3>No hay ingresos registrados</h3>
                    <p style={{ color: 'var(--text-dim)' }}>
                        Comienza agregando tu primer ingreso para tener un mejor control de tu balance mensual.
                    </p>
                    <button
                        className="add-btn"
                        onClick={() => setModalOpen(true)}
                        style={{ marginTop: '1rem' }}
                    >
                        <PlusCircle size={20} /> Agregar Ingreso
                    </button>
                </div>
            ) : (
                <div className="income-grid">
                    {filteredIncomes.map(income => (
                        <div key={income.id} className="income-card glass-card">
                            <div className="income-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div
                                        className="income-icon"
                                        style={{
                                            background: `${getCategoryColor(income.category)}20`,
                                            color: getCategoryColor(income.category),
                                            padding: '0.5rem',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{income.source}</h3>
                                        <span
                                            className="category-badge"
                                            style={{
                                                fontSize: '0.75rem',
                                                color: getCategoryColor(income.category),
                                                background: `${getCategoryColor(income.category)}20`,
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                display: 'inline-block',
                                                marginTop: '0.25rem'
                                            }}
                                        >
                                            {income.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="income-actions">
                                    <button onClick={() => handleEdit(income)} className="icon-btn" title="Editar">
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, incomeId: income.id })}
                                        className="icon-btn danger"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="income-details">
                                <div className="income-amount" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', margin: '1rem 0' }}>
                                    {formatCurrency(income.amount)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                    <Calendar size={16} />
                                    <span>{formatDate(income.date)}</span>
                                    {income.recurring && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }}>
                                            Recurrente
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <IncomeModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveIncome}
                initialData={editingIncome}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, incomeId: null })}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar Ingreso?"
                message="Esta acción eliminará el ingreso permanentemente."
            />

            <style jsx>{`
                .income-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .income-card {
                    padding: 1.5rem;
                    transition: transform 0.2s;
                }

                .income-card:hover {
                    transform: translateY(-4px);
                }

                .income-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .income-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .icon-btn {
                    background: var(--bg-subtle);
                    border: 1px solid var(--glass-border);
                    padding: 0.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-dim);
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-main);
                }

                .icon-btn.danger:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                @media (max-width: 768px) {
                    .income-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default Ingresos;
