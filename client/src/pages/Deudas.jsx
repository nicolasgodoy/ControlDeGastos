import React, { useState, useEffect } from 'react';
import { Check, Filter, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import DebtModal from '../components/DebtModal';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

function Deudas({ debts, loading, onToggleStatus, onAddDebt, onUpdateDebt, onDeleteDebt }) {
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [importModal, setImportModal] = useState({ isOpen: false, file: null });
    const [toast, setToast] = useState({ show: false, message: '' });

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'success', // 'success' | 'error'
        title: '',
        message: ''
    });

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    // Close modal after 3 seconds if success
    useEffect(() => {
        if (statusModal.isOpen && statusModal.type === 'success') {
            const timer = setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [statusModal]);

    // --- Pagination & Filtering State ---
    const [entityFilter, setEntityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, entityFilter]);

    if (loading) return <p>Cargando deudas...</p>;

    // 1. Get Unique Entities for Dropdown
    const uniqueEntities = [...new Set(debts.map(d => d.entity))].sort();

    // 2. Apply Filters
    const filteredDebts = debts.filter(d => {
        // Status Filter
        if (filter !== 'all' && d.status !== filter) return false;
        // Entity Filter
        if (entityFilter !== 'all' && d.entity !== entityFilter) return false;
        return true;
    });

    // 3. Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDebts = filteredDebts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDebts.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSaveDebt = async (data) => {
        let result = { success: true };

        // Handle Single or Schema (Bulk is now handled by the API directly)
        if (editingDebt && !Array.isArray(data)) {
            result = await onUpdateDebt(editingDebt.id, data);
        } else {
            // Even if it's an array (split installments), we send it directly now
            result = await onAddDebt(data);
        }

        if (result.success) {
            showStatus('success', '¡Éxito!', editingDebt ? 'Deuda actualizada correctamente.' : 'Deuda(s) registrada(s) correctamente.');
            setModalOpen(false);
            setEditingDebt(null);
        } else {
            console.error(result.error);
            showStatus('error', 'Error', `Error al guardar: ${result.error}`);
        }
    };

    const confirmDelete = async () => {
        if (deleteModal.id) {
            const result = await onDeleteDebt(deleteModal.id);
            if (result.success) {
                showStatus('success', 'Eliminado', 'La deuda ha sido eliminada.');
            } else {
                showStatus('error', 'Error', 'No se pudo eliminar la deuda.');
            }
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportModal({ isOpen: true, file });
        }
        e.target.value = null; // Reset input
    };

    const confirmImport = async (mode) => {
        const result = await props.importDebts(importModal.file, mode);
        if (result.success) {
            showStatus('success', '¡Éxito!', `Se importaron ${result.count} deudas correctamente.`);
        } else {
            showStatus('error', 'Error', result.error);
        }
        setImportModal({ isOpen: false, file: null });
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        id="excel-upload"
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileSelect}
                    />
                    <button
                        className="action-btn"
                        onClick={() => document.getElementById('excel-upload').click()}
                        style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        title="Importar desde Excel"
                    >
                        Importar Excel
                    </button>
                    <button
                        className="add-btn"
                        onClick={() => { setEditingDebt(null); setModalOpen(true); }}
                        style={{ padding: '0.65rem 1.25rem', fontSize: '1rem', boxShadow: 'none' }}
                    >
                        <PlusCircle size={18} /> Nueva Deuda
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', background: 'var(--card-bg)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    <Filter size={18} />
                    <span>Filtros:</span>
                </div>

                {/* Status Filter */}
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Todas
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pendientes
                    </button>
                    <button
                        className={filter === 'paid' ? 'active' : ''}
                        onClick={() => setFilter('paid')}
                    >
                        Pagadas
                    </button>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

                {/* Entity Filter */}
                <select
                    value={entityFilter}
                    onChange={e => setEntityFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer',
                        maxWidth: '200px'
                    }}
                >
                    <option value="all">Todas las Entidades</option>
                    {uniqueEntities.map(entity => (
                        <option key={entity} value={entity}>{entity}</option>
                    ))}
                </select>
            </div>

            <div className="glass-card">
                <div className="debts-table">
                    <div className="table-header deudas-grid">
                        <span>Entidad</span>
                        <span>Préstamo</span>
                        <span>Vencimiento</span>
                        <span>Monto</span>
                        <span>Estado</span>
                        <span>Acciones</span>
                    </div>
                    <div className="table-body">
                        {currentDebts.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                No hay deudas encontradas.
                            </div>
                        ) : (
                            currentDebts.map(debt => (
                                <div key={debt.id} className={`table-row deudas-grid ${debt.status === 'paid' ? 'paid-row' : ''}`}>
                                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{debt.entity}</span>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{debt.loanName}</span>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        {new Date(debt.date).toLocaleDateString()}
                                    </span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-main)' }}>
                                        ${debt.amount.toLocaleString('es-AR')}
                                    </span>
                                    <span>
                                        <span className={`status ${debt.status}`} style={{
                                            width: '100%',
                                            display: 'inline-block', // Ensure it respects width
                                            textAlign: 'center'
                                        }}>
                                            {debt.status === 'pending' ? 'Pendiente' : 'Pagado'}
                                        </span>
                                    </span>
                                    <span style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={`action-btn check ${debt.status}`}
                                            onClick={() => {
                                                if (debt.status !== 'paid') {
                                                    onToggleStatus(debt.id, debt.status);
                                                }
                                            }}
                                            title={debt.status === 'paid' ? 'Pagado (Bloqueado)' : 'Marcar como pagado'}
                                            disabled={debt.status === 'paid'}
                                            style={debt.status === 'paid' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                        >
                                            <Check size={16} strokeWidth={2} />
                                        </button>

                                        {/* Only show Edit if NOT paid */}
                                        {debt.status !== 'paid' && (
                                            <button
                                                className="action-btn edit"
                                                onClick={() => { setEditingDebt(debt); setModalOpen(true); }}
                                                title="Editar"
                                            >
                                                <Pencil size={16} strokeWidth={1.5} />
                                            </button>
                                        )}
                                        <button
                                            className="action-btn delete"
                                            onClick={() => setDeleteModal({ isOpen: true, id: debt.id })}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} strokeWidth={1.5} />
                                        </button>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', gap: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Anterior
                        </button>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            Página <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> de {totalPages}
                        </span>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <DebtModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveDebt}
                initialData={editingDebt}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Eliminar Deuda"
                message="¿Estás seguro de que deseas eliminar esta deuda? Esta acción no se puede deshacer."
            />

            <Toast
                show={toast.show}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {/* Import Confirmation Modal */}
            {importModal.isOpen && (
                <div className="modal-overlay" onClick={() => setImportModal({ isOpen: false, file: null })}>
                    <div className="modal glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Importar Deudas</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Has seleccionado: <strong>{importModal.file?.name}</strong>.
                            <br /><br />
                            ¿Cómo deseas procesar los datos?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="add-btn"
                                onClick={() => confirmImport('append')}
                                style={{ width: '100%', background: 'var(--primary)' }}
                            >
                                Sumar a las actuales
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => confirmImport('replace')}
                                style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            >
                                Reemplazar todas
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => setImportModal({ isOpen: false, file: null })}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Status Modal (Custom Alert) */}
            {statusModal.isOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 1000 }}
                    onClick={() => statusModal.type === 'error' && setStatusModal({ ...statusModal, isOpen: false })}
                >
                    <div
                        className="glass-card"
                        onClick={e => e.stopPropagation()}
                        style={{
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center',
                            border: statusModal.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                            background: 'rgba(20, 20, 25, 0.95)'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: statusModal.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: statusModal.type === 'error' ? '#ef4444' : '#10b981',
                            fontSize: '1.75rem'
                        }}>
                            {statusModal.type === 'error' ? '!' : '✓'}
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{statusModal.title}</h3>
                        <p style={{ color: 'var(--text-dim)', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                            {statusModal.message}
                        </p>

                        <button
                            onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                            style={{
                                background: statusModal.type === 'error' ? '#ef4444' : 'var(--primary)',
                                color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px',
                                fontSize: '1rem', fontWeight: '500', cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            {statusModal.type === 'error' ? 'Entendido' : 'Aceptar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Deudas;
